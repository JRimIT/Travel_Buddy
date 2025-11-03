"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"

export function PageHeader({
  title,
  description,
  breadcrumbs = [],
  actions,
}: {
  title: string
  description?: string
  breadcrumbs?: { label: string; href?: string }[]
  actions?: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      {breadcrumbs.length > 0 && (
        <div className="flex items-center text-sm text-muted-foreground">
          {breadcrumbs.map((bc, idx) => (
            <div key={idx} className="flex items-center">
              {bc.href ? (
                <Link href={bc.href} className="hover:text-foreground transition-colors">
                  {bc.label}
                </Link>
              ) : (
                <span>{bc.label}</span>
              )}
              {idx < breadcrumbs.length - 1 && <ChevronRight className="mx-2 h-4 w-4" />}
            </div>
          ))}
        </div>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}


