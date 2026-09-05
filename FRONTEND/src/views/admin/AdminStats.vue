<template>
  <div>
    <header class="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
          ADMINISTRATION
        </p>
        <h1 class="page-title">Statistiques</h1>
        <p class="page-sub">Analysez les performances et l'impact des actions pédagogiques.</p>
      </div>
      <button type="button" class="btn-secondary text-sm" @click="onExport">
        <Download class="h-4 w-4" />
        Exporter le rapport
      </button>
    </header>

    <div class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Régularité des révisions"
        :value="`${kpis.regularite}%`"
        hint="Basé sur les progressions"
        :icon="BookOpen"
        icon-bg="bg-emerald-100"
        icon-color="text-emerald-700"
      />
      <StatCard
        label="Participation"
        :value="`${kpis.participation}%`"
        hint="Tentatives / élèves"
        :icon="Users"
        icon-bg="bg-blue-100"
        icon-color="text-blue-600"
      />
      <StatCard
        label="Score moyen"
        :value="`${kpis.avgScore}%`"
        hint="Toutes tentatives"
        :icon="TrendingUp"
        icon-bg="bg-teal-100"
        icon-color="text-teal-700"
      />
      <StatCard
        label="Taux de résolution"
        :value="`${kpis.resolution}%`"
        hint="Tickets résolus"
        :icon="CheckCircle2"
        icon-bg="bg-violet-100"
        icon-color="text-violet-600"
      />
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <div class="glass-card p-5">
        <h2 class="mb-4 font-display text-lg font-semibold">Maîtrise moyenne par matière</h2>
        <ul v-if="masteryBars.length" class="space-y-4">
          <li v-for="m in masteryBars" :key="m.matiere">
            <div class="mb-1.5 flex items-center justify-between text-sm">
              <span class="text-slate-600">{{ m.matiere }}</span>
              <span class="font-semibold text-emerald-700">{{ m.avg }}%</span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                class="h-full rounded-full transition-all"
                :class="barColor(m.avg)"
                :style="{ width: `${Math.min(100, m.avg)}%` }"
              />
            </div>
          </li>
        </ul>
        <p v-else class="py-8 text-center text-sm text-slate-400">Pas encore de données de progression.</p>
      </div>

      <div class="glass-card p-5">
        <h2 class="mb-4 font-display text-lg font-semibold">Répartition des tickets</h2>
        <p class="mb-4 text-sm text-slate-500">
          <span class="font-display text-2xl font-bold text-slate-900">{{ ticketTotal }}</span>
          tickets au total
        </p>
        <ul class="space-y-3">
          <li
            v-for="row in ticketDist"
            :key="row.status"
            class="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
          >
            <div class="flex items-center gap-2">
              <span class="h-2.5 w-2.5 rounded-full" :class="row.dot" />
              <span class="capitalize text-slate-600">{{ row.label }}</span>
            </div>
            <div class="text-right">
              <span class="font-semibold">{{ row.count }}</span>
              <span class="ml-2 text-xs text-slate-400">{{ row.pct }}%</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import {
  BookOpen,
  Users,
  TrendingUp,
  CheckCircle2,
  Download,
} from 'lucide-vue-next'
import StatCard from '@/components/StatCard.vue'
import { db } from '@/firebase'
import type { Attempt, ProgressRecord, Ticket, UserProfile } from '@/types/models'

const kpis = reactive({
  regularite: 0,
  participation: 0,
  avgScore: 0,
  resolution: 0,
})

const masteryBars = ref<{ matiere: string; avg: number }[]>([])
const ticketDist = ref<{ status: string; label: string; count: number; pct: number; dot: string }[]>([])
const ticketTotal = computed(() => ticketDist.value.reduce((s, r) => s + r.count, 0))

function barColor(avg: number) {
  if (avg >= 80) return 'bg-emerald-500'
  if (avg >= 60) return 'bg-teal-500'
  if (avg >= 40) return 'bg-amber-500'
  return 'bg-orange-500'
}

function statusMeta(status: string) {
  const s = status.toLowerCase()
  if (s === 'resolu') return { label: 'Résolu', dot: 'bg-emerald-400' }
  if (s === 'intervention' || s === 'en_cours') return { label: 'Intervention', dot: 'bg-teal-400' }
  if (s === 'sans_reponse') return { label: 'Sans réponse', dot: 'bg-orange-400' }
  if (s === 'nouveau' || s === 'ouvert') return { label: 'Nouveau', dot: 'bg-blue-400' }
  return { label: status || 'Autre', dot: 'bg-slate-400' }
}

onMounted(async () => {
  const [attemptsSnap, progressSnap, ticketsSnap, usersSnap] = await Promise.all([
    getDocs(collection(db, 'attempts')),
    getDocs(collection(db, 'progress')),
    getDocs(collection(db, 'tickets')),
    getDocs(collection(db, 'users')),
  ])

  const attempts = attemptsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Attempt)
  const progress = progressSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as ProgressRecord)
  const tickets = ticketsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Ticket)
  const users = usersSnap.docs.map((d) => ({ uid: d.id, ...d.data() }) as UserProfile)
  const eleves = users.filter((u) => u.role === 'eleve').length || 1

  const scores = attempts.map((a) => Number(a.score ?? a.scoreDetail?.percent ?? 0))
  kpis.avgScore = scores.length
    ? Math.round(scores.reduce((s, n) => s + n, 0) / scores.length)
    : 0

  const maitrises = progress.map((p) => Number(p.maitrise ?? p.percent ?? 0))
  kpis.regularite = maitrises.length
    ? Math.round(maitrises.reduce((s, n) => s + n, 0) / maitrises.length)
    : 0

  const uniqueEleves = new Set(attempts.map((a) => a.eleveId).filter(Boolean))
  kpis.participation = Math.min(100, Math.round((uniqueEleves.size / eleves) * 100))

  const resolved = tickets.filter((t) => t.status === 'resolu').length
  kpis.resolution = tickets.length ? Math.round((resolved / tickets.length) * 100) : 0

  const byMatiere = new Map<string, number[]>()
  progress.forEach((p) => {
    const matiere = p.matiere || 'Autre'
    const val = Number(p.maitrise ?? p.percent ?? 0)
    if (!byMatiere.has(matiere)) byMatiere.set(matiere, [])
    byMatiere.get(matiere)!.push(val)
  })
  masteryBars.value = [...byMatiere.entries()]
    .map(([matiere, vals]) => ({
      matiere,
      avg: Math.round(vals.reduce((s, n) => s + n, 0) / vals.length),
    }))
    .sort((a, b) => b.avg - a.avg)

  const counts = new Map<string, number>()
  tickets.forEach((t) => {
    const key = String(t.status || 'autre')
    counts.set(key, (counts.get(key) || 0) + 1)
  })
  const total = tickets.length || 1
  ticketDist.value = [...counts.entries()].map(([status, count]) => {
    const meta = statusMeta(status)
    return {
      status,
      label: meta.label,
      count,
      pct: Math.round((count / total) * 100),
      dot: meta.dot,
    }
  })
})

function onExport() {
  window.alert('Export du rapport statistiques en cours de préparation.')
}
</script>
