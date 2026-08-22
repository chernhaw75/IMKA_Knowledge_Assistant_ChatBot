import { ExternalLink, Info } from "lucide-react"

interface SectionHeaderProps {
  step: number
  title: string
  description: string
}

export function SectionHeader({ step, title, description }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="brand-gradient flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white">
            {step}
          </span>
          <h3 className="font-display text-sm font-semibold tracking-tight text-foreground">{title}</h3>
          <Info className="size-3.5 text-muted-foreground" />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
      >
        View full report
        <ExternalLink className="size-3.5" />
      </button>
    </div>
  )
}
