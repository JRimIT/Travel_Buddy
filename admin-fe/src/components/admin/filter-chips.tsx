export function FilterChips({ chips, onClear }: { chips: { label: string; onRemove: () => void }[]; onClear?: () => void }) {
  if (!chips.length) return null
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip, idx) => (
        <button
          key={idx}
          onClick={chip.onRemove}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs hover:bg-accent/50"
        >
          <span>{chip.label}</span>
          <span className="rounded-full bg-muted px-1.5 text-[10px]">✕</span>
        </button>
      ))}
      {onClear && (
        <button onClick={onClear} className="text-xs text-muted-foreground hover:text-foreground">Clear all</button>
      )}
    </div>
  )
}


