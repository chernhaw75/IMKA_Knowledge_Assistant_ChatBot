import type { AspectRow, ExtractionStat, TopicRow } from "@/lib/types"

export const aspectRows: AspectRow[] = [
  { aspect: "Motor", mentions: 427, maxMentions: 427, negativeSentiment: 28 },
  { aspect: "Cooling System", mentions: 319, maxMentions: 427, negativeSentiment: 21 },
  { aspect: "Bearing", mentions: 243, maxMentions: 427, negativeSentiment: 16 },
  { aspect: "Electrical", mentions: 198, maxMentions: 427, negativeSentiment: 13 },
  { aspect: "Lubrication", mentions: 136, maxMentions: 427, negativeSentiment: 9 },
  { aspect: "Hydraulic", mentions: 96, maxMentions: 427, negativeSentiment: 7 },
  { aspect: "Other", mentions: 88, maxMentions: 427, negativeSentiment: 6 },
]

export const topicRows: TopicRow[] = [
  { topic: "Overheating", prevalence: 31 },
  { topic: "Vibration", prevalence: 18 },
  { topic: "Leakage", prevalence: 14 },
  { topic: "Noise", prevalence: 11 },
  { topic: "Inspection", prevalence: 8 },
  { topic: "Calibration", prevalence: 6 },
  { topic: "Other", prevalence: 12 },
]

export const extractionStats: ExtractionStat[] = [
  { label: "Equipment", value: "1,248", icon: "equipment" },
  { label: "Components", value: "1,932", icon: "components" },
  { label: "Actions", value: "1,106", icon: "actions" },
  { label: "Parameters", value: "642", icon: "parameters" },
]
