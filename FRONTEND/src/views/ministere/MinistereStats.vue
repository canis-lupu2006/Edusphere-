<template>
  <div>
    <header class="mb-6">
      <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#166534]/70">
        Ministère
      </p>
      <h1 class="font-display text-2xl font-semibold text-emerald-950">Statistiques nationales</h1>
      <p class="mt-1 text-sm text-emerald-900/55">Indicateurs agrégés depuis progress et tickets</p>
    </header>

    <div class="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div class="rounded-2xl bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-emerald-900/45">Maîtrise moyenne</p>
        <p class="mt-1 font-display text-3xl font-bold text-[#166534]">{{ avgMaitrise }}%</p>
      </div>
      <div class="rounded-2xl bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-emerald-900/45">Entrées progress</p>
        <p class="mt-1 font-display text-3xl font-bold text-[#166534]">{{ progressCount }}</p>
      </div>
      <div class="rounded-2xl bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-emerald-900/45">Tickets totaux</p>
        <p class="mt-1 font-display text-3xl font-bold text-[#166534]">{{ ticketsTotal }}</p>
      </div>
      <div class="rounded-2xl bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-emerald-900/45">Taux résolution</p>
        <p class="mt-1 font-display text-3xl font-bold text-[#166534]">{{ resolutionRate }}%</p>
      </div>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <section class="rounded-2xl bg-white p-5 shadow-sm">
        <h2 class="mb-4 font-display text-lg font-semibold text-emerald-950">
          Maîtrise par matière
        </h2>
        <div v-if="loading" class="py-8 text-center text-sm text-emerald-900/40">Chargement…</div>
        <ul v-else-if="byMatiere.length" class="space-y-3">
          <li v-for="m in byMatiere" :key="m.name">
            <div class="mb-1 flex justify-between text-sm">
              <span>{{ m.name }}</span>
              <span class="font-semibold tabular-nums text-[#166534]">{{ m.avg }}%</span>
            </div>
            <div class="h-2.5 overflow-hidden rounded-full bg-emerald-100">
              <div
                class="h-full rounded-full bg-[#166534] transition-all"
                :style="{ width: `${Math.min(100, m.avg)}%` }"
              />
            </div>
          </li>
        </ul>
        <p v-else class="text-sm text-emerald-900/45">Aucune donnée de progression.</p>
      </section>

      <section class="rounded-2xl bg-white p-5 shadow-sm">
        <h2 class="mb-4 font-display text-lg font-semibold text-emerald-950">
          Tickets par statut
        </h2>
        <ul v-if="byStatus.length" class="space-y-3">
          <li v-for="s in byStatus" :key="s.name">
            <div class="mb-1 flex justify-between text-sm">
              <span class="capitalize">{{ s.name }}</span>
              <span class="font-semibold tabular-nums">{{ s.count }} ({{ s.pct }}%)</span>
            </div>
            <div class="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                class="h-full rounded-full"
                :class="statusBar(s.name)"
                :style="{ width: `${s.pct}%` }"
              />
            </div>
          </li>
        </ul>
        <p v-else class="text-sm text-emerald-900/45">Aucun ticket.</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'
import type { ProgressRecord, Ticket } from '@/types/models'

const loading = ref(true)
const progress = ref<ProgressRecord[]>([])
const tickets = ref<Ticket[]>([])

const progressCount = computed(() => progress.value.length)
const ticketsTotal = computed(() => tickets.value.length)

const avgMaitrise = computed(() => {
  const vals = progress.value
    .map((p) => Number(p.maitrise ?? p.percent ?? 0))
    .filter((n) => !Number.isNaN(n))
  if (!vals.length) return 0
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
})

const resolutionRate = computed(() => {
  if (!tickets.value.length) return 0
  const resolus = tickets.value.filter((t) => t.status === 'resolu').length
  return Math.round((resolus / tickets.value.length) * 100)
})

const byMatiere = computed(() => {
  const map = new Map<string, number[]>()
  for (const p of progress.value) {
    const name = (p.matiere || 'Autre').trim()
    const v = Number(p.maitrise ?? p.percent ?? 0)
    if (!map.has(name)) map.set(name, [])
    map.get(name)!.push(v)
  }
  return [...map.entries()]
    .map(([name, vals]) => ({
      name,
      avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
    }))
    .sort((a, b) => b.avg - a.avg)
})

const byStatus = computed(() => {
  const map = new Map<string, number>()
  for (const t of tickets.value) {
    const name = (t.status || 'inconnu').toLowerCase()
    map.set(name, (map.get(name) || 0) + 1)
  }
  const total = tickets.value.length || 1
  return [...map.entries()]
    .map(([name, count]) => ({ name, count, pct: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count)
})

function statusBar(name: string) {
  if (name.includes('resolu')) return 'bg-[#166534]'
  if (name.includes('ouvert') || name.includes('nouveau')) return 'bg-amber-500'
  if (name.includes('cours')) return 'bg-sky-500'
  return 'bg-slate-400'
}

onMounted(async () => {
  try {
    const [pSnap, tSnap] = await Promise.all([
      getDocs(collection(db, 'progress')),
      getDocs(collection(db, 'tickets')),
    ])
    progress.value = pSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ProgressRecord))
    tickets.value = tSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Ticket))
  } finally {
    loading.value = false
  }
})
</script>
