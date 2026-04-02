export interface LaunchConfig {
  contractName: string
  parameters: Record<string, any>
  deployEndpoint: string
  apiKey?: string
  timeoutMs?: number
}

export interface LaunchResult {
  success: boolean
  address?: string
  transactionHash?: string
  error?: string
  rawResponse?: any
}

export class LaunchNode {
  constructor(private readonly config: LaunchConfig) {}

  async deploy(): Promise<LaunchResult> {
    const { deployEndpoint, apiKey, contractName, parameters, timeoutMs = 15000 } = this.config
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const res = await fetch(deployEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({ contractName, parameters }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const text = await res.text()
        return { success: false, error: `HTTP ${res.status}: ${text}` }
      }

      const json = await res.json()
      return {
        success: true,
        address: json.contractAddress ?? json.address,
        transactionHash: json.txHash ?? json.transactionHash,
        rawResponse: json,
      }
    } catch (err: any) {
      return { success: false, error: err.message }
    } finally {
      clearTimeout(timer)
    }
  }
}
