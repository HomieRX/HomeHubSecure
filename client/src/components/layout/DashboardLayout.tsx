import { cn } from "@/lib/utils"
import { ScrollArea } from "../ui/scroll-area"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"

interface DashboardLayoutProps {
  children: React.ReactNode
  className?: string
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  return (
    <div className="relative flex h-screen overflow-hidden">
      <Sidebar className="hidden lg:block" />
      <main className="flex-1">
        <Header />
        <ScrollArea className="h-[calc(100vh-4rem)] px-4 py-6">
          <div className={cn("mx-auto space-y-4", className)}>
            {children}
          </div>
        </ScrollArea>
      </main>
    </div>
  )
}