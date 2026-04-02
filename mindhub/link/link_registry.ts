export interface InputLink {
  id: string
  source: string
  url: string
  metadata?: Record<string, any>
  createdAt?: number
}

export interface InputLinkResult {
  success: boolean
  link?: InputLink
  error?: string
}

export class InputLinkHandler {
  private links = new Map<string, InputLink>()

  register(link: InputLink): InputLinkResult {
    if (this.links.has(link.id)) {
      return { success: false, error: `Link with id "${link.id}" already exists.` }
    }
    const entry: InputLink = { ...link, createdAt: Date.now() }
    this.links.set(link.id, entry)
    return { success: true, link: entry }
  }

  get(id: string): InputLinkResult {
    const link = this.links.get(id)
    return link
      ? { success: true, link }
      : { success: false, error: `No link found for id "${id}".` }
  }

  list(): InputLink[] {
    return Array.from(this.links.values())
  }

  update(id: string, patch: Partial<Omit<InputLink, "id">>): InputLinkResult {
    const existing = this.links.get(id)
    if (!existing) {
      return { success: false, error: `No link found for id "${id}".` }
    }
    const updated: InputLink = { ...existing, ...patch }
    this.links.set(id, updated)
    return { success: true, link: updated }
  }

  unregister(id: string): boolean {
    return this.links.delete(id)
  }

  clear(): void {
    this.links.clear()
  }
}
