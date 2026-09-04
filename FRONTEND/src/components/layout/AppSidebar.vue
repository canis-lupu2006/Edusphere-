<template>
  <aside
    class="flex h-screen w-64 shrink-0 flex-col border-r border-white/5 bg-[#070b16]/90 backdrop-blur-xl"
    :class="asideClass"
  >
    <div class="flex items-center gap-3 px-5 py-5">
      <div
        class="flex h-10 w-10 items-center justify-center rounded-xl"
        :class="logoBg"
      >
        <component :is="logoIcon" class="h-5 w-5 text-white" />
      </div>
      <div>
        <p class="font-display text-lg font-semibold leading-none">EduSphere</p>
        <p class="mt-1 text-[10px] font-semibold uppercase tracking-wider" :class="badgeClass">
          {{ spaceLabel }}
        </p>
      </div>
    </div>

    <nav class="mt-2 flex-1 space-y-1 overflow-y-auto px-3">
      <RouterLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="nav-link"
        :class="{ 'nav-link-active': isActive(item) }"
      >
        <component :is="item.icon" class="h-4.5 w-4.5 shrink-0 opacity-80" />
        <span>{{ item.label }}</span>
        <span
          v-if="item.badge"
          class="ml-auto rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white"
        >
          {{ item.badge }}
        </span>
      </RouterLink>
    </nav>

    <div class="border-t border-white/5 p-4">
      <div class="mb-3 flex items-center gap-3 rounded-xl bg-white/5 p-3">
        <div
          class="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold"
          :class="avatarClass"
        >
          {{ auth.initials }}
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium">{{ auth.displayName }}</p>
          <p class="truncate text-xs text-white/45">{{ subtitle }}</p>
        </div>
      </div>
      <button
        type="button"
        class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
        @click="onLogout"
      >
        <LogOut class="h-4 w-4" />
        Déconnexion
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { GraduationCap, LogOut } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import type { NavItem } from '@/types/models'

const props = withDefaults(
  defineProps<{
    items: NavItem[]
    spaceLabel?: string
    subtitle?: string
    accent?: string
    logoIcon?: Component
    asideClass?: string
  }>(),
  {
    spaceLabel: '',
    subtitle: '',
    accent: 'blue',
    logoIcon: GraduationCap,
    asideClass: '',
  },
)

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const accentMap: Record<string, { logo: string; badge: string; avatar: string }> = {
  blue: {
    logo: 'bg-gradient-to-br from-blue-600 to-blue-500 shadow-glow',
    badge: 'text-blue-400',
    avatar: 'bg-blue-600/30 text-blue-200',
  },
  purple: {
    logo: 'bg-gradient-to-br from-violet-600 to-blue-500 shadow-glow-purple',
    badge: 'text-violet-300',
    avatar: 'bg-violet-600/30 text-violet-200',
  },
  green: {
    logo: 'bg-gradient-to-br from-emerald-600 to-teal-500',
    badge: 'text-emerald-400',
    avatar: 'bg-emerald-600/30 text-emerald-200',
  },
  parent: {
    logo: 'bg-gradient-to-br from-emerald-700 to-green-600',
    badge: 'text-emerald-700',
    avatar: 'bg-emerald-100 text-emerald-800',
  },
}

const theme = computed(() => accentMap[props.accent] || accentMap.blue)
const logoBg = computed(() => theme.value.logo)
const badgeClass = computed(() => theme.value.badge)
const avatarClass = computed(() => theme.value.avatar)

function isActive(item: NavItem) {
  if (item.exact) return route.path === item.to
  return route.path === item.to || route.path.startsWith(item.to + '/')
}

async function onLogout() {
  await auth.logout()
  router.push('/login')
}
</script>
