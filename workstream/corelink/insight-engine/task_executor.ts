/**
 * Simple task executor: registers and runs tasks by name.
 */
export type Handler<TParams = any, TResult = any> = (params: TParams) => Promise<TResult>

export interface Task<TParams = any> {
  id: string
  type: string
  params: TParams
}

export interface TaskResult<TResult = any> {
  id: string
  result?: TResult
  error?: string
}

export class ExecutionEngine {
  private handlers: Record<string, Handler<any, any>> = {}
  private queue: Task[] = []
  private maxQueueSize: number

  constructor(maxQueueSize = 1000) {
    this.maxQueueSize = maxQueueSize
  }

  register<TParams, TResult>(type: string, handler: Handler<TParams, TResult>): void {
    this.handlers[type] = handler
  }

  enqueue<TParams>(id: string, type: string, params: TParams): void {
    if (!this.handlers[type]) throw new Error(`No handler registered for type "${type}"`)
    if (this.queue.length >= this.maxQueueSize) throw new Error(`Queue overflow (max ${this.maxQueueSize})`)
    this.queue.push({ id, type, params })
  }

  async runAll(): Promise<TaskResult[]> {
    const results: TaskResult[] = []
    while (this.queue.length) {
      const task = this.queue.shift()!
      try {
        const data = await this.handlers[task.type](task.params)
        results.push({ id: task.id, result: data })
      } catch (err: any) {
        results.push({ id: task.id, error: err.message })
      }
    }
    return results
  }

  clearQueue(): void {
    this.queue = []
  }

  queueSize(): number {
    return this.queue.length
  }
}
