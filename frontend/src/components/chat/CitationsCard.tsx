import { FileText } from "lucide-react"
import type { ChatCitation } from "@/lib/types"

interface CitationsCardProps {
  citations: ChatCitation[]
}

export function CitationsCard({ citations }: CitationsCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Sources ({citations.length})</h3>

      {citations.length === 0 ? (
        <p className="text-xs text-muted-foreground">Ask a question to see the documents the answer cited.</p>
      ) : (
        <div className="space-y-2">
          {citations.map((c) => (
            <div key={`${c.document_id}-${c.chunk_index}`} className="flex gap-2.5 rounded-lg border border-border p-3">
              <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{c.document_name}</p>
                {c.bm25_score !== null && (
                  <p className="text-xs text-muted-foreground">Relevance score: {c.bm25_score.toFixed(2)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
