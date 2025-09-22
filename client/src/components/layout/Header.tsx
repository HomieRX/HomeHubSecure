import { UserNav } from "../UserNav"
import ThemeToggle from "../ThemeToggle"
import { Button } from "../ui/button"
import { Menu, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

interface HeaderProps {
  onMenuClick: () => void
  isSidebarOpen: boolean
}

export function Header({ onMenuClick, isSidebarOpen }: HeaderProps) {
  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <Button
          variant="ghost"
          size="icon"
          className="mr-4 lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="mr-4 hidden lg:flex"
          onClick={onMenuClick}
        >
          <ChevronLeft className={cn("h-6 w-6 transition-transform", 
            !isSidebarOpen && "rotate-180"
          )} />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        <div className="font-semibold">HomeHub Secure</div>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeToggle />
          <UserNav />
        </div>
      </div>
    </div>
  )
}