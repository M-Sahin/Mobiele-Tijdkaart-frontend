"use client"

import { useState, useEffect } from "react"
import { Plus, MoreVertical, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getProjecten, createProject, updateProject, deleteProject, type Project } from "@/src/lib/api"

interface ProjectsTabProps {
  isDialogOpen?: boolean
  onDialogOpenChange?: (open: boolean) => void
}

export function ProjectsTab({ isDialogOpen: externalDialogOpen, onDialogOpenChange }: ProjectsTabProps = {}) {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [internalDialogOpen, setInternalDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [projectName, setProjectName] = useState("")
  const [klantnaam, setKlantnaam] = useState("")
  const [uurtarief, setUurtarief] = useState("")

  // Use external control if provided, otherwise use internal state
  const isDialogOpen = externalDialogOpen !== undefined ? externalDialogOpen : internalDialogOpen
  const setIsDialogOpen = onDialogOpenChange || setInternalDialogOpen

  // Load projects from API
  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setIsLoading(true)
      const data = await getProjecten()
      setProjects(data)
      setError("")
    } catch (err) {
      console.error('Failed to load projects:', err)
      setError('Kon projecten niet laden')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProject = async () => {
    if (!projectName.trim()) {
      setError('Projectnaam is verplicht')
      return
    }

    try {
      const uurtariefNumber = uurtarief ? parseFloat(uurtarief) : undefined
      
      if (editingProject) {
        // Update existing project
        await updateProject(editingProject.id, projectName, klantnaam || undefined, uurtariefNumber)
      } else {
        // Create new project
        await createProject(projectName, klantnaam || undefined, uurtariefNumber)
      }
      
      await fetchProjects()
      setProjectName("")
      setKlantnaam("")
      setUurtarief("")
      setEditingProject(null)
      setIsDialogOpen(false)
      setError("")
    } catch (err) {
      console.error('Failed to save project:', err)
      setError('Kon project niet opslaan')
    }
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setProjectName(project.naam)
    setKlantnaam(project.klantnaam || "")
    setUurtarief(project.uurtarief?.toString() || "")
    setIsDialogOpen(true)
  }

  const handleDeleteProject = async (id: number) => {
    if (!confirm('Weet je zeker dat je dit project wilt verwijderen?')) {
      return
    }

    try {
      await deleteProject(id)
      await fetchProjects()
    } catch (err) {
      console.error('Failed to delete project:', err)
      setError('Kon project niet verwijderen')
    }
  }

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setProjectName("")
      setKlantnaam("")
      setUurtarief("")
      setEditingProject(null)
      setError("")
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-6 py-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mijn Projecten</h1>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button size="icon" variant="secondary" className="rounded-full h-10 w-10 cursor-pointer">
              <Plus className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[90vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingProject ? 'Project Bewerken' : 'Nieuw Project'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {error && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="project-name">Projectnaam *</Label>
                <Input
                  id="project-name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Bijv. Website Redesign"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-name">Opdrachtgever</Label>
                <Input
                  id="client-name"
                  value={klantnaam}
                  onChange={(e) => setKlantnaam(e.target.value)}
                  placeholder="Bijv. Acme Corp"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourly-rate">Uurtarief (€)</Label>
                <Input
                  id="hourly-rate"
                  type="number"
                  step="0.01"
                  value={uurtarief}
                  onChange={(e) => setUurtarief(e.target.value)}
                  placeholder="85.00"
                />
              </div>
              <Button onClick={handleSaveProject} className="w-full cursor-pointer">
                {editingProject ? 'Project Bijwerken' : 'Project Toevoegen'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {/* Projects List */}
      <div className="px-6 py-6 space-y-3">
        {isLoading ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Projecten laden...</p>
          </Card>
        ) : projects.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Nog geen projecten. Klik op de + knop om te beginnen.</p>
          </Card>
        ) : (
          projects.map((project) => (
            <Card key={project.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-foreground">{project.naam}</h3>
                  {project.klantnaam && (
                    <p className="text-sm text-muted-foreground mt-1">{project.klantnaam}</p>
                  )}
                  {project.uurtarief && (
                    <p className="text-sm font-medium text-primary mt-2">€{project.uurtarief.toFixed(2)}/uur</p>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="cursor-pointer">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditProject(project)} className="cursor-pointer">
                      <Edit className="h-4 w-4 mr-2" />
                      Bewerken
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeleteProject(project.id)} className="cursor-pointer text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Verwijderen
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
