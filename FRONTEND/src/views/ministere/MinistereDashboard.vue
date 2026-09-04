<template>
  <div>
    <header class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#166534]/70">
          Ministère de l'Éducation du Togo
        </p>
        <h1 class="font-display text-2xl font-semibold text-emerald-950 md:text-3xl">
          Bienvenue
        </h1>
        <p class="mt-1 text-sm text-emerald-900/55">
          Vue globale du système éducatif EduSphere
        </p>
      </div>
      <div
        class="max-w-sm rounded-2xl border border-emerald-900/10 bg-gradient-to-br from-emerald-50 to-white px-5 py-4 shadow-sm"
      >
        <p class="text-sm italic leading-relaxed text-emerald-900/80">
          « Investir dans l'éducation, c'est bâtir le Togo de demain. »
        </p>
      </div>
    </header>

    <div class="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <div v-for="k in kpis" :key="k.label" class="rounded-2xl bg-white p-4 shadow-sm">
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="text-xs uppercase tracking-wide text-emerald-900/45">{{ k.label }}</p>
            <p class="mt-1 font-display text-2xl font-bold text-[#166534]">{{ k.value }}</p>
          </div>
          <div class="rounded-xl bg-emerald-50 p-2 text-[#166534]">
            <component :is="k.icon" class="h-4 w-4" />
          </div>
        </div>
        <p v-if="k.hint" class="mt-2 text-[11px]" :class="k.hintClass">{{ k.hint }}</p>
      </div>
    </div>

    <div class="mb-6 grid gap-4 xl:grid-cols-2">
      <section class="rounded-2xl bg-white p-5 shadow-sm">
        <h2 class="mb-3 font-display text-lg font-semibold text-emerald-950">
          Top établissements
        </h2>
        <div v-if="loading" class="py-8 text-center text-sm text-emerald-900/40">Chargement…</div>
        <div v-else-if="!topSchools.length" class="py-8 text-center text-sm text-emerald-900/40">
          Aucun établissement.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[28rem] text-left text-sm">
            <thead>
              <tr class="border-b border-emerald-900/10 text-xs uppercase text-emerald-900/45">
                <th class="pb-2 font-medium">Établissement</th>
                <th class="pb-2 font-medium">Région</th>
                <th class="pb-2 font-medium">Élèves</th>
                <th class="pb-2 font-medium">Maîtrise</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="s in topSchools"
                :key="s.id"
                class="border-b border-emerald-900/5 last:border-0"
              >
                <td class="py-2.5 font-medium text-emerald-950">{{ s.nom || s.name || '—' }}</td>
                <td class="py-2.5 text-emerald-900/60">{{ s.region || '—' }}</td>
                <td class="py-2.5 tabular-nums text-emerald-900/70">{{ s.elevesCount ?? '—' }}</td>
                <td class="py-2.5">
                  <div class="flex items-center gap-2">
                    <div class="h-1.5 w-16 overflow-hidden rounded-full bg-emerald-100">
                      <div
                        class="h-full rounded-full bg-[#166534]"
                        :style="{ width: `${Math.min(100, s.maitrise ?? 0)}%` }"
                      />
                    </div>
                    <span class="tabular-nums font-semibold text-[#166534]">
                      {{ s.maitrise ?? 0 }}%
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="rounded-2xl bg-white p-5 shadow-sm">
        <h2 class="mb-3 font-display text-lg font-semibold text-emerald-950">Tickets en cours</h2>
        <ul v-if="openTickets.length" class="space-y-2 text-sm">
          <li
            v-for="t in openTickets.slice(0, 6)"
            :key="t.id"
            class="flex items-center justify-between gap-2 rounded-xl bg-emerald-50/80 px-3 py-2"
          >
            <span class="truncate text-emerald-950">{{ t.message || t.notion || 'Ticket' }}</span>
            <span
              class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
              :class="priorityClass(t.priorite)"
            >
              {{ t.priorite || t.status || 'ouvert' }}
            </span>
          </li>
        </ul>
        <p v-else class="text-sm text-emerald-900/45">Aucun ticket ouvert.</p>
        <p class="mt-3 text-xs text-emerald-900/50">
          {{ stats.ticketsOuverts }} ouvert(s) · {{ stats.ticketsResolus }} résolu(s)
        </p>
      </section>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <section class="rounded-2xl bg-white p-5 shadow-sm">
        <h2 class="mb-3 font-display text-lg font-semibold text-emerald-950">Alertes critiques</h2>
        <ul v-if="alerts.length" class="space-y-2 text-sm">
          <li
            v-for="a in alerts.slice(0, 6)"
            :key="a.id"
            class="rounded-xl border border-amber-200/60 bg-amber-50/50 px-3 py-2"
          >
            <p class="font-medium text-emerald-950">{{ a.titre || a.type || 'Alerte' }}</p>
            <p class="mt-0.5 text-xs text-emerald-900/55">{{ a.detail || '—' }}</p>
          </li>
        </ul>
        <p v-else class="text-sm text-emerald-900/45">Aucune alerte.</p>
      </section>

      <section class="rounded-2xl bg-white p-5 shadow-sm">
        <h2 class="mb-3 font-display text-lg font-semibold text-emerald-950">Activité récente</h2>
        <ul v-if="activity.length" class="space-y-2 text-sm">
          <li
            v-for="log in activity.slice(0, 8)"
            :key="log.id"
            class="flex gap-3 rounded-xl bg-emerald-50/60 px-3 py-2"
          >
            <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#166534]" />
            <div class="min-w-0">
              <p class="text-emerald-950">{{ log.message || log.type || 'Événement' }}</p>
              <p class="text-[11px] text-emerald-900/45">{{ formatDate(log.createdAt) }}</p>
            </div>
          </li>
        </ul>
        <p v-else class="text-sm text-emerald-900/45">Aucune activité récente.</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Building2, Users, UserCheck, GraduationCap, WifiOff } from 'lucide-vue-next'
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '@/firebase'
import type { ActivityLog, AlertItem, School, Ticket } from '@/types/models'

