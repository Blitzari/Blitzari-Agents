import { exec } from "child_process"

/**
 * Execute a shell command and return stdout, or throw on error.
 * @param command Shell command to run (e.g., "ls -la")
 * @param timeoutMs Timeout in milliseconds (default 30s)
 * @param cwd Optional working directory
 */
export function execCommand(
  command: string,
  timeoutMs: number = 30_000,
  cwd?: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = exec(
      command,
      { timeout: timeoutMs, cwd },
      (error, stdout, stderr) => {
        if (error) {
          const details = stderr?.trim() || error.message
          return reject(new Error(`Command failed [${command}]: ${details}`))
        }
        const out = stdout.trim()
        if (stderr && stderr.trim().length > 0) {
          console.warn(`Command produced warnings:\n${stderr.trim()}`)
        }
        resolve(out)
      }
    )

    proc.on("exit", (code) => {
      if (code !== 0) {
        console.warn(`Command "${command}" exited with code ${code}`)
      }
    })
  })
}
