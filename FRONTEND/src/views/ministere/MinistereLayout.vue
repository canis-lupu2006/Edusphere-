<template>
  <div class="flex h-screen overflow-hidden bg-[#f4f7f5] text-[#0f1f17]">
    <aside class="flex h-full w-64 shrink-0 flex-col border-r border-emerald-900/10 bg-white">
      <div class="px-5 py-5">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#166534] text-white">
            <Leaf class="h-5 w-5" />
          </div>
          <div>
            <p class="font-display text-lg font-semibold text-[#166534]">EduSphere</p>
            <p class="text-[10px] text-emerald-700/70">Éduquer · Grandir · Réussir</p>
          </div>
        </div>
        <p class="mt-4 text-[10px] font-semibold uppercase tracking-wider text-emerald-800/55">
          Ministère de l'Éducation
        </p>
      </div>

      <nav class="flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
        <RouterLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-emerald-900/65 transition hover:bg-emerald-50"
          :class="{ 'bg-emerald-100 font-medium text-[#166534]': isActive(item) }"
        >
          <component :is="item.icon" class="h-4 w-4 shrink-0" />
          <span class="leading-snug">{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="border-t border-emerald-900/10 p-4">
        <div class="mb-3 rounded-xl bg-emerald-50/80 px-3 py-3">
          <p class="text-[11px] leading-relaxed text-emerald-800/80">
            Une éducation de qualité pour un Togo plus fort
          </p>
          <p class="mt-1 text-[10px] font-medium text-[#166534]">🇹🇬 République Togolaise</p>
        </div>
        <div class="mb-3 flex items-center gap-3">
          <div
            class="flex h-9 w-9 items-center justify-center rounded-full bg-[#166534]/15 text-xs font-bold text-[#166534]"
          >
            {{ auth.initials }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-emerald-950">{{ auth.displayName }}</p>
            <p class="text-[11px] text-emerald-800/50">Ministère</p>
          </div>
        </div>
        <button
          type="button"
          class="flex items-center gap-2 text-sm text-red-600 transition hover:text-red-700"
          @click="logout"
        >
          <LogOut class="h-4 w-4" />
          Déconnexion
        </button>
      </div>
    </aside>

    <div class="flex min-h-0 min-w-0 flex-1 flex-col">
      <header
        class="flex flex-wrap items-center gap-3 border-b border-emerald-900/10 bg-white px-5 py-3 md:px-8"
      >
        <div class="relative min-w-[14rem] flex-1">
          <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-800/40" />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Rechercher un établissement, une région, une matière…"
            class="w-full rounded-xl border border-emerald-900/10 bg-[#f4f7f5] py-2.5 pl-10 pr-4 text-sm text-emerald-950 outline-none placeholder:text-emerald-800/40 focus:border-[#166534]/40 focus:ring-2 focus:ring-[#166534]/15"
          />
        </div>
        <div class="flex items-center gap-3 text-sm text-emerald-900/60">
          <span class="hidden rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-[#166534] sm:inline">
            {{ anneeScolaire }}
          </span>
          <span class="hidden text-xs md:inline">{{ dateLabel }}</span>
        </div>
      </header>

      <main class="min-h-0 flex-1 overflow-y-auto px-5 py-6 md:px-8">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, provide, ref } from 'vue'
import { useRoute, useRouter, RouterLink, RouterView } from 'vue-router'
import {
  LayoutDashboard,
  Building2,
  Users,
  BarChart3,
  ChartLine,
  AlertTriangle,
  BookOpen,
  Eye,
  Ticket,
  FileText,
  Settings,
  Leaf,
  LogOut,
  Search,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import type { NavItem } from '@/types/models'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const searchQuery = ref('')
provide('ministereSearch', searchQuery)

const anneeScolaire = computed(
  () => localStorage.getItem('edusphere_annee_scolaire') || 'Année scolaire 2025 - 2026',
)

const dateLabel = computed(() =>
  new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }),
)

const nav: NavItem[] = [
  { to: '/ministere', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { to: '/ministere/etablissements', label: 'Établissements', icon: Building2 },
  { to: '/ministere/effectifs', label: 'Élèves & Enseignants', icon: Users },
  { to: '/ministere/statistiques', label: 'Statistiques', icon: BarChart3 },
  { to: '/ministere/indicateurs', label: 'Indicateurs', icon: ChartLine },
  { to: '/ministere/notions', label: 'Notions difficiles', icon: AlertTriangle },
  { to: '/ministere/programmes', label: 'Programmes officiels', icon: BookOpen },
  { to: '/ministere/supervision', label: 'Suivi & supervision', icon: Eye },
  { to: '/ministere/tickets', label: 'Tickets', icon: Ticket },
  { to: '/ministere/rapports', label: 'Rapports', icon: FileText },
  { to: '/ministere/parametres', label: 'Paramètres', icon: Settings },
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
