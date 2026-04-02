/**
 * Analyze on-chain token activity: fetch recent activity and summarize transfers.
 */
export interface ActivityRecord {
  timestamp: number
  signature: string
  source: string
  destination: string
  amount: number
}

type UiTokenAmount = {
  amount: string
  decimals: number
  uiAmount?: number | null
}

type TokenBalance = {
  accountIndex?: number
  owner?: string | null
  mint?: string
  uiTokenAmount: UiTokenAmount
}

type TxMeta = {
  preTokenBalances?: TokenBalance[]
  postTokenBalances?: TokenBalance[]
}

type TxResponse = {
  blockTime?: number | null
  meta?: TxMeta | null
}

async function fetchJson<T>(url: string, timeoutMs = 15_000): Promise<T> {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as T
  } finally {
    clearTimeout(t)
  }
}

function toNumberAmount(uta: UiTokenAmount): number {
  const { amount, decimals, uiAmount } = uta
  if (uiAmount !== undefined && uiAmount !== null) return Number(uiAmount)
  const int = Number(amount)
  return Number.isFinite(int) ? int / Math.pow(10, decimals || 0) : 0
}

export class TokenActivityAnalyzer {
  constructor(private rpcEndpoint: string) {}

  async fetchRecentSignatures(mint: string, limit = 100): Promise<string[]> {
    const url = `${this.rpcEndpoint.replace(/\/+$/, "")}/getSignaturesForAddress/${encodeURIComponent(
      mint
    )}?limit=${encodeURIComponent(String(limit))}`
    const json = await fetchJson<any[]>(url)
    return Array.isArray(json) ? json.map((e) => e?.signature).filter(Boolean) : []
  }

  async analyzeActivity(mint: string, limit = 50): Promise<ActivityRecord[]> {
    const sigs = await this.fetchRecentSignatures(mint, limit)
    const out: ActivityRecord[] = []

    for (const sig of sigs) {
      try {
        const txUrl = `${this.rpcEndpoint.replace(/\/+$/, "")}/getTransaction/${encodeURIComponent(sig)}`
        const tx = await fetchJson<TxResponse>(txUrl)

        const meta = tx.meta ?? undefined
        if (!meta) continue

        const pre = meta.preTokenBalances ?? []
        const post = meta.postTokenBalances ?? []

        const preMap = new Map<number, TokenBalance>()
        pre.forEach((b, i) => preMap.set(b.accountIndex ?? i, b))

        const postMap = new Map<number, TokenBalance>()
        post.forEach((b, i) => postMap.set(b.accountIndex ?? i, b))

        const idxSet = new Set<number>([
          ...Array.from(preMap.keys()),
          ...Array.from(postMap.keys()),
        ])

        for (const idx of idxSet) {
          const p = postMap.get(idx)
          const q = preMap.get(idx)

          const pAmt = p ? toNumberAmount(p.uiTokenAmount) : 0
          const qAmt = q ? toNumberAmount(q.uiTokenAmount) : 0
          const delta = pAmt - qAmt

          if (delta !== 0) {
            out.push({
              timestamp: tx.blockTime ? tx.blockTime * 1000 : Date.now(),
              signature: sig,
              source: q?.owner ?? "unknown",
              destination: p?.owner ?? "unknown",
              amount: Math.abs(delta),
            })
          }
        }
      } catch {
        // skip malformed/failed transactions
        continue
      }
    }

    return out
  }
}
