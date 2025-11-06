"use client"

import { useState, useEffect } from "react"
import { Calendar } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiGet, apiPost } from "@/src/lib/api"

interface TimeEntry {
  id: string
  projectName: string
  startTime: string
  endTime: string
  duration: string
}

interface Project {
  id: string
  name: string
  client: string
  isActive: boolean
}

export function ClockTab() {
  const [isClocked, setIsClocked] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [selectedProject, setSelectedProject] = useState<string>("")
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [apiAvailable, setApiAvailable] = useState(false)

  // Fetch projects and recent entries
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Try to load projects from localStorage first
        const cachedProjects = localStorage.getItem('projects')
        if (cachedProjects) {
          const parsedProjects = JSON.parse(cachedProjects)
          setProjects(parsedProjects.filter((p: Project) => p.isActive))
        }
        
        // Try to fetch from API
        try {
          const [projectsData, entriesData] = await Promise.all([
            apiGet<Project[]>('/projects'),
            apiGet<TimeEntry[]>('/time-entries/recent')
          ])
          setProjects(projectsData.filter(p => p.isActive))
          setRecentEntries(entriesData)
          setApiAvailable(true)
        } catch (apiErr) {
          // API not available - continue with cached/empty data
          console.log('API not available, using cached data')
          setApiAvailable(false)
        }
      } catch (err) {
        console.error('Failed to fetch data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isClocked) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isClocked])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleToggleClock = async () => {
    if (!isClocked) {
      setStartTime(new Date())
      setIsClocked(true)
    } else {
      // Stop klokken en sla entry op
      const endTime = new Date()
      
      if (apiAvailable) {
        try {
          await apiPost('/time-entries', {
            projectId: selectedProject,
            startTime: startTime?.toISOString(),
            endTime: endTime.toISOString(),
            duration: elapsedTime
          })
          
          // Refresh recent entries
          const entriesData = await apiGet<TimeEntry[]>('/time-entries/recent')
          setRecentEntries(entriesData)
        } catch (err) {
          console.error('Failed to save time entry:', err)
          // Continue anyway - local state is updated
        }
      } else {
        console.log('API not available, time entry not saved')
      }
      
      setIsClocked(false)
      setElapsedTime(0)
      setStartTime(null)
    }
  }

  const currentDate = new Date().toLocaleDateString("nl-NL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-6 py-6">
        <h1 className="text-2xl font-bold mb-1">Mobiele Tijdkaart</h1>
        <div className="flex items-center gap-2 text-sm opacity-90">
          <Calendar className="h-4 w-4" />
          <span className="capitalize">{currentDate}</span>
        </div>
      </header>

      <div className="px-6 py-6 space-y-6">
        {/* Project Selection */}
        <Card className="p-4">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Actief Project</label>
          <Select value={selectedProject} onValueChange={setSelectedProject} disabled={isLoading}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={isLoading ? "Projecten laden..." : "Selecteer Project"} />
            </SelectTrigger>
            <SelectContent>
              {projects.length === 0 && !isLoading ? (
                <SelectItem value="none" disabled>Geen projecten beschikbaar</SelectItem>
              ) : (
                projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </Card>

        {/* Timer Button */}
        <div className="flex flex-col items-center justify-center py-8">
          {isClocked && (
            <div className="text-5xl font-bold text-foreground mb-6 font-mono">{formatTime(elapsedTime)}</div>
          )}

          <button
            onClick={handleToggleClock}
            disabled={!selectedProject}
            className={`
              w-64 h-64 rounded-full text-white font-bold text-xl
              shadow-lg active:scale-95 transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              ${isClocked ? "bg-destructive hover:bg-destructive/90" : "bg-green-600 hover:bg-green-700"}
            `}
          >
            {isClocked ? "Stop Klokken" : "Start Werktijd"}
          </button>

          {!selectedProject && <p className="text-sm text-muted-foreground mt-4">Selecteer eerst een project</p>}
        </div>

        {/* Recent Entries */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Recente Registraties</h2>
          {isLoading ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Laden...</p>
            </Card>
          ) : recentEntries.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Nog geen registraties</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentEntries.map((entry) => (
                <Card key={entry.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{entry.projectName}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {entry.startTime} - {entry.endTime}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-semibold text-primary">{entry.duration}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
