export interface ChatCitation {
  document_id: string
  document_name: string
  chunk_index: number
  bm25_score: number | null
}

export interface ChatMessage {
  id: string
  /** Backend message id, known once persisted — required for feedback/regenerate. */
  serverId?: string
  role: "user" | "assistant"
  author: string
  time: string
  content: string
  citations?: ChatCitation[]
  rating?: "up" | "down" | null
  comment?: string | null
}

export interface AspectRow {
  aspect: string
  mentions: number
  maxMentions: number
  negativeSentiment: number
}

export interface TopicRow {
  topic: string
  prevalence: number
}

export interface ExtractionStat {
  label: string
  value: string
  icon: "equipment" | "components" | "actions" | "parameters"
}
