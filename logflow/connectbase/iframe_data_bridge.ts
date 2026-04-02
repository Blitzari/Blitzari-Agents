import type { TokenDataPoint } from "./token_data_fetcher"

export interface DataIframeConfig {
  containerId: string
  iframeUrl: string            // iframe page URL (receiver)
  token: string                // token symbol/id
  refreshMs?: number           // polling interval
  dataApiBase?: string         // API base for fetching data (defaults to iframe origin)
  targetOrigin?: string        // postMessage target origin (defaults to iframe origin)
}

export class TokenDataIframeEmbedder {
  private iframe?: HTMLIFrameElement
  private intervalId?: number
  private destroyed = false

  constructor(private cfg: DataIframeConfig) {}

  async init(): Promise<void> {
    const container = document.getElementById(this.cfg.containerId)
    if (!container) throw new Error(`Container not found: ${this.cfg.containerId}`)

    const iframeURL = new URL(this.cfg.iframeUrl, window.location.href)
    const targetOrigin = this.cfg.targetOrigin ?? iframeURL.origin
    const dataApiBase = (this.cfg.dataApiBase ?? iframeURL.origin).replace(/\/+$/, "")

    this.iframe = document.createElement("iframe")
    this.iframe.src = iframeURL.toString()
    this.iframe.style.border = "none"
    this.iframe.width = "100%"
    this.iframe.height = "100%"
    this.iframe.referrerPolicy = "no-referrer"
    this.iframe.onload = () => this.postTokenData(targetOrigin, dataApiBase)
    container.appendChild(this.iframe)

    if (this.cfg.refreshMs && this.cfg.refreshMs > 0) {
      this.intervalId = window.setInterval(
        () => this.postTokenData(targetOrigin, dataApiBase),
        this.cfg.refreshMs
      )
      document.addEventListener("visibilitychange", this.handleVisibility(targetOrigin, dataApiBase))
    }
  }

  private handleVisibility =
    (targetOrigin: string, dataApiBase: string) => () => {
      if (document.hidden) {
        if (this.intervalId) {
          clearInterval(this.intervalId)
          this.intervalId = undefined
        }
      } else if (!this.intervalId && this.cfg.refreshMs && this.cfg.refreshMs > 0) {
        this.intervalId = window.setInterval(
          () => this.postTokenData(targetOrigin, dataApiBase),
          this.cfg.refreshMs
        )
      }
    }

  private async postTokenData(targetOrigin: string, dataApiBase: string): Promise<void> {
    if (this.destroyed || !this.iframe?.contentWindow) return
    const { TokenDataFetcher } = await import("./token_data_fetcher")
    const fetcher = new TokenDataFetcher(dataApiBase)
    const data: TokenDataPoint[] = await fetcher.fetchHistory(this.cfg.token)
    this.iframe.contentWindow.postMessage(
      { type: "TOKEN_DATA", token: this.cfg.token, data },
      targetOrigin
    )
  }

  destroy(): void {
    this.destroyed = true
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }
    document.removeEventListener("visibilitychange", this.handleVisibility as any)
    if (this.iframe?.parentElement) this.iframe.parentElement.removeChild(this.iframe)
    this.iframe = undefined
  }
}
