import { toolkitBuilder } from "@/ai/core"
import { FETCH_POOL_DATA_KEY } from "@/ai/modules/liquidity/pool-fetcher/key"
import { ANALYZE_POOL_HEALTH_KEY } from "@/ai/modules/liquidity/health-checker/key"
import { FetchPoolDataAction } from "@/ai/modules/liquidity/pool-fetcher/action"
import { AnalyzePoolHealthAction } from "@/ai/modules/liquidity/health-checker/action"

type Toolkit = ReturnType<typeof toolkitBuilder>

export const LIQUIDITY_TOOL_KEYS = {
  FETCH_POOL: `liquidityscan-${FETCH_POOL_DATA_KEY}`,
  ANALYZE_HEALTH: `poolhealth-${ANALYZE_POOL_HEALTH_KEY}`,
} as const

/**
 * Toolkit exposing liquidity-related actions:
 * – fetch raw pool data
 * – run health / risk analysis on a liquidity pool
 */
export const LIQUIDITY_ANALYSIS_TOOLS: Readonly<Record<string, Toolkit>> = {
  [LIQUIDITY_TOOL_KEYS.FETCH_POOL]: toolkitBuilder(new FetchPoolDataAction()),
  [LIQUIDITY_TOOL_KEYS.ANALYZE_HEALTH]: toolkitBuilder(new AnalyzePoolHealthAction()),
}
