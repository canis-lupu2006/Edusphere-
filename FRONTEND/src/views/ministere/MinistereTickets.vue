<template>
  <div>
    <header class="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#166534]/70">
          Ministère
        </p>
        <h1 class="font-display text-2xl font-semibold text-emerald-950">Tickets</h1>
        <p class="mt-1 text-sm text-emerald-900/55">
          {{ filtered.length }} ticket(s) · vue nationale
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <select
          v-model="statusFilter"
          class="rounded-xl border border-emerald-900/10 bg-white px-3 py-2 text-sm outline-none"
        >
          <option value="">Tous les statuts</option>
          <option value="ouvert">Ouvert</option>
          <option value="en_cours">En cours</option>
          <option value="resolu">Résolu</option>
          <option value="nouveau">Nouveau</option>
        </select>
        <input
          v-model="search"
          type="search"
          placeholder="Rechercher…"
          class="rounded-xl border border-emerald-900/10 bg-white px-3 py-2 text-sm outline-none"
        />
      </div>
    </header>

    <div v-if="loading" class="py-12 text-center text-emerald-900/40">Chargement…</div>
    <div
      v-else-if="!filtered.length"
      class="rounded-2xl bg-white p-10 text-center text-emerald-900/45 shadow-sm"
    >
      Aucun ticket.
    </div>
    <div v-else class="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[52rem] text-left text-sm">
          <thead class="bg-emerald-50/80 text-xs uppercase text-emerald-900/45">
            <tr>
              <th class="px-4 py-3 font-medium">Message / notion</th>
              <th class="px-4 py-3 font-medium">Élève</th>
              <th class="px-4 py-3 font-medium">Classe</th>
              <th class="px-4 py-3 font-medium">Statut</th>
              <th class="px-4 py-3 font-medium">Priorité</th>
              <th class="px-4 py-3 font-medium">Assigné</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="t in filtered"
              :key="t.id"
              class="border-t border-emerald-900/5 hover:bg-emerald-50/40"
            >
              <td class="max-w-xs truncate px-4 py-3 font-medium text-emerald-950">
                {{ t.message || t.notion || '—' }}
              </td>
              <td class="px-4 py-3 text-emerald-900/65">{{ t.eleveNom || '—' }}</td>
              <td class="px-4 py-3 text-emerald-900/65">{{ t.classeNom || '—' }}</td>
              <td class="px-4 py-3">
                <span
                  class="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
                  :class="statusClass(t.status)"
                >
                  {{ t.status || '—' }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span
                  class="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
                  :class="priorityClass(t.priorite)"
                >
                  {{ t.priorite || 'normale' }}
                </span>
              </td>
              <td class="px-4 py-3 text-emerald-900/65">{{ t.assigneNom || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'
import type { Ticket } from '@/types/models'

const loading = ref(true)
const tickets = ref<Ticket[]>([])
const statusFilter = ref('')
const search = ref('')

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return tickets.value.filter((t) => {
    if (statusFilter.value && t.status !== statusFilter.value) return false
    if (!q) return true
    const hay = [t.message, t.notion, t.eleveNom, t.classeNom, t.assigneNom]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return hay.includes(q)
  })
})

function statusClass(s?: string) {
  if (s === 'resolu') return 'bg-emerald-100 text-[#166534]'
  if (s === 'ouvert' || s === 'nouveau') return 'bg-amber-100 text-amber-800'
  if (s === 'en_cours') return 'bg-sky-100 text-sky-800'
  return 'bg-slate-100 text-slate-700'
}

function priorityClass(p?: string) {
  if (p === 'urgent' || p === 'haute') return 'bg-red-100 text-red-800'
  if (p === 'basse') return 'bg-sky-100 text-sky-800'
  return 'bg-slate-100 text-slate-700'
}

onMounted(async () => {
  try {
    const snap = await getDocs(collection(db, 'tickets'))
    tickets.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Ticket))
  } finally {
    loading.value = false
  }
})
</script>
