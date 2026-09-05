<template>
  <div>
    <header class="mb-6">
      <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#166534]/70">
        Ministère
      </p>
      <h1 class="font-display text-2xl font-semibold text-emerald-950">Suivi & supervision</h1>
      <p class="mt-1 text-sm text-emerald-900/55">Vue nationale des tickets et priorités</p>
    </header>

    <div class="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div class="rounded-2xl bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-emerald-900/45">Total tickets</p>
        <p class="mt-1 font-display text-3xl font-bold text-[#166534]">{{ tickets.length }}</p>
      </div>
      <div class="rounded-2xl bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-emerald-900/45">Ouverts / en cours</p>
        <p class="mt-1 font-display text-3xl font-bold text-amber-700">{{ openCount }}</p>
      </div>
      <div class="rounded-2xl bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-emerald-900/45">Urgents</p>
        <p class="mt-1 font-display text-3xl font-bold text-red-700">{{ urgentCount }}</p>
      </div>
      <div class="rounded-2xl bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-emerald-900/45">Résolus</p>
        <p class="mt-1 font-display text-3xl font-bold text-[#166534]">{{ resolvedCount }}</p>
      </div>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <section class="rounded-2xl bg-white p-5 shadow-sm">
        <h2 class="mb-3 font-display text-lg font-semibold text-emerald-950">
          Répartition par priorité
        </h2>
        <ul class="space-y-3">
          <li v-for="p in byPriorite" :key="p.name">
            <div class="mb-1 flex justify-between text-sm">
              <span class="capitalize">{{ p.name }}</span>
              <span class="font-semibold">{{ p.count }}</span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                class="h-full rounded-full"
                :class="p.name === 'urgent' ? 'bg-red-500' : 'bg-[#166534]'"
                :style="{ width: `${p.pct}%` }"
              />
            </div>
          </li>
        </ul>
      </section>

      <section class="rounded-2xl bg-white p-5 shadow-sm">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="font-display text-lg font-semibold text-emerald-950">Tickets à suivre</h2>
          <RouterLink
            to="/ministere/tickets"
            class="text-xs font-semibold text-[#166534] hover:underline"
          >
            Voir tout →
          </RouterLink>
        </div>
        <div v-if="loading" class="py-6 text-center text-sm text-emerald-900/40">Chargement…</div>
        <ul v-else-if="openTickets.length" class="space-y-2 text-sm">
          <li
            v-for="t in openTickets.slice(0, 8)"
            :key="t.id"
            class="rounded-xl bg-emerald-50/70 px-3 py-2"
          >
            <p class="font-medium text-emerald-950">{{ t.message || t.notion || 'Ticket' }}</p>
            <p class="mt-0.5 text-xs text-emerald-900/50">
              {{ t.classeNom || t.eleveNom || '—' }} · {{ t.status }}
            </p>
          </li>
        </ul>
        <p v-else class="text-sm text-emerald-900/45">Aucun ticket ouvert.</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'
import type { Ticket } from '@/types/models'

const loading = ref(true)
const tickets = ref<Ticket[]>([])

const openTickets = computed(() =>
  tickets.value.filter(
    (t) => t.status === 'ouvert' || t.status === 'en_cours' || t.status === 'nouveau' || t.status === 'intervention',
  ),
)
const openCount = computed(() => openTickets.value.length)
const resolvedCount = computed(() => tickets.value.filter((t) => t.status === 'resolu').length)
const urgentCount = computed(
  () => tickets.value.filter((t) => t.priorite === 'urgent' || t.priorite === 'haute').length,
)

const byPriorite = computed(() => {
  const map = new Map<string, number>()
  for (const t of tickets.value) {
    const name = (t.priorite || 'normale').toLowerCase()
    map.set(name, (map.get(name) || 0) + 1)
  }
  const total = tickets.value.length || 1
  return [...map.entries()]
    .map(([name, count]) => ({ name, count, pct: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count)
})

onMounted(async () => {
  try {
    const snap = await getDocs(collection(db, 'tickets'))
    tickets.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Ticket))
  } finally {
    loading.value = false
  }
})
</script>
