<template>
  <div class="flex min-h-screen bg-[#f7f3eb] text-[#1a3d32]">
    <aside class="flex h-screen w-60 shrink-0 flex-col border-r border-[#1a5c45]/10 bg-[#faf7f1]">
      <div class="flex items-center gap-3 px-5 py-5">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a5c45] text-white">
          <Users class="h-5 w-5" />
        </div>
        <div>
          <p class="font-display text-lg font-semibold">EduSphere</p>
          <span class="mt-1 inline-block rounded-full bg-[#1a5c45] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
            Espace parent
          </span>
        </div>
      </div>
      <nav class="mt-2 flex-1 space-y-1 px-3">
        <RouterLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#1a3d32]/70 transition hover:bg-[#1a5c45]/8"
          :class="{ 'bg-[#ebe4d6] font-medium text-[#1a3d32]': isActive(item) }"
        >
          <component :is="item.icon" class="h-4 w-4" />
          {{ item.label }}
        </RouterLink>
      </nav>
      <div class="border-t border-[#1a5c45]/10 p-4">
        <div class="mb-3 flex items-center gap-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a5c45]/15 text-sm font-bold">
            {{ auth.initials }}
          </div>
          <div>
            <p class="text-sm font-medium">{{ auth.displayName }}</p>
            <p class="text-xs text-[#1a3d32]/50">Parent</p>
          </div>
        </div>
        <button
          type="button"
          class="flex items-center gap-2 text-sm text-red-600"
          @click="logout"
        >
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
import { LayoutDashboard, Megaphone, Users, LogOut } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

import type { NavItem } from '@/types/models'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const nav: NavItem[] = [
  { to: '/parent', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { to: '/parent/annonces', label: 'Annonces', icon: Megaphone },
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
