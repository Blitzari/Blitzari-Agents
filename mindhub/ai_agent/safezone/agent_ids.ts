export const SOLANA_KNOWLEDGE_AGENT_ID = "solana-knowledge-agent" as const

export type SolanaKnowledgeAgentId = typeof SOLANA_KNOWLEDGE_AGENT_ID

export const AGENT_IDS = {
  SOLANA_KNOWLEDGE: SOLANA_KNOWLEDGE_AGENT_ID,
} as const

export type AgentId = (typeof AGENT_IDS)[keyof typeof AGENT_IDS]
