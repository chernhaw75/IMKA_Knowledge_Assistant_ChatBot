import { Briefcase, Cog, Gauge, Wrench } from "lucide-react"
import { extractionStats } from "@/data/mockData"
import { SectionHeader } from "@/components/dashboard/SectionHeader"
import type { ExtractionStat } from "@/lib/types"
import { cn } from "@/lib/utils"

const iconMeta: Record<ExtractionStat["icon"], { icon: typeof Briefcase; classes: string }> = {
  equipment: { icon: Briefcase, classes: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400" },
  components: { icon: Cog, classes: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400" },
  actions: { icon: Wrench, classes: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400" },
  parameters: { icon: Gauge, classes: "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400" },
}

export function ExtractionStatsCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <SectionHeader
        step={3}
        title="Information Extraction"
        description="Structured information extracted from documents."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {extractionStats.map((stat) => {
          const meta = iconMeta[stat.icon]
          const Icon = meta.icon
          return (
            <div key={stat.label} className={cn("rounded-xl p-4", meta.classes)}>
              <Icon className="size-5" />
              <div className="mt-3 text-xl font-semibold">{stat.value}</div>
              <div className="text-xs opacity-80">{stat.label}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
