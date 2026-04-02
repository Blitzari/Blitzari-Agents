export interface VolumePoint {
  timestamp: number
  volumeUsd: number
}

export interface SpikeEvent {
  timestamp: number
  volume: number
  spikeRatio: number
}

/**
 * Detect spikes in trading volume compared to a rolling average window.
 * - Uses a sliding window sum for O(n) efficiency.
 * - Ignores invalid/negative values.
 * - Rounds spikeRatio to 2 decimals.
 */
export function detectVolumeSpikes(
  points: VolumePoint[],
  windowSize: number = 10,
  spikeThreshold: number = 2.0
): SpikeEvent[] {
  const events: SpikeEvent[] = []
  if (!Array.isArray(points) || points.length <= windowSize) return events

  // sanitize data
  const volumes = points.map(p => (Number.isFinite(p.volumeUsd) && p.volumeUsd >= 0 ? p.volumeUsd : 0))

  let sum = 0
  for (let i = 0; i < windowSize; i++) {
    sum += volumes[i]
  }

  for (let i = windowSize; i < volumes.length; i++) {
    const avg = sum / windowSize
    const curr = volumes[i]
    const ratio = avg > 0 ? curr / avg : Infinity

    if (ratio >= spikeThreshold) {
      events.push({
        timestamp: points[i].timestamp,
        volume: curr,
        spikeRatio: Math.round(ratio * 100) / 100,
      })
    }

    // slide window
    sum += curr - volumes[i - windowSize]
  }

  return events
}
