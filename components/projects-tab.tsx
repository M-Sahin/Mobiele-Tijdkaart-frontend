"use client"

import { useState, useEffect } from "react"
import { Plus, MoreVertical, Edit, Archive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiGet, apiPost, apiPut } from "@/src/lib/api"

interface Project {
  id: string
  name: string
  client: string
  hourlyRate: number
  isActive: boolean
}

interface ProjectsTabProps {
  isDialogOpen?: boolean
  onDialogOpenChange?: (open: boolean) => void
}

export function ProjectsTab({ isDialogOpen: externalDialogOpen, onDialogOpenChange }: ProjectsTabProps = {}) {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [internalDialogOpen, setInternalDialogOpen] = useState(false)
  const [apiAvailable, setApiAvailable] = useState(false)
  const [newProject, setNewProject] = useState({
    name: "",
    client: "",
    hourlyRate: "",
  })

  // Use external control if provided, otherwise use internal state
  const isDialogOpen = externalDialogOpen !== undefined ? externalDialogOpen : internalDialogOpen
  const setIsDialogOpen = onDialogOpenChange || setInternalDialogOpen

  // Load projects from localStorage or API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true)
        
        // First, try to load from localStorage
        const cachedProjects = localStorage.getItem('projects')
        if (cachedProjects) {
          setProjects(JSON.parse(cachedProjects))
        }
        
        // Try to fetch from API
        try {
          const data = await apiGet<Project[]>('/projects')
          setProjects(data)
          setApiAvailable(true)
          localStorage.setItem('projects', JSON.stringify(data))
        } catch (apiErr) {
          // API not available - use cached data or empty array
          console.log('API not available, using local storage')
          setApiAvailable(false)
        }
      } catch (err) {
        console.error('Failed to load projects:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjects()
  }, [])

  const handleAddProject = async () => {
    if (newProject.name && newProject.client && newProject.hourlyRate) {
      const projectData: Project = {
        id: Date.now().toString(),
        name: newProject.name,
        client: newProject.client,
        hourlyRate: Number.parseFloat(newProject.hourlyRate),
        isActive: true,
      }

      if (apiAvailable) {
        try {
          const createdProject = await apiPost<Project>('/projects', projectData)
          const updatedProjects = [...projects, createdProject]
          setProjects(updatedProjects)
          localStorage.setItem('projects', JSON.stringify(updatedProjects))
        } catch (err) {
          console.error('Failed to create project via API:', err)
          // Fallback to local storage
          const updatedProjects = [...projects, projectData]
          setProjects(updatedProjects)
          localStorage.setItem('projects', JSON.stringify(updatedProjects))
        }
      } else {
        // API not available, save to localStorage only
        const updatedProjects = [...projects, projectData]
        setProjects(updatedProjects)
        localStorage.setItem('projects', JSON.stringify(updatedProjects))
      }

      setNewProject({ name: "", client: "", hourlyRate: "" })
      setIsDialogOpen(false)
    }
  }

  const handleArchiveProject = async (id: string) => {
    const updatedProjects = projects.map((p) => (p.id === id ? { ...p, isActive: false } : p))
    setProjects(updatedProjects)
    localStorage.setItem('projects', JSON.stringify(updatedProjects))

    if (apiAvailable) {
      try {
        await apiPut(`/projects/${id}`, { isActive: false })
      } catch (err) {
        console.error('Failed to archive project via API:', err)
        // Already updated locally, so no need to revert
      }
    }
  }

  const activeProjects = projects.filter((p) => p.isActive)

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-6 py-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mijn Projecten</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="icon" variant="secondary" className="rounded-full h-10 w-10 cursor-pointer">
              <Plus className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[90vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nieuw Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Projectnaam</Label>
                <Input
                  id="project-name"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="Bijv. Website Redesign"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-name">Klantnaam</Label>
                <Input
                  id="client-name"
                  value={newProject.client}
                  onChange={(e) => setNewProject({ ...newProject, client: e.target.value })}
                  placeholder="Bijv. Acme Corp"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourly-rate">Uurtarief (€)</Label>
                <Input
                  id="hourly-rate"
                  type="number"
                  value={newProject.hourlyRate}
                  onChange={(e) => setNewProject({ ...newProject, hourlyRate: e.target.value })}
                  placeholder="85"
                />
              </div>
              <Button onClick={handleAddProject} className="w-full cursor-pointer">
                Project Toevoegen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {/* Projects List */}
      <div className="px-6 py-6 space-y-3">
        {error && (
          <Card className="p-4 bg-destructive/10 text-destructive">
            <p className="text-sm">{error}</p>
          </Card>
        )}
        
        {isLoading ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Projecten laden...</p>
          </Card>
        ) : activeProjects.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Nog geen projecten. Klik op de + knop om te beginnen.</p>
          </Card>
        ) : (
          activeProjects.map((project) => (
            <Card key={project.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-foreground">{project.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{project.client}</p>
                  <p className="text-sm font-medium text-primary mt-2">€{project.hourlyRate}/uur</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="cursor-pointer">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="cursor-pointer">
                      <Edit className="h-4 w-4 mr-2" />
                      Bewerken
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleArchiveProject(project.id)} className="cursor-pointer">
                      <Archive className="h-4 w-4 mr-2" />
                      Inactief Zetten
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
