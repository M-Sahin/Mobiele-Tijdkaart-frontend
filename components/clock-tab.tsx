"use client"

import { useState, useEffect } from "react"
import { Calendar } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiGet, apiPost, apiPut } from "@/src/lib/api"

interface TimeEntry {
  id: string
  projectId: string
  projectName: string
  startTime: string
  endTime?: string
  duration?: string
}

interface Project {
  id: string
  name: string
  client: string
  hourlyRate: number
  isActive: boolean
}

interface ActiveRegistration {
  id: string
  projectId: string
  projectName: string
  startTime: string
}

export function ClockTab() {
  // State management
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>("")
  const [activeRegistration, setActiveRegistration] = useState<ActiveRegistration | null>(null)
  const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [apiAvailable, setApiAvailable] = useState(false)

  // Fetch projecten en lopende registratie bij mount
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
          const [projectsData, activeTimeData, entriesData] = await Promise.all([
            apiGet<Project[]>('/projects'),
            apiGet<ActiveRegistration | null>('/time-entries/active'),
            apiGet<TimeEntry[]>('/time-entries/recent')
          ])
          
          setProjects(projectsData.filter(p => p.isActive))
          setActiveRegistration(activeTimeData)
          setRecentEntries(entriesData)
          setApiAvailable(true)
          
          // Als er een actieve registratie is, bereken elapsed time
          if (activeTimeData) {
            const startTime = new Date(activeTimeData.startTime)
            const now = new Date()
            const seconds = Math.floor((now.getTime() - startTime.getTime()) / 1000)
            setElapsedTime(seconds)
          }
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

  // Live timer - update elapsed time elke seconde als er een actieve registratie is
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (activeRegistration) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [activeRegistration])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Start klok - POST naar /api/time-entries
  const handleStartClock = async () => {
    if (!selectedProject) {
      return
    }

    if (apiAvailable) {
      try {
        const response = await apiPost<ActiveRegistration>('/time-entries', {
          projectId: selectedProject
        })
        
        setActiveRegistration(response)
        setElapsedTime(0)
        
        // Refresh recent entries
        const entriesData = await apiGet<TimeEntry[]>('/time-entries/recent')
        setRecentEntries(entriesData)
      } catch (err) {
        console.error('Failed to start time entry:', err)
      }
    } else {
      console.log('API not available, cannot start time tracking')
    }
  }

  // Stop klok - PUT naar /api/time-entries/{id}/stop
  const handleStopClock = async () => {
    if (!activeRegistration) {
      return
    }

    if (apiAvailable) {
      try {
        await apiPut(`/time-entries/${activeRegistration.id}/stop`, {})
        
        setActiveRegistration(null)
        setElapsedTime(0)
        setSelectedProject("")
        
        // Refresh recent entries
        const entriesData = await apiGet<TimeEntry[]>('/time-entries/recent')
        setRecentEntries(entriesData)
      } catch (err) {
        console.error('Failed to stop time entry:', err)
      }
    } else {
      console.log('API not available, cannot stop time tracking')
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
        {/* Project Selection - alleen tonen als er geen actieve registratie is */}
        {!activeRegistration && (
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
        )}

        {/* Actief project weergeven tijdens klokken */}
        {activeRegistration && (
          <Card className="p-4 bg-primary/10">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Actief Project</label>
            <p className="text-lg font-semibold text-foreground">{activeRegistration.projectName}</p>
          </Card>
        )}

        {/* Timer Button */}
        <div className="flex flex-col items-center justify-center py-8">
          {activeRegistration && (
            <div className="text-5xl font-bold text-foreground mb-6 font-mono">{formatTime(elapsedTime)}</div>
          )}

          <button
            onClick={activeRegistration ? handleStopClock : handleStartClock}
            disabled={!activeRegistration && !selectedProject}
            className={`
              w-64 h-64 rounded-full text-white font-bold text-xl
              shadow-lg active:scale-95 transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              ${activeRegistration ? "bg-destructive hover:bg-destructive/90" : "bg-green-600 hover:bg-green-700"}
            `}
          >
            {activeRegistration ? "Stop Klokken" : "Start Werktijd"}
          </button>

          {!activeRegistration && !selectedProject && (
            <p className="text-sm text-muted-foreground mt-4">Selecteer eerst een project</p>
          )}
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