const loading = ref(true)
const schools = ref<School[]>([])
const openTickets = ref<Ticket[]>([])
const alerts = ref<AlertItem[]>([])
const activity = ref<ActivityLog[]>([])

const stats = reactive({
  ecoles: 0,
  eleves: 0,
  enseignants: 0,
  maitrise: 0,
  offline: 19,
  ticketsOuverts: 0,
  ticketsResolus: 0,
})

const topSchools = computed(() =>
  [...schools.value]
    .sort((a, b) => (b.maitrise ?? 0) - (a.maitrise ?? 0))
    .slice(0, 5),
)

const kpis = computed(() => [
  {
    label: 'Établissements',
    value: stats.ecoles,
    icon: Building2,
    hint: undefined as string | undefined,
    hintClass: '',
  },
  {
    label: 'Élèves inscrits',
    value: stats.eleves.toLocaleString('fr-FR'),
    icon: Users,
    hint: undefined,
    hintClass: '',
  },
  {
    label: 'Enseignants',
    value: stats.enseignants.toLocaleString('fr-FR'),
    icon: UserCheck,
    hint: undefined,
    hintClass: '',
  },
  {
    label: 'Taux de maîtrise',
    value: `${stats.maitrise}%`,
    icon: GraduationCap,
    hint: 'Moyenne nationale (progress)',
    hintClass: 'text-emerald-700',
  },
  {
    label: 'Usage hors-ligne',
    value: `${stats.offline}%`,
    icon: WifiOff,
    hint: 'Estimation statique',
    hintClass: 'text-amber-700',
  },
])

function priorityClass(p?: string) {
  if (p === 'urgent' || p === 'haute') return 'bg-red-100 text-red-800'
  if (p === 'basse') return 'bg-sky-100 text-sky-800'
  return 'bg-amber-100 text-amber-800'
}

function formatDate(value: unknown) {
  if (!value) return ''
  const ts = value as Timestamp
  if (typeof ts?.toDate === 'function') {
    return ts.toDate().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
  }
  return String(value)
}

onMounted(async () => {
  try {
    const [schoolsSnap, usersSnap, progressSnap, ticketsSnap, alertsSnap, activitySnap] =
      await Promise.all([
        getDocs(collection(db, 'ecoles')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'progress')),
        getDocs(collection(db, 'tickets')),
        getDocs(query(collection(db, 'alerts'), limit(20))),
        getDocs(query(collection(db, 'activity_logs'), orderBy('createdAt', 'desc'), limit(20))).catch(
          () => getDocs(query(collection(db, 'activity_logs'), limit(20))),
        ),
      ])

    schools.value = schoolsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as School))
    stats.ecoles = schoolsSnap.size

    let eleves = 0
    let enseignants = 0
    usersSnap.forEach((d) => {
      const r = d.data().role
      if (r === 'eleve') eleves++
      else if (r === 'enseignant') enseignants++
    })
    stats.eleves = eleves
    stats.enseignants = enseignants

    const maitriseVals = progressSnap.docs
      .map((d) => {
        const data = d.data()
        return Number(data.maitrise ?? data.percent ?? 0)
      })
      .filter((n) => !Number.isNaN(n))
    stats.maitrise = maitriseVals.length
      ? Math.round(maitriseVals.reduce((a, b) => a + b, 0) / maitriseVals.length)
      : Math.round(
          schools.value.reduce((a, s) => a + (s.maitrise ?? 0), 0) /
            Math.max(1, schools.value.filter((s) => s.maitrise != null).length),
        ) || 0

    const allTickets = ticketsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Ticket))
    openTickets.value = allTickets.filter(
      (t) => t.status === 'ouvert' || t.status === 'en_cours' || t.status === 'nouveau',
    )
    stats.ticketsOuverts = openTickets.value.length
    stats.ticketsResolus = allTickets.filter((t) => t.status === 'resolu').length

    alerts.value = alertsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as AlertItem))
    activity.value = activitySnap.docs.map((d) => ({ id: d.id, ...d.data() } as ActivityLog))
  } finally {
    loading.value = false
  }
})
</script>
