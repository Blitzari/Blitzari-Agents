export interface TokenDataPoint {
  timestamp: number
  priceUsd: number
  volumeUsd: number
  marketCapUsd: number
}

interface RawTokenData {
  time: number
  priceUsd: string | number
  volumeUsd: string | number
  marketCapUsd: string | number
}

export class TokenDataFetcher {
  constructor(private apiBase: string) {}

  /**
   * Fetches an array of TokenDataPoint for the given token symbol.
   * Expects endpoint: `${apiBase}/tokens/${symbol}/history`
   */
  async fetchHistory(symbol: string): Promise<TokenDataPoint[]> {
    const url = `${this.apiBase}/tokens/${encodeURIComponent(symbol)}/history`
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Failed to fetch history for ${symbol}: HTTP ${res.status}`)
    }

    const raw = (await res.json()) as RawTokenData[]
    return raw
      .map(r => ({
        timestamp: r.time * 1000, // assume seconds → ms
        priceUsd: Number(r.priceUsd ?? 0),
        volumeUsd: Number(r.volumeUsd ?? 0),
        marketCapUsd: Number(r.marketCapUsd ?? 0),
      }))
      .filter(p => !Number.isNaN(p.priceUsd) && !Number.isNaN(p.volumeUsd))
  }
}
