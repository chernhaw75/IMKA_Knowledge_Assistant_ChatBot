import { History, Loader2, MessageSquare } from "lucide-react"
import type { Conversation } from "@/lib/api"
import { cn } from "@/lib/utils"

interface HistoryCardProps {
  conversations: Conversation[]
  loading: boolean
  activeId: string | null
  onSelect: (conversation: Conversation) => void
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
}

function preview(conversation: Conversation) {
  const firstUserMessage = conversation.messages.find((m) => m.role === "user")
  return firstUserMessage?.content ?? "(empty conversation)"
}

export function HistoryCard({ conversations, loading, activeId, onSelect }: HistoryCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <History className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">History ({conversations.length})</h3>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          Loading history...
        </div>
      ) : conversations.length === 0 ? (
        <p className="text-xs text-muted-foreground">Your past conversations will show up here.</p>
      ) : (
        <div className="max-h-80 space-y-1.5 overflow-y-auto">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              type="button"
              onClick={() => onSelect(conv)}
              className={cn(
                "flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-accent",
                activeId === conv.id && "bg-accent",
              )}
            >
              <MessageSquare className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-foreground">{preview(conv)}</p>
                <p className="text-[11px] text-muted-foreground">{formatDate(conv.created_at)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
