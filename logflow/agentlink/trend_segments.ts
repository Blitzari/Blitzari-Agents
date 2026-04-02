export interface PricePoint {
  timestamp: number
  priceUsd: number
}

export interface TrendResult {
  startTime: number
  endTime: number
  trend: "upward" | "downward" | "neutral"
  changePct: number
}

/**
 * Analyze a series of price points to determine overall trend segments.
 * - minSegmentLength: minimum points per segment
 * - tolerancePct: ignore micro moves under this % when deciding direction
 */
export function analyzePriceTrends(
  points: PricePoint[],
  minSegmentLength: number = 5,
  tolerancePct: number = 0.1
): TrendResult[] {
  const results: TrendResult[] = []
  if (!Array.isArray(points) || points.length < minSegmentLength) return results

  // sort by time; filter invalid values
  const data = [...points]
    .filter(p => Number.isFinite(p.priceUsd) && p.priceUsd >= 0)
    .sort((a, b) => a.timestamp - b.timestamp)

  if (data.length < minSegmentLength) return results

  const dir = (a: number, b: number): -1 | 0 | 1 => {
    if (a <= 0 || b <= 0) return b > a ? 1 : b < a ? -1 : 0
    const pct = ((b - a) / a) * 100
    if (Math.abs(pct) < tolerancePct) return 0
    return pct > 0 ? 1 : -1
  }

  let segStart = 0
  let lastDir: -1 | 0 | 1 = 0

  for (let i = 1; i < data.length; i++) {
    const move = dir(data[i - 1].priceUsd, data[i].priceUsd)
    if (lastDir === 0 && move !== 0) lastDir = move

    const isLast = i === data.length - 1
    const nextDir = !isLast ? dir(data[i].priceUsd, data[i + 1].priceUsd) : 0
    const segLen = i - segStart + 1

    const changed =
      (lastDir !== 0 && nextDir !== lastDir && nextDir !== 0) ||
      (lastDir !== 0 && (nextDir === 0 || isLast)) ||
      (lastDir === 0 && isLast)

    const canEmit = segLen >= minSegmentLength && (changed || isLast)

    if (canEmit) {
      const start = data[segStart]
      const end = data[i]
      const startP = start.priceUsd
      const endP = end.priceUsd
      const changePct = startP > 0 ? ((endP - startP) / startP) * 100 : 0

      const trend: TrendResult["trend"] =
        changePct > 0 ? "upward" : changePct < 0 ? "downward" : "neutral"

      results.push({
        startTime: start.timestamp,
        endTime: end.timestamp,
        trend,
        changePct: Math.round(changePct * 100) / 100,
      })

      segStart = i
      lastDir = move || nextDir || 0
    } else {
      if (move !== 0) lastDir = move
    }
  }

  return results
}
