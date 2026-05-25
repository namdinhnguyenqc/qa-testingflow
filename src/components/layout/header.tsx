"use client"

import Link from "next/link"
import { ChevronRight, Cpu, Moon, User } from "lucide-react"

interface Breadcrumb {
  label: string
  href?: string
}

interface HeaderProps {
  breadcrumbs?: Breadcrumb[]
}

export function Header({ breadcrumbs = [] }: HeaderProps) {
  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-8 shrink-0">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/" className="text-muted-foreground hover:text-foreground font-medium transition-colors">
          QAFlow
        </Link>
        {breadcrumbs.map((crumb, index) => (
          <div key={index} className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
            {crumb.href ? (
              <Link href={crumb.href} className="text-muted-foreground hover:text-foreground font-medium transition-colors">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-foreground font-semibold">{crumb.label}</span>
            )}
          </div>
        ))}
      </div>

      {/* Utilities */}
      <div className="flex items-center gap-4">
        {/* Model Indicator (Mock placeholder for PoC) */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border text-xs text-muted-foreground">
          <Cpu className="w-3.5 h-3.5 text-primary" />
          <span>PoC Mode</span>
        </div>

        {/* Dark Mode Icon */}
        <button className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
          <Moon className="w-4.5 h-4.5" />
        </button>

        {/* User Profile */}
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center border border-border text-muted-foreground cursor-pointer hover:border-primary transition-colors">
          <User className="w-4.5 h-4.5" />
        </div>
      </div>
    </header>
  )
}
