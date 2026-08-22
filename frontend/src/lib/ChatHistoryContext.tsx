import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { ApiError, getHistory, type Conversation } from "@/lib/api"
import { useAuth } from "@/lib/AuthContext"

interface ChatHistoryContextValue {
  conversations: Conversation[]
  loading: boolean
  refresh: () => void
  activeConversationId: string | null
  pendingConversation: Conversation | null
  selectConversation: (conversation: Conversation) => void
  clearPending: () => void
  setActiveConversationId: (id: string | null) => void
}

const ChatHistoryContext = createContext<ChatHistoryContextValue | null>(null)

export function ChatHistoryProvider({ children }: { children: ReactNode }) {
  const { token, logout } = useAuth()
  const navigate = useNavigate()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [pendingConversation, setPendingConversation] = useState<Conversation | null>(null)

  const refresh = useCallback(() => {
    if (!token) return
    setLoading(true)
    getHistory(token)
      .then(setConversations)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) {
          logout()
          return
        }
        setConversations([])
      })
      .finally(() => setLoading(false))
  }, [token, logout])

  useEffect(() => {
    refresh()
  }, [refresh])

  function selectConversation(conversation: Conversation) {
    setPendingConversation(conversation)
    setActiveConversationId(conversation.id)
    navigate("/chat")
  }

  function clearPending() {
    setPendingConversation(null)
  }

  return (
    <ChatHistoryContext.Provider
      value={{
        conversations,
        loading,
        refresh,
        activeConversationId,
        pendingConversation,
        selectConversation,
        clearPending,
        setActiveConversationId,
      }}
    >
      {children}
    </ChatHistoryContext.Provider>
  )
}

export function useChatHistory() {
  const ctx = useContext(ChatHistoryContext)
  if (!ctx) throw new Error("useChatHistory must be used within ChatHistoryProvider")
  return ctx
}
