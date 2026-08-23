import { topicRows } from "@/data/mockData"
import { SectionHeader } from "@/components/dashboard/SectionHeader"

export function TopicAnalysisCard() {
  const maxPrevalence = Math.max(...topicRows.map((r) => r.prevalence))

  return (
    <div className="glass rounded-xl border border-border p-4">
      <SectionHeader
        step={2}
        title="Topic Analysis"
        description="Top topics discovered in maintenance knowledge base."
      />

      <div className="grid grid-cols-[100px_1fr_60px] items-center gap-x-4 gap-y-3 text-xs">
        <span className="font-medium text-muted-foreground">Topic</span>
        <span className="col-span-2 font-medium text-muted-foreground">Prevalence</span>

        {topicRows.map((row) => (
          <div key={row.topic} className="contents">
            <span className="flex items-center text-foreground">{row.topic}</span>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${(row.prevalence / maxPrevalence) * 100}%` }}
              />
            </div>
            <span className="text-right font-medium text-foreground">{row.prevalence}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
