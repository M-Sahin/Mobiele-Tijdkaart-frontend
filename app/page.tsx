"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/src/context/AuthContext"
import { ClockTab } from "@/components/clock-tab"
import { ProjectsTab } from "@/components/projects-tab"
import { OverviewTab } from "@/components/overview-tab"
import { BottomNav } from "@/components/bottom-nav"

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"clock" | "projects" | "overview">("clock")
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)
  const { isLoggedIn } = useAuth()
  const router = useRouter()

  // Client-side auth check
  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login')
    }
  }, [isLoggedIn, router])

  // Show nothing while checking auth
  if (!isLoggedIn) {
    return null
  }

  const handleOpenProjectDialog = () => {
    setActiveTab("projects")
    setProjectDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Main Content */}
      <main className="h-[calc(100vh-5rem)]">
        {activeTab === "clock" && (
          <ClockTab 
            key="clock-tab"
            onNavigateToProjects={() => setActiveTab("projects")}
            onOpenProjectDialog={handleOpenProjectDialog}
          />
        )}
        {activeTab === "projects" && (
          <ProjectsTab 
            key="projects-tab"
            isDialogOpen={projectDialogOpen}
            onDialogOpenChange={setProjectDialogOpen}
          />
        )}
        {activeTab === "overview" && <OverviewTab key="overview-tab" />}
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
