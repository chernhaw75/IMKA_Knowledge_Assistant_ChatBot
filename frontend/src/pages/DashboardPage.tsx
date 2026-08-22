import { Calendar } from "lucide-react"
import { AspectAnalysisCard } from "@/components/dashboard/AspectAnalysisCard"
import { TopicAnalysisCard } from "@/components/dashboard/TopicAnalysisCard"
import { ExtractionStatsCard } from "@/components/dashboard/ExtractionStatsCard"

export function DashboardPage() {
  return (
    <div className="h-full min-h-0 overflow-y-auto p-4">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
              NLP <span className="brand-gradient-text">Insights</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              AI-powered analysis from maintenance manuals, SOPs and technical documents.
            </p>
          </div>
          <button
            type="button"
            className="glass flex shrink-0 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            <Calendar className="size-4 text-muted-foreground" />
            May 12 – Jun 12, 2025
          </button>
        </div>

        <AspectAnalysisCard />
        <TopicAnalysisCard />
        <ExtractionStatsCard />
      </div>
    </div>
  )
}
