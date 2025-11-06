"use client"

import { Clock, FolderKanban, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

interface BottomNavProps {
  activeTab: "clock" | "projects" | "overview"
  onTabChange: (tab: "clock" | "projects" | "overview") => void
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
      <div className="flex items-center justify-around h-20 max-w-lg mx-auto px-4">
        <button
          onClick={() => onTabChange("clock")}
          className={cn(
            "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
            activeTab === "clock" ? "text-primary" : "text-muted-foreground",
          )}
        >
          <Clock className="h-6 w-6" />
          <span className="text-xs font-medium">Klok</span>
        </button>

        <button
          onClick={() => onTabChange("projects")}
          className={cn(
            "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
            activeTab === "projects" ? "text-primary" : "text-muted-foreground",
          )}
        >
          <FolderKanban className="h-6 w-6" />
          <span className="text-xs font-medium">Projecten</span>
        </button>

        <button
          onClick={() => onTabChange("overview")}
          className={cn(
            "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
            activeTab === "overview" ? "text-primary" : "text-muted-foreground",
          )}
        >
          <FileText className="h-6 w-6" />
          <span className="text-xs font-medium">Overzicht</span>
        </button>
      </div>
    </nav>
  )
}
