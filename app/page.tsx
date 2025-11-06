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

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Main Content */}
      <main className="h-[calc(100vh-5rem)]">
        {activeTab === "clock" && <ClockTab />}
        {activeTab === "projects" && <ProjectsTab />}
        {activeTab === "overview" && <OverviewTab />}
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
