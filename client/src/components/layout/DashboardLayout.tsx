import { cn } from "@/lib/utils"
import { ScrollArea } from "../ui/scroll-area"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { useState } from "react"

interface DashboardLayoutProps {
  children: React.ReactNode
  className?: string
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="relative flex h-screen overflow-hidden">
      <Sidebar 
        className={cn(
          "fixed inset-y-0 z-50 transition-transform duration-300 lg:relative",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          !sidebarOpen && "lg:w-20"
        )} 
        isCollapsed={!sidebarOpen}
      />
      <main className="flex-1">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} isSidebarOpen={sidebarOpen} />
        <ScrollArea className="h-[calc(100vh-4rem)] px-4 py-6">
          <div className={cn("mx-auto space-y-4", className)}>
            {children}
          </div>
        </ScrollArea>
      </main>
    </div>
  )
}