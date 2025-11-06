export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full animate-pulse space-y-2">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid grid-cols-12 gap-2">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="col-span-2 h-4 rounded bg-muted" />
          ))}
        </div>
      ))}
    </div>
  )
}


