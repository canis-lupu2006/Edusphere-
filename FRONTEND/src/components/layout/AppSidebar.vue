<template>
  <aside
    class="flex h-full w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white"
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
        <p class="font-display text-lg font-semibold leading-none text-slate-900">EduSphere</p>
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
        :class="{ [activeNavClass]: isActive(item) }"
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

    <div class="border-t border-slate-200/80 p-4">
      <div class="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
        <div
          class="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold"
          :class="avatarClass"
        >
          {{ auth.initials }}
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-slate-900">{{ auth.displayName }}</p>
          <p class="truncate text-xs text-slate-500">{{ subtitle }}</p>
        </div>
      </div>
      <button
        type="button"
        class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
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
    // Factory obligatoire : sinon Vue invoque GraduationCap() comme default factory
    // et Lucide plante (Cannot destructure property 'slots' of 'undefined').
    logoIcon: () => GraduationCap,
    asideClass: '',
  },
)

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const accentMap: Record<
  string,
  { logo: string; badge: string; avatar: string; activeNav: string }
> = {
  blue: {
    logo: 'bg-gradient-to-br from-blue-600 to-blue-500 shadow-glow',
    badge: 'text-blue-600',
    avatar: 'bg-blue-100 text-blue-700',
    activeNav: 'nav-link-active',
  },
  purple: {
    logo: 'bg-gradient-to-br from-indigo-600 to-indigo-500 shadow-glow-purple',
    badge: 'text-indigo-600',
    avatar: 'bg-indigo-100 text-indigo-700',
    activeNav: 'nav-link-active-indigo',
  },
  green: {
    logo: 'bg-gradient-to-br from-teal-700 to-teal-600',
    badge: 'text-teal-700',
    avatar: 'bg-teal-100 text-teal-800',
    activeNav: 'nav-link-active-teal',
  },
  parent: {
    logo: 'bg-gradient-to-br from-emerald-700 to-green-600',
    badge: 'text-emerald-700',
    avatar: 'bg-emerald-100 text-emerald-800',
    activeNav: 'nav-link-active-teal',
  },
}

const theme = computed(() => accentMap[props.accent] || accentMap.blue)
const logoBg = computed(() => theme.value.logo)
const badgeClass = computed(() => theme.value.badge)
const avatarClass = computed(() => theme.value.avatar)
const activeNavClass = computed(() => theme.value.activeNav)

function isActive(item: NavItem) {
  if (item.exact) return route.path === item.to
  return route.path === item.to || route.path.startsWith(item.to + '/')
}

async function onLogout() {
  await auth.logout()
  router.push('/login')
}
</script>
