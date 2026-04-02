import nodemailer from "nodemailer"

export interface AlertConfig {
  email?: {
    host: string
    port: number
    user: string
    pass: string
    from: string
    to: string[]
    secure?: boolean
  }
  console?: boolean
}

export interface AlertSignal {
  title: string
  message: string
  level: "info" | "warning" | "critical"
  timestamp?: number
}

export class AlertService {
  constructor(private readonly cfg: AlertConfig) {}

  private async sendEmail(signal: AlertSignal): Promise<void> {
    if (!this.cfg.email) return
    const { host, port, user, pass, from, to, secure } = this.cfg.email
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: secure ?? false,
      auth: { user, pass },
    })
    await transporter.sendMail({
      from,
      to,
      subject: `[${signal.level.toUpperCase()}] ${signal.title}`,
      text: signal.message,
    })
  }

  private logConsole(signal: AlertSignal): void {
    if (!this.cfg.console) return
    const ts = signal.timestamp ? new Date(signal.timestamp).toISOString() : new Date().toISOString()
    console.log(
      `[Alert][${signal.level.toUpperCase()}][${ts}] ${signal.title}\n${signal.message}`
    )
  }

  async dispatch(signals: AlertSignal[]): Promise<void> {
    for (const sig of signals) {
      await this.sendEmail(sig)
      this.logConsole(sig)
    }
  }
}
