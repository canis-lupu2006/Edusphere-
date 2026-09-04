<template>
  <div>
    <header class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="font-display text-2xl font-semibold text-[#1a3d32] md:text-3xl">
          Suivi de {{ childName }}
        </h1>
        <p class="mt-1 text-sm text-[#1a3d32]/55">
          {{ subtitle }}
        </p>
      </div>
      <ChildSelector />
    </header>

    <div class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div class="rounded-2xl border border-[#1a5c45]/10 bg-white p-5 shadow-sm">
        <div class="mb-3 flex items-center justify-between">
          <div class="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a5c45]/12 text-[#1a5c45]">
            <ShieldCheck class="h-4 w-4" />
          </div>
          <Heart class="h-4 w-4 text-[#E98A76]/70" />
        </div>
        <p class="text-xs font-medium uppercase tracking-wide text-[#1a3d32]/45">Niveau global</p>
        <p class="mt-1 font-display text-2xl font-bold text-[#1a5c45]">{{ niveauLabel }}</p>
        <p class="mt-1 text-xs text-[#1a3d32]/50">{{ niveauHint }}</p>
      </div>

      <div class="rounded-2xl border border-[#1a5c45]/10 bg-white p-5 shadow-sm">
        <div class="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#E98A76]/15 text-[#E98A76]">
          <Clock class="h-4 w-4" />
        </div>
        <p class="text-xs font-medium uppercase tracking-wide text-[#1a3d32]/45">Devoirs en retard</p>
        <p class="mt-1 font-display text-2xl font-bold text-[#1a3d32]">
          {{ String(lateHomework.length).padStart(2, '0') }}
        </p>
        <p class="mt-1 text-xs text-[#1a3d32]/50">Besoin d'attention rapide.</p>
      </div>

      <div class="rounded-2xl border border-[#1a5c45]/10 bg-white p-5 shadow-sm">
        <div class="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <Bell class="h-4 w-4" />
        </div>
        <p class="text-xs font-medium uppercase tracking-wide text-[#1a3d32]/45">Alertes</p>
        <p class="mt-1 font-display text-2xl font-bold text-[#1a3d32]">
          {{ String(alerts.length).padStart(2, '0') }}
        </p>
        <p class="mt-1 text-xs text-[#1a3d32]/50">Points importants à suivre.</p>
      </div>

      <div class="rounded-2xl border border-[#1a5c45]/10 bg-white p-5 shadow-sm">
        <div class="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#1a5c45]/12 text-[#1a5c45]">
          <ClipboardList class="h-4 w-4" />
        </div>
        <p class="text-xs font-medium uppercase tracking-wide text-[#1a3d32]/45">Tickets suivis</p>
        <p class="mt-1 font-display text-2xl font-bold text-[#1a3d32]">
          {{ String(openTickets.length).padStart(2, '0') }}
        </p>
        <p class="mt-1 text-xs text-[#1a3d32]/50">Demandes en cours de traitement.</p>
      </div>
    </div>

    <section class="mb-6 rounded-2xl border border-[#1a5c45]/10 bg-white p-5 shadow-sm md:p-6">
      <div class="mb-4 flex items-start gap-3">
        <div class="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a5c45]/12 text-[#1a5c45]">
          <ShieldCheck class="h-4 w-4" />
        </div>
        <div>
          <h2 class="font-display text-lg font-semibold">Alertes importantes</h2>
          <p class="text-sm text-[#1a3d32]/50">
            Signaux à surveiller pour accompagner {{ childName }}.
          </p>
        </div>
      </div>

      <ul v-if="alerts.length" class="space-y-3">
        <li
          v-for="a in alerts"
          :key="a.id"
          class="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#F7F3EB] px-4 py-3"
        >
          <div class="flex min-w-0 items-start gap-3">
            <div
              class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
              :class="alertIconClass(a)"
            >
              <component :is="alertIcon(a)" class="h-4 w-4" />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-medium text-[#1a3d32]">{{ a.titre || a.type || 'Alerte' }}</p>
              <p class="mt-0.5 text-xs text-[#1a3d32]/55">{{ a.detail || '—' }}</p>
            </div>
          </div>
          <span
            class="shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold"
            :class="alertBadgeClass(a)"
          >
            {{ a.status || a.priorite || 'À suivre' }}
          </span>
        </li>
      </ul>
      <p v-else class="rounded-2xl bg-[#F7F3EB] px-4 py-6 text-center text-sm text-[#1a3d32]/45">
        Aucune alerte pour le moment.
      </p>
    </section>

    <footer
      class="flex flex-wrap items-center gap-4 rounded-2xl border border-[#1a5c45]/10 bg-gradient-to-r from-[#e8f0ea] to-[#f5ebe3] px-5 py-4"
    >
      <div class="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a5c45]/15 text-[#1a5c45]">
        <Users class="h-5 w-5" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="font-display text-base font-semibold text-[#1a3d32]">
          Nous sommes là pour accompagner {{ childName }}.
        </p>
        <p class="mt-0.5 text-sm text-[#1a3d32]/55">
          Chaque signal est une occasion d'avancer ensemble, sans pression.
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onUnmounted, ref, watch, type Ref, type Component } from 'vue'
import {
  ShieldCheck,
  Heart,
  Clock,
  Bell,
  ClipboardList,
  Users,
  TrendingDown,
  Calendar,
  AlertTriangle,
} from 'lucide-vue-next'
import {
  collection,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/firebase'
import type { AlertItem, Homework, ProgressRecord, Ticket, UserProfile } from '@/types/models'
import ChildSelector from './ChildSelector.vue'

const selectedChild = inject<Ref<UserProfile | null>>('selectedChild', ref(null))

const progress = ref<ProgressRecord[]>([])
const lateHomework = ref<Homework[]>([])
const alerts = ref<AlertItem[]>([])
const openTickets = ref<Ticket[]>([])
let unsubs: Unsubscribe[] = []

const childName = computed(
  () => selectedChild.value?.displayName || selectedChild.value?.nom || 'votre enfant',
)

const subtitle = computed(() => {
  const c = selectedChild.value
  if (!c) return 'Progression, notes et alertes'
  const parts = [c.classeNom, c.ecoleNom].filter(Boolean)
  return parts.length ? parts.join(' • ') : 'Progression, notes et alertes'
})

const avgProgress = computed(() => {
  if (!progress.value.length) return 0
  const sum = progress.value.reduce(
    (acc, p) => acc + (Number(p.percent ?? p.maitrise) || 0),
    0,
  )
  return Math.round(sum / progress.value.length)
})

const niveauLabel = computed(() => {
  const s = avgProgress.value
  if (!progress.value.length) return '—'
  if (s >= 80) return 'Excellent'
  if (s >= 60) return 'Bon'
  if (s >= 40) return 'Fragile'
  return 'À soutenir'
})

const niveauHint = computed(() => {
  if (!progress.value.length) return 'Pas encore de données.'
  if (avgProgress.value >= 60) return 'De belles bases et de bons résultats.'
  if (avgProgress.value >= 40) return 'Quelques points à consolider.'
  return 'Un accompagnement renforcé est utile.'
})

function alertIcon(a: AlertItem): Component {
  const t = (a.type || a.titre || '').toLowerCase()
  if (t.includes('devoir') || t.includes('retard')) return Calendar
  if (t.includes('difficul') || t.includes('baisse')) return TrendingDown
  return AlertTriangle
}

function alertIconClass(a: AlertItem) {
  const t = (a.type || a.titre || '').toLowerCase()
  if (t.includes('devoir') || t.includes('retard')) return 'bg-amber-100 text-amber-600'
  return 'bg-[#E98A76]/15 text-[#E98A76]'
}

function alertBadgeClass(a: AlertItem) {
  const s = (a.status || '').toLowerCase()
  if (s.includes('ouvert') || s.includes('urgent')) return 'bg-[#E98A76]/20 text-[#c45c4a]'
  return 'bg-amber-100 text-amber-700'
}

function clearUnsubs() {
  unsubs.forEach((u) => u())
  unsubs = []
}

watch(
  () => selectedChild.value?.uid,
  (id) => {
    clearUnsubs()
    progress.value = []
    lateHomework.value = []
    alerts.value = []
    openTickets.value = []
    if (!id) return

    unsubs.push(
      onSnapshot(query(collection(db, 'progress'), where('eleveId', '==', id)), (snap) => {
        progress.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ProgressRecord))
      }),
      onSnapshot(query(collection(db, 'homework'), where('eleveId', '==', id)), (snap) => {
        lateHomework.value = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Homework))
          .filter((h) => h.status === 'en_retard')
      }),
      onSnapshot(query(collection(db, 'alerts'), where('eleveId', '==', id)), (snap) => {
        alerts.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AlertItem))
      }),
      onSnapshot(
        query(collection(db, 'tickets'), where('eleveId', '==', id), where('status', '==', 'ouvert')),
        (snap) => {
          openTickets.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Ticket))
        },
      ),
    )
  },
  { immediate: true },
)

onUnmounted(clearUnsubs)
</script>
