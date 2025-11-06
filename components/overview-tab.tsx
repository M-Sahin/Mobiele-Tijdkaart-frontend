"use client"

import { useState, useEffect } from "react"
import { Download, Clock, Car } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiGet } from "@/src/lib/api"

interface TimeEntry {
  id: string
  date: string
  project: string
  hours: number
  rate: number
}

interface MileageEntry {
  id: string
  date: string
  project: string
  kilometers: number
  rate: number
}

export function OverviewTab() {
  const [period, setPeriod] = useState("week")
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [mileageEntries, setMileageEntries] = useState<MileageEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch overview data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [timeData, mileageData] = await Promise.all([
          apiGet<TimeEntry[]>(`/overview/time-entries?period=${period}`),
          apiGet<MileageEntry[]>(`/overview/mileage?period=${period}`)
        ])
        setTimeEntries(timeData)
        setMileageEntries(mileageData)
      } catch (err) {
        console.error('Failed to fetch overview data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [period])

  const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0)
  const totalKilometers = mileageEntries.reduce((sum, entry) => sum + entry.kilometers, 0)
  const totalRevenue = timeEntries.reduce((sum, entry) => sum + entry.hours * entry.rate, 0)

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-6 py-6">
        <h1 className="text-2xl font-bold mb-4">Overzicht</h1>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-full bg-primary-foreground text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Deze Week</SelectItem>
            <SelectItem value="month">Afgelopen Maand</SelectItem>
            <SelectItem value="custom">Aangepast</SelectItem>
          </SelectContent>
        </Select>
      </header>

      <div className="px-6 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Totaal Uren</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{totalHours.toFixed(1)}</p>
            <p className="text-sm text-muted-foreground mt-1">€{totalRevenue.toFixed(2)}</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Car className="h-4 w-4" />
              <span className="text-xs font-medium">Kilometers</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{totalKilometers}</p>
            <p className="text-sm text-muted-foreground mt-1">€{(totalKilometers * 0.23).toFixed(2)}</p>
          </Card>
        </div>

        {/* Data Tabs */}
        <Tabs defaultValue="hours" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="hours">Geklokte Uren</TabsTrigger>
            <TabsTrigger value="mileage">Gereden Ritten</TabsTrigger>
          </TabsList>

          <TabsContent value="hours" className="space-y-3 mt-4">
            {isLoading ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Laden...</p>
              </Card>
            ) : timeEntries.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Geen geklokte uren in deze periode</p>
              </Card>
            ) : (
              timeEntries.map((entry) => (
                <Card key={entry.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{entry.project}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{entry.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-foreground">{entry.hours}u</p>
                      <p className="text-sm text-muted-foreground">€{(entry.hours * entry.rate).toFixed(2)}</p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="mileage" className="space-y-3 mt-4">
            {isLoading ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Laden...</p>
              </Card>
            ) : mileageEntries.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Geen gereden ritten in deze periode</p>
              </Card>
            ) : (
              mileageEntries.map((entry) => (
                <Card key={entry.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{entry.project}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{entry.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-foreground">{entry.kilometers} km</p>
                      <p className="text-sm text-muted-foreground">€{(entry.kilometers * entry.rate).toFixed(2)}</p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Export Button */}
        <Button className="w-full" size="lg">
          <Download className="h-5 w-5 mr-2" />
          Exporteer voor Facturatie
        </Button>
      </div>
    </div>
  )
}
