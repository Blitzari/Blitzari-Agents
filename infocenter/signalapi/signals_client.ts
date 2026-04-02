export interface Signal {
  id: string
  type: string
  timestamp: number
  payload: Record<string, any>
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface SignalApiClientOptions {
  baseUrl: string
  apiKey?: string
  retries?: number
  timeoutMs?: number
}

/**
 * HTTP client for fetching signals from ArchiNet.
 */
export class SignalApiClient {
  private retries: number
  private timeoutMs: number

  constructor(private opts: SignalApiClientOptions) {
    this.retries = opts.retries ?? 1
    this.timeoutMs = opts.timeoutMs ?? 10_000
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (this.opts.apiKey) headers["Authorization"] = `Bearer ${this.opts.apiKey}`
    return headers
  }

  private async request<T>(path: string): Promise<ApiResponse<T>> {
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), this.timeoutMs)

        const res = await fetch(`${this.opts.baseUrl}${path}`, {
          method: "GET",
          headers: this.getHeaders(),
          signal: controller.signal,
        })

        clearTimeout(timer)

        if (!res.ok) {
          return { success: false, error: `HTTP ${res.status}` }
        }
        const data = (await res.json()) as T
        return { success: true, data }
      } catch (err: any) {
        if (attempt < this.retries) continue
        return { success: false, error: err.message }
      }
    }
    return { success: false, error: "Unknown error" }
  }

  async fetchAllSignals(): Promise<ApiResponse<Signal[]>> {
    return this.request<Signal[]>("/signals")
  }

  async fetchSignalById(id: string): Promise<ApiResponse<Signal>> {
    return this.request<Signal>(`/signals/${encodeURIComponent(id)}`)
  }
}
