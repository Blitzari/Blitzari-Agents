export interface PairInfo {
  exchange: string
  pairAddress: string
  baseSymbol: string
  quoteSymbol: string
  liquidityUsd: number
  volume24hUsd: number
  priceUsd: number
}

export interface DexSuiteConfig {
  apis: Array<{ name: string; baseUrl: string; apiKey?: string }>
  timeoutMs?: number
}

type ApiConfig = DexSuiteConfig["apis"][number]

type RawPair = {
  token0?: { symbol?: string }
  token1?: { symbol?: string }
  liquidityUsd?: number | string
  volume24hUsd?: number | string
  priceUsd?: number | string
}

function joinUrl(base: string, path: string): string {
  const b = base.replace(/\/+$/, "")
  const p = path.startsWith("/") ? path : `/${path}`
  return `${b}${p}`
}

async function fetchJson<T>(api: ApiConfig, path: string, timeoutMs: number): Promise<T> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(joinUrl(api.baseUrl, path), {
      headers: api.apiKey ? { Authorization: `Bearer ${api.apiKey}` } : {},
      signal: ctrl.signal,
    })
    if (!res.ok) throw new Error(`${api.name} ${path} HTTP ${res.status}`)
    return (await res.json()) as T
  } finally {
    clearTimeout(t)
  }
}

function toNumber(v: unknown): number {
  const n = typeof v === "string" ? Number(v) : (v as number)
  return Number.isFinite(n) ? n : 0
}

export class DexSuite {
  constructor(private config: DexSuiteConfig) {}

  private async fetchFromApi<T>(api: ApiConfig, path: string): Promise<T> {
    return fetchJson<T>(api, path, this.config.timeoutMs ?? 10_000)
  }

  /**
   * Retrieve aggregated pair info across all configured DEX APIs.
   */
  async getPairInfo(pairAddress: string): Promise<PairInfo[]> {
    const addr = encodeURIComponent(pairAddress)
    const tasks = this.config.apis.map(async (api) => {
      try {
        const data = await this.fetchFromApi<RawPair>(api, `/pair/${addr}`)
        return {
          exchange: api.name,
          pairAddress,
          baseSymbol: data.token0?.symbol ?? "BASE",
          quoteSymbol: data.token1?.symbol ?? "QUOTE",
          liquidityUsd: toNumber(data.liquidityUsd),
          volume24hUsd: toNumber(data.volume24hUsd),
          priceUsd: toNumber(data.priceUsd),
        } as PairInfo
      } catch {
        return undefined
      }
    })
    const results = await Promise.all(tasks)
    return results.filter((r): r is PairInfo => Boolean(r))
  }

  /**
   * Compare a list of pairs across exchanges, returning the best volume and liquidity per pair.
   */
  async comparePairs(
    pairs: string[]
  ): Promise<Record<string, { bestVolume?: PairInfo; bestLiquidity?: PairInfo }>> {
    const entries = await Promise.all(
      pairs.map(async (addr) => {
        const infos = await this.getPairInfo(addr)
        if (infos.length === 0) return [addr, { bestVolume: undefined, bestLiquidity: undefined }] as const
        const bestVolume = infos.reduce((a, b) => (b.volume24hUsd > a.volume24hUsd ? b : a))
        const bestLiquidity = infos.reduce((a, b) => (b.liquidityUsd > a.liquidityUsd ? b : a))
        return [addr, { bestVolume, bestLiquidity }] as const
      })
    )
    return Object.fromEntries(entries)
  }
}
