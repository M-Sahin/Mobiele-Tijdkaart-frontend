"use client"

import { useState, useEffect } from "react"
import { Calendar } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  getProjecten,
  getLopendeTijdRegistratie,
  startTijdRegistratie,
  stopTijdRegistratie,
  getAlleTijdRegistraties,
  type Project,
  type TijdRegistratie
} from "@/src/lib/api"

export function ClockTab() {
  const [projecten, setProjecten] = useState<Project[]>([])
  const [geselecteerdProjectId, setGeselecteerdProjectId] = useState<number | null>(null)
  const [actieveRegistratie, setActieveRegistratie] = useState<TijdRegistratie | null>(null)
  const [recenteRegistraties, setRecenteRegistraties] = useState<TijdRegistratie[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [tijdGekloktInSeconden, setTijdGekloktInSeconden] = useState(0)
  const [apiAvailable, setApiAvailable] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        try {
          const [projectenData, lopendeRegistratie, alleRegistraties] = await Promise.all([
            getProjecten(),
            getLopendeTijdRegistratie(),
            getAlleTijdRegistraties()
          ])
          setProjecten(projectenData)
          setActieveRegistratie(lopendeRegistratie)
          setRecenteRegistraties(alleRegistraties.slice(0, 5))
          setApiAvailable(true)
          if (lopendeRegistratie) {
            setGeselecteerdProjectId(lopendeRegistratie.projectId)
            const startTijd = new Date(lopendeRegistratie.startTijd)
            const nu = new Date()
            const seconden = Math.floor((nu.getTime() - startTijd.getTime()) / 1000)
            setTijdGekloktInSeconden(seconden)
          }
        } catch (apiErr) {
          console.log("API niet beschikbaar:", apiErr)
          setApiAvailable(false)
        }
      } catch (err) {
        console.error("Fout bij ophalen data:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (!actieveRegistratie) {
      setTijdGekloktInSeconden(0)
      return
    }
    const interval = setInterval(() => {
      setTijdGekloktInSeconden((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [actieveRegistratie])

  const formatSeconds = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      secs.toString().padStart(2, "0")
    ].join(":")
  }

  const formatDateTime = (isoString: string): string => {
    const date = new Date(isoString)
    return date.toLocaleString("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const berekenDuur = (startTijd: string, eindTijd?: string | null): string => {
    const start = new Date(startTijd)
    const eind = eindTijd ? new Date(eindTijd) : new Date()
    const verschilInSeconden = Math.floor((eind.getTime() - start.getTime()) / 1000)
    return formatSeconds(verschilInSeconden)
  }

  const handleStart = async () => {
    if (!geselecteerdProjectId) {
      alert("Selecteer eerst een project")
      return
    }
    if (!apiAvailable) {
      alert("API niet beschikbaar. Controleer je internetverbinding.")
      return
    }
    try {
      const startTijd = new Date().toISOString()
      const nieuweRegistratie = await startTijdRegistratie(geselecteerdProjectId, startTijd)
      setActieveRegistratie(nieuweRegistratie)
      setTijdGekloktInSeconden(0)
      const alleRegistraties = await getAlleTijdRegistraties()
      setRecenteRegistraties(alleRegistraties.slice(0, 5))
    } catch (error) {
      console.error("Error starting timer:", error)
      alert("Kon tijdregistratie niet starten. Probeer het opnieuw.")
    }
  }

  const handleStop = async () => {
    if (!actieveRegistratie) {
      return
    }
    if (!apiAvailable) {
      alert("API niet beschikbaar. Controleer je internetverbinding.")
      return
    }
    try {
      await stopTijdRegistratie(actieveRegistratie.id)
      setActieveRegistratie(null)
      setTijdGekloktInSeconden(0)
      setGeselecteerdProjectId(null)
      const alleRegistraties = await getAlleTijdRegistraties()
      setRecenteRegistraties(alleRegistraties.slice(0, 5))
    } catch (error) {
      console.error("Error stopping timer:", error)
      alert("Kon tijdregistratie niet stoppen. Probeer het opnieuw.")
    }
  }

  const getProjectNaam = (projectId: number): string => {
    const project = projecten.find(p => p.id === projectId)
    return project?.naam || "Onbekend project"
  }

  const currentDate = new Date().toLocaleDateString("nl-NL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="h-full overflow-y-auto">
      <header className="bg-primary text-primary-foreground px-6 py-6">
        <h1 className="text-2xl font-bold mb-1">Mobiele Tijdkaart</h1>
        <div className="flex items-center gap-2 text-sm opacity-90">
          <Calendar className="h-4 w-4" />
          <span className="capitalize">{currentDate}</span>
        </div>
      </header>

      <div className="px-6 py-6 space-y-6">
        {!actieveRegistratie && (
          <Card className="p-4">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Actief Project</label>
            <Select
              value={geselecteerdProjectId?.toString() || ""}
              onValueChange={(value) => setGeselecteerdProjectId(Number(value))}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={isLoading ? "Projecten laden..." : "Selecteer Project"} />
              </SelectTrigger>
              <SelectContent>
                {projecten.length === 0 && !isLoading ? (
                  <SelectItem value="none" disabled>Geen projecten beschikbaar</SelectItem>
                ) : (
                  projecten.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.naam}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </Card>
        )}

        {actieveRegistratie && (
          <Card className="p-4 bg-primary/10">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Actief Project</label>
            <p className="text-lg font-semibold text-foreground">
              {getProjectNaam(actieveRegistratie.projectId)}
            </p>
          </Card>
        )}

        <div className="flex flex-col items-center justify-center py-8">
          {actieveRegistratie && (
            <div className="text-5xl font-bold text-foreground mb-6 font-mono">
              {formatSeconds(tijdGekloktInSeconden)}
            </div>
          )}

          <button
            onClick={actieveRegistratie ? handleStop : handleStart}
            disabled={!actieveRegistratie && !geselecteerdProjectId}
            className={`
              w-64 h-64 rounded-full text-white font-bold text-xl
              shadow-lg active:scale-95 transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              ${actieveRegistratie ? "bg-destructive hover:bg-destructive/90" : "bg-green-600 hover:bg-green-700"}
            `}
          >
            {actieveRegistratie ? "Stop Klokken" : "Start Werktijd"}
          </button>

          {!actieveRegistratie && !geselecteerdProjectId && (
            <p className="text-sm text-muted-foreground mt-4">Selecteer eerst een project</p>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">Recente Registraties</h2>
          {isLoading ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Laden...</p>
            </Card>
          ) : recenteRegistraties.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Nog geen registraties</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {recenteRegistraties.map((registratie) => (
                <Card key={registratie.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">
                        {getProjectNaam(registratie.projectId)}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatDateTime(registratie.startTijd)}
                        {registratie.eindTijd && ` - ${formatDateTime(registratie.eindTijd)}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-semibold text-primary">
                        {berekenDuur(registratie.startTijd, registratie.eindTijd)}
                      </span>
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
