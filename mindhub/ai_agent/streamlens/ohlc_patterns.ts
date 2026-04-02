import fetch from "node-fetch"

/*------------------------------------------------------
 * Types
 *----------------------------------------------------*/

interface Candle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
}

export type CandlestickPattern =
  | "Hammer"
  | "ShootingStar"
  | "BullishEngulfing"
  | "BearishEngulfing"
  | "Doji"

export interface PatternSignal {
  timestamp: number
  pattern: CandlestickPattern
  confidence: number
}

export interface DetectOptions {
  minConfidence?: number        // default 0.5
  limit?: number                // candles to fetch; default 100
  pickBestPerCandle?: boolean   // if true, only the top-confidence pattern per candle is emitted
}

/*------------------------------------------------------
 * Detector
 *----------------------------------------------------*/

export class CandlestickPatternDetector {
  constructor(private readonly apiUrl: string) {}

  /** Fetch recent OHLC candles */
  async fetchCandles(symbol: string, limit = 100): Promise<Candle[]> {
    const url = `${this.apiUrl.replace(/\/+$/, "")}/markets/${encodeURIComponent(
      symbol
    )}/candles?limit=${encodeURIComponent(String(limit))}`

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10_000)

    try {
      const res = await fetch(url, { signal: controller.signal } as any)
      if (!res.ok) {
        throw new Error(`Failed to fetch candles ${res.status}: ${res.statusText}`)
      }
      const data = (await res.json()) as Candle[]
      return Array.isArray(data) ? data : []
    } finally {
      clearTimeout(timer)
    }
  }

  /* ------------------------- Pattern helpers ---------------------- */

  private isHammer(c: Candle): number {
    const range = c.high - c.low
    if (range <= 0) return 0
    const body = Math.abs(c.close - c.open)
    const lowerWick = Math.min(c.open, c.close) - c.low
    const bodyShare = body / range
    const ratio = body > 0 ? lowerWick / body : 0
    return ratio > 2 && bodyShare < 0.3 ? Math.min(ratio / 3, 1) : 0
  }

  private isShootingStar(c: Candle): number {
    const range = c.high - c.low
    if (range <= 0) return 0
    const body = Math.abs(c.close - c.open)
    const upperWick = c.high - Math.max(c.open, c.close)
    const bodyShare = body / range
    const ratio = body > 0 ? upperWick / body : 0
    return ratio > 2 && bodyShare < 0.3 ? Math.min(ratio / 3, 1) : 0
  }

  private isBullishEngulfing(prev: Candle, curr: Candle): number {
    const cond =
      curr.close > curr.open &&
      prev.close < prev.open &&
      curr.close >= prev.open &&
      curr.open <= prev.close
    if (!cond) return 0
    const bodyPrev = Math.abs(prev.close - prev.open)
    const bodyCurr = Math.abs(curr.close - curr.open)
    if (bodyCurr === 0) return 0
    return bodyPrev > 0 ? Math.min(bodyCurr / bodyPrev, 1) : 0.8
  }

  private isBearishEngulfing(prev: Candle, curr: Candle): number {
    const cond =
      curr.close < curr.open &&
      prev.close > prev.open &&
      curr.open >= prev.close &&
      curr.close <= prev.open
    if (!cond) return 0
    const bodyPrev = Math.abs(prev.close - prev.open)
    const bodyCurr = Math.abs(curr.close - curr.open)
    if (bodyCurr === 0) return 0
    return bodyPrev > 0 ? Math.min(bodyCurr / bodyPrev, 1) : 0.8
  }

  private isDoji(c: Candle): number {
    const range = c.high - c.low
    if (range <= 0) return 0
    const body = Math.abs(c.close - c.open)
    const ratio = body / range
    return ratio < 0.1 ? Number((1 - ratio * 10).toFixed(3)) : 0
  }

  /* ------------------------- Detection API ------------------------ */

  /**
   * Detect candlestick pattern signals for a symbol.
   */
  async detectPatterns(
    symbol: string,
    options: DetectOptions = {}
  ): Promise<PatternSignal[]> {
    const minConfidence = options.minConfidence ?? 0.5
    const limit = options.limit ?? 100
    const pickBestPerCandle = options.pickBestPerCandle ?? true

    const candles = await this.fetchCandles(symbol, limit)
    if (candles.length === 0) return []

    // ensure chronological order (ascending timestamp)
    const data = [...candles].sort((a, b) => a.timestamp - b.timestamp)

    const signals: PatternSignal[] = []

    for (let i = 0; i < data.length; i++) {
      const c = data[i]
      const prev = i > 0 ? data[i - 1] : undefined

      const candidates: PatternSignal[] = []

      // Single-candle patterns
      const hammer = this.isHammer(c)
      if (hammer >= minConfidence) {
        candidates.push({ timestamp: c.timestamp, pattern: "Hammer", confidence: Number(hammer.toFixed(3)) })
      }

      const star = this.isShootingStar(c)
      if (star >= minConfidence) {
        candidates.push({ timestamp: c.timestamp, pattern: "ShootingStar", confidence: Number(star.toFixed(3)) })
      }

      const doji = this.isDoji(c)
      if (doji >= minConfidence) {
        candidates.push({ timestamp: c.timestamp, pattern: "Doji", confidence: Number(doji.toFixed(3)) })
      }

      // Two-candle patterns
      if (prev) {
        const bull = this.isBullishEngulfing(prev, c)
        if (bull >= minConfidence) {
          candidates.push({ timestamp: c.timestamp, pattern: "BullishEngulfing", confidence: Number(bull.toFixed(3)) })
        }

        const bear = this.isBearishEngulfing(prev, c)
        if (bear >= minConfidence) {
          candidates.push({ timestamp: c.timestamp, pattern: "BearishEngulfing", confidence: Number(bear.toFixed(3)) })
        }
      }

      if (candidates.length === 0) continue

      if (pickBestPerCandle) {
        const best = candidates.reduce((a, b) => (b.confidence > a.confidence ? b : a))
        signals.push(best)
      } else {
        signals.push(...candidates)
      }
    }

    return signals
  }
}
