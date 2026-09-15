import type { Permission } from '@opencode-ai/sdk/client'
import { connection } from './connection.svelte'
import { errorMessage } from './models.svelte'
import { ui } from './ui.svelte'

export type PermissionResponse = 'once' | 'always' | 'reject'

class Permissions {
  pending = $state<Permission[]>([])

  add(permission: Permission): void {
    if (this.pending.some((item) => item.id === permission.id)) return
    this.pending = [...this.pending, permission]
  }

  remove(id: string): void {
    this.pending = this.pending.filter((item) => item.id !== id)
  }

  forSession(sessionID: string): Permission[] {
    return this.pending.filter((item) => item.sessionID === sessionID)
  }

  async respond(permission: Permission, response: PermissionResponse): Promise<void> {
    try {
      const result = await connection.client.postSessionIdPermissionsPermissionId({
        path: { id: permission.sessionID, permissionID: permission.id },
        body: { response },
      })
      if (result.error) throw result.error
      this.remove(permission.id)
    } catch (error) {
      ui.toast(errorMessage(error), 'error', 'Could not respond to permission')
    }
  }
}

export const permissions = new Permissions()
