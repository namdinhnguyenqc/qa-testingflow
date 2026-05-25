"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FolderKanban, Settings, HelpCircle, Activity } from "lucide-react"
import { cn } from "@/lib/utils"

export function Sidebar() {
  const pathname = usePathname()

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/projects", label: "Projects", icon: FolderKanban, matchPrefix: true },
  ]

  const isActive = (item: typeof navItems[0]) => {
    if (item.matchPrefix) {
      return pathname.startsWith(item.href)
    }
    return pathname === item.href
  }

  return (
    <aside className="w-64 bg-card border-r border-border h-screen flex flex-col justify-between shrink-0">
      <div className="flex flex-col">
        {/* Brand Logo */}
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Activity className="w-5 h-5 text-primary-foreground animate-pulse" />
            </div>
            <span className="font-semibold text-lg bg-gradient-to-r from-primary-foreground to-muted-foreground bg-clip-text text-transparent">
              QAFlow AI
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item)
            return (
              <Link
                key={item.href}
                href={item.href === "/projects" ? "/" : item.href} // Phase 00 list project nằm ở dashboard /
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="w-4.5 h-4.5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-border space-y-3">
        <div className="rounded-lg bg-secondary/50 p-3 text-xs space-y-1 border border-border">
          <div className="text-muted-foreground">Version: 0.1.0 (PoC)</div>
          <div className="text-muted-foreground flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Active workspace
          </div>
        </div>
        <div className="flex justify-around text-muted-foreground">
          <HelpCircle className="w-4 h-4 hover:text-foreground cursor-pointer" />
          <Settings className="w-4 h-4 hover:text-foreground cursor-pointer" />
        </div>
      </div>
    </aside>
  )
}
