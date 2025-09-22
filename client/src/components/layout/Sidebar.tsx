import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import ThemeToggle from "../ThemeToggle"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  return (
    <div className={cn("pb-12 border-r", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold">Dashboard</h2>
          <div className="space-y-1">
            <ScrollArea className="h-[calc(100vh-10rem)] px-2">
              <nav className="flex flex-col space-y-1">
                <a
                  href="#"
                  className="flex items-center rounded-lg px-3 py-2 text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
                >
                  <span className="ml-3">Overview</span>
                </a>
                <a
                  href="#"
                  className="flex items-center rounded-lg px-3 py-2 text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
                >
                  <span className="ml-3">Analytics</span>
                </a>
                <a
                  href="#"
                  className="flex items-center rounded-lg px-3 py-2 text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
                >
                  <span className="ml-3">Reports</span>
                </a>
                <a
                  href="#"
                  className="flex items-center rounded-lg px-3 py-2 text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
                >
                  <span className="ml-3">Settings</span>
                </a>
              </nav>
            </ScrollArea>
          </div>
        </div>
      </div>
      <div className="mt-auto px-3">
        <ThemeToggle />
      </div>
    </div>
  )
}