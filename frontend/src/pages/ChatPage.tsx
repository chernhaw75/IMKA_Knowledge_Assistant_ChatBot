import { useCallback, useEffect, useState } from "react"
import { Bot, MessageSquarePlus } from "lucide-react"
import { ChatThread } from "@/components/chat/ChatThread"
import { CitationsCard } from "@/components/chat/CitationsCard"
import { HistoryCard } from "@/components/chat/HistoryCard"
import { ApiError, getHistory, streamChatCompletion, submitFeedback, type Conversation } from "@/lib/api"
import { useAuth } from "@/lib/AuthContext"
import type { ChatMessage } from "@/lib/types"

function timeNow() {
  return new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
}

export function ChatPage() {
  const { token, user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  const lastCitations = [...messages].reverse().find((m) => m.role === "assistant")?.citations ?? []

  const refreshHistory = useCallback(() => {
    if (!token) return
    setLoadingHistory(true)
    getHistory(token)
      .then(setConversations)
      .catch(() => setConversations([]))
      .finally(() => setLoadingHistory(false))
  }, [token])

  useEffect(() => {
    refreshHistory()
  }, [refreshHistory])

  function appendToMessage(localId: string, delta: string) {
    setMessages((prev) => prev.map((m) => (m.id === localId ? { ...m, content: m.content + delta } : m)))
  }

  async function runCompletion(history: { role: string; content: string }[], assistantLocalId: string) {
    if (!token) return
    setError(null)
    setSending(true)
    try {
      const { conversationId: newConversationId, messageId, citations } = await streamChatCompletion(
        token,
        { messages: history as { role: "user" | "assistant" | "system"; content: string }[], conversation_id: conversationId },
        (delta) => appendToMessage(assistantLocalId, delta),
      )
      setConversationId(newConversationId)
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantLocalId ? { ...m, citations, serverId: messageId } : m)),
      )
      refreshHistory()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to reach the chat API.")
    } finally {
      setSending(false)
    }
  }

  async function handleSend(text: string) {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      author: user?.name ?? "You",
      time: timeNow(),
      content: text,
    }
    const assistantId = crypto.randomUUID()
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      author: "AI Assistant",
      time: timeNow(),
      content: "",
    }
    const history = [...messages, userMessage].map((m) => ({ role: m.role, content: m.content }))
    setMessages((prev) => [...prev, userMessage, assistantMessage])
    await runCompletion(history, assistantId)
  }

  async function handleRegenerate(assistantLocalId: string) {
    const idx = messages.findIndex((m) => m.id === assistantLocalId)
    if (idx === -1) return
    let userIdx = idx - 1
    while (userIdx >= 0 && messages[userIdx].role !== "user") userIdx--
    if (userIdx < 0) return

    const history = messages.slice(0, userIdx + 1).map((m) => ({ role: m.role, content: m.content }))
    setMessages((prev) =>
      prev.map((m) =>
        m.id === assistantLocalId
          ? { ...m, content: "", citations: undefined, rating: null, comment: null, serverId: undefined }
          : m,
      ),
    )
    await runCompletion(history, assistantLocalId)
  }

  async function handleEditUser(userLocalId: string, newContent: string) {
    const idx = messages.findIndex((m) => m.id === userLocalId)
    if (idx === -1) return

    const truncated = messages.slice(0, idx)
    const editedUserMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      author: user?.name ?? "You",
      time: timeNow(),
      content: newContent,
    }
    const assistantId = crypto.randomUUID()
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      author: "AI Assistant",
      time: timeNow(),
      content: "",
    }
    const history = [...truncated, editedUserMessage].map((m) => ({ role: m.role, content: m.content }))
    setMessages([...truncated, editedUserMessage, assistantMessage])
    await runCompletion(history, assistantId)
  }

  async function handleFeedback(localId: string, rating: "up" | "down") {
    if (!token) return
    const msg = messages.find((m) => m.id === localId)
    if (!msg?.serverId) return

    const previousRating = msg.rating
    const newRating = previousRating === rating ? null : rating
    setMessages((prev) => prev.map((m) => (m.id === localId ? { ...m, rating: newRating } : m)))

    try {
      await submitFeedback(token, msg.serverId, { rating: newRating, comment: msg.comment })
    } catch {
      setMessages((prev) => prev.map((m) => (m.id === localId ? { ...m, rating: previousRating } : m)))
    }
  }

  async function handleComment(localId: string, comment: string) {
    if (!token) return
    const msg = messages.find((m) => m.id === localId)
    if (!msg?.serverId) return

    setMessages((prev) => prev.map((m) => (m.id === localId ? { ...m, comment } : m)))
    try {
      await submitFeedback(token, msg.serverId, { rating: msg.rating, comment })
    } catch {
      // best-effort; leave the optimistic value in place
    }
  }

  function handleNewChat() {
    setMessages([])
    setConversationId(null)
    setError(null)
  }

  function handleSelectConversation(conversation: Conversation) {
    setConversationId(conversation.id)
    setError(null)
    setMessages(
      conversation.messages.map((m) => ({
        id: m.id,
        serverId: m.id,
        role: m.role === "assistant" ? "assistant" : "user",
        author: m.role === "assistant" ? "AI Assistant" : (user?.name ?? "You"),
        time: new Date(conversation.created_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
        content: m.content,
        citations: m.citations,
        rating: m.rating,
        comment: m.feedback_comment,
      })),
    )
  }

  return (
    <div className="flex h-full min-h-0 gap-4 p-4">
      <div className="flex min-w-0 flex-1 flex-col rounded-xl border border-border bg-card">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-muted ring-1 ring-border">
              <Bot className="size-4.5 text-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">AI Assistant</span>
                <span className="flex items-center gap-1 text-xs text-emerald-600">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Online
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Ask questions about maintenance, SOPs, equipment and troubleshooting.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNewChat}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
            >
              <MessageSquarePlus className="size-4" />
              New Chat
            </button>
          </div>
        </div>

        {error && (
          <div className="shrink-0 border-b border-border bg-red-50 px-5 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="min-h-0 flex-1">
          <ChatThread
            messages={messages}
            onSend={handleSend}
            sending={sending}
            onFeedback={handleFeedback}
            onComment={handleComment}
            onRegenerate={handleRegenerate}
            onEditUser={handleEditUser}
          />
        </div>
      </div>

      <div className="hidden w-80 shrink-0 space-y-4 overflow-y-auto lg:block">
        <CitationsCard citations={lastCitations} />
        <HistoryCard
          conversations={conversations}
          loading={loadingHistory}
          activeId={conversationId}
          onSelect={handleSelectConversation}
        />
      </div>
    </div>
  )
}
