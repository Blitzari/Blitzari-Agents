export interface AgentCapabilities {
  canAnswerProtocolQuestions: boolean
  canAnswerTokenQuestions: boolean
  canDescribeTooling: boolean
  canReportEcosystemNews: boolean
  canTrackWallets: boolean
}

export interface AgentFlags {
  requiresExactInvocation: boolean
  noAdditionalCommentary: boolean
  logInvocations: boolean
}

export const SOLANA_AGENT_CAPABILITIES: Readonly<AgentCapabilities> = {
  canAnswerProtocolQuestions: true,
  canAnswerTokenQuestions: true,
  canDescribeTooling: true,
  canReportEcosystemNews: true,
  canTrackWallets: true,
}

export const SOLANA_AGENT_FLAGS: Readonly<AgentFlags> = {
  requiresExactInvocation: true,
  noAdditionalCommentary: true,
  logInvocations: false,
}
