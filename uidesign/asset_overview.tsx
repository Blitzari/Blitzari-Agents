import React, { useEffect, useState } from "react"

interface AssetOverviewPanelProps {
  assetId: string
}

interface AssetOverview {
  name: string
  priceUsd: number
  supply: number
  holders: number
}

export const AssetOverviewPanel: React.FC<AssetOverviewPanelProps> = ({ assetId }) => {
  const [info, setInfo] = useState<AssetOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function fetchInfo() {
      try {
        setLoading(true)
        const res = await fetch(`/api/assets/${encodeURIComponent(assetId)}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = (await res.json()) as AssetOverview
        if (!cancelled) {
          setInfo(json)
          setError(null)
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message)
          setInfo(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchInfo()
    return () => {
      cancelled = true
    }
  }, [assetId])

  if (loading) return <div>Loading asset overview...</div>
  if (error) return <div className="text-red-500">Error: {error}</div>
  if (!info) return <div>No asset data available.</div>

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-2">Asset Overview</h2>
      <p>
        <strong>ID:</strong> {assetId}
      </p>
      <p>
        <strong>Name:</strong> {info.name}
      </p>
      <p>
        <strong>Price (USD):</strong> ${info.priceUsd.toFixed(2)}
      </p>
      <p>
        <strong>Circulating Supply:</strong> {info.supply.toLocaleString()}
      </p>
      <p>
        <strong>Holders:</strong> {info.holders.toLocaleString()}
      </p>
    </div>
  )
}

export default AssetOverviewPanel
