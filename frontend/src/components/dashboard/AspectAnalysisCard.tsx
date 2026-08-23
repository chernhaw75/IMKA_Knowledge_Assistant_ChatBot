import { aspectRows } from "@/data/mockData"
import { SectionHeader } from "@/components/dashboard/SectionHeader"

export function AspectAnalysisCard() {
  const maxMentions = Math.max(...aspectRows.map((r) => r.mentions))

  return (
    <div className="glass rounded-xl border border-border p-4">
      <SectionHeader
        step={1}
        title="Aspect Analysis"
        description="Top aspects mentioned in documents with sentiment overview."
      />

      <div className="grid grid-cols-[100px_1fr_1fr] gap-x-4 gap-y-3 text-xs">
        <span className="font-medium text-muted-foreground">Aspect</span>
        <span className="font-medium text-muted-foreground">Mentions</span>
        <span className="font-medium text-muted-foreground">Negative Sentiment</span>

        {aspectRows.map((row) => (
          <div key={row.aspect} className="contents">
            <span className="flex items-center text-foreground">{row.aspect}</span>
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="brand-gradient h-full rounded-full"
                  style={{ width: `${(row.mentions / maxMentions) * 100}%` }}
                />
              </div>
              <span className="w-9 shrink-0 text-right font-medium text-foreground">{row.mentions}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-red-400"
                  style={{ width: `${(row.negativeSentiment / 30) * 100}%` }}
                />
              </div>
              <span className="w-9 shrink-0 text-right font-medium text-foreground">{row.negativeSentiment}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
