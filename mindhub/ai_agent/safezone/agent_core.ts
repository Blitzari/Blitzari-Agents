import type { BaseAction, ActionResponse } from "./base_action"
import { z } from "zod"

interface AgentContext {
  apiEndpoint: string
  apiKey: string
}

/**
 * Central Agent: routes calls to registered actions.
 */
export class Agent {
  private actions = new Map<string, BaseAction<any, any, AgentContext>>()

  register<S extends z.ZodObject<any>, R>(
    action: BaseAction<S, R, AgentContext>
  ): void {
    this.actions.set(action.id, action)
  }

  async invoke<R>(
    actionId: string,
    payload: unknown,
    ctx: AgentContext
  ): Promise<ActionResponse<R>> {
    const action = this.actions.get(actionId)
    if (!action) throw new Error(`Unknown action "${actionId}"`)

    const parsed = action.input.parse(payload)
    return action.execute({ payload: parsed, context: ctx })
  }
}
