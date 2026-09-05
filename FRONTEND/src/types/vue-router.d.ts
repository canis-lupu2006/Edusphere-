import type { UserRole } from '@/types/models'

export {}

declare module 'vue-router' {
  interface RouteMeta {
    public?: boolean
    requiresAuth?: boolean
    roles?: UserRole[]
  }
}
