<template>
  <div class="flex min-h-screen bg-[#f3f5f4] text-[#0f1f17]">
    <aside class="flex h-screen w-64 shrink-0 flex-col border-r border-emerald-900/10 bg-white">
      <div class="px-5 py-5">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-800 text-white">
            <Leaf class="h-5 w-5" />
          </div>
          <div>
            <p class="font-display text-lg font-semibold text-emerald-900">EduSphere</p>
            <p class="text-[10px] text-emerald-700/70">Éduquer · Grandir · Réussir</p>
          </div>
        </div>
      </div>
      <nav class="flex-1 space-y-1 px-3">
        <RouterLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-emerald-900/70 transition hover:bg-emerald-50"
          :class="{ 'bg-emerald-100 font-medium text-emerald-900': isActive(item) }"
        >
          <component :is="item.icon" class="h-4 w-4" />
          {{ item.label }}
        </RouterLink>
      </nav>
      <div class="border-t border-emerald-900/10 p-4">
        <p class="mb-2 text-xs text-emerald-800/60">{{ auth.displayName }}</p>
        <button type="button" class="flex items-center gap-2 text-sm text-red-600" @click="logout">
          <LogOut class="h-4 w-4" /> Déconnexion
        </button>
      </div>
    </aside>
    <main class="flex-1 overflow-y-auto px-6 py-6 md:px-8">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter, RouterLink, RouterView } from 'vue-router'
import { LayoutDashboard, Building2, BarChart3, Leaf, LogOut } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import type { NavItem } from '@/types/models'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const nav: NavItem[] = [
  { to: '/ministere', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { to: '/ministere/etablissements', label: 'Établissements', icon: Building2 },
  { to: '/ministere/statistiques', label: 'Statistiques', icon: BarChart3 },
]

function isActive(item: NavItem) {
  if (item.exact) return route.path === item.to
  return route.path.startsWith(item.to)
}

async function logout() {
  await auth.logout()
  router.push('/login')
}
</script>
