import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { navigationItems } from "@/config/navigation"
import { Link, useLocation } from "wouter"
import { Button } from "../ui/button"
import ThemeToggle from "../ThemeToggle"
import { ChevronDown } from "lucide-react"
import { useState } from "react"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isCollapsed?: boolean
}

export function Sidebar({ className, isCollapsed = false }: SidebarProps) {
  const [location] = useLocation()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleExpanded = (href: string) => {
    setExpandedItems(prev => 
      prev.includes(href) 
        ? prev.filter(item => item !== href)
        : [...prev, href]
    )
  }

  return (
    <div className={cn(
        "pb-12 border-r flex flex-col",
        isCollapsed ? "w-[70px]" : "w-[240px]",
        "transition-all duration-300 ease-in-out",
        className
      )}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          {!isCollapsed && (
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              HomeHub Secure
            </h2>
          )}
          <div className="space-y-1">
            <ScrollArea className="h-[calc(100vh-10rem)] px-2">
              <div className="space-y-1">
                {navigationItems.map((item) => {
                  const isExpanded = expandedItems.includes(item.href)
                  const isActive = location === item.href || 
                    (item.items?.some(subItem => location === subItem.href))

                  return (
                    <div key={item.href} className="space-y-1">
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full",
                          isCollapsed ? "justify-center p-2" : "justify-start",
                          !isCollapsed && item.items && "justify-between"
                        )}
                        onClick={() => !isCollapsed && item.items ? toggleExpanded(item.href) : null}
                        asChild={!item.items}
                      >
                        {item.items ? (
                          <div className={cn(
                            "flex items-center",
                            !isCollapsed && "justify-between w-full"
                          )}>
                            <div className="flex items-center">
                              <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                              {!isCollapsed && item.title}
                            </div>
                            {!isCollapsed && (
                              <ChevronDown 
                                className={cn(
                                  "h-4 w-4 transition-transform",
                                  isExpanded && "transform rotate-180"
                                )} 
                              />
                            )}
                          </div>
                        ) : (
                          <Link href={item.href}>
                            <div className="flex items-center">
                              <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                              {!isCollapsed && item.title}
                            </div>
                          </Link>
                        )}
                      </Button>
                      
                      {item.items && isExpanded && (
                        <div className="ml-4 space-y-1">
                          {item.items.map((subItem) => (
                            <Button
                              key={subItem.href}
                              variant={location === subItem.href ? "secondary" : "ghost"}
                              className={cn(
                                "w-full",
                                isCollapsed ? "justify-center p-2" : "justify-start"
                              )}
                              asChild
                            >
                              <Link href={subItem.href}>
                                <subItem.icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                                {!isCollapsed && subItem.title}
                              </Link>
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
      <div className="absolute bottom-4 px-3">
        <ThemeToggle />
      </div>
    </div>
  )
}