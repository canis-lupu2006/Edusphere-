<template>
  <div>
    <header class="mb-6">
      <h1 class="page-title">Suivi de progression</h1>
      <p class="page-sub">Moyennes des élèves via les tentatives.</p>
    </header>

    <div v-if="loading" class="py-12 text-center text-white/40">Chargement…</div>
    <div v-else-if="!rows.length" class="glass-card py-12 text-center text-white/40">
      Aucune donnée de progression.
    </div>
    <div v-else class="glass-card overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="border-b border-white/10 text-white/45">
          <tr>
            <th class="px-4 py-3 font-medium">Élève</th>
            <th class="px-4 py-3 font-medium">Tentatives</th>
            <th class="px-4 py-3 font-medium">Moyenne</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.eleveId" class="border-b border-white/5">
            <td class="px-4 py-3">{{ r.nom || r.eleveId }}</td>
            <td class="px-4 py-3">{{ r.count }}</td>
            <td class="px-4 py-3 font-semibold text-blue-300">{{ r.avg }}%</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Attempt } from '@/types/models'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const loading = ref(true)
const attempts = ref<Attempt[]>([])

const classeIds = computed((): string[] => {
  const p = auth.profile
  if (!p) return []
  return p.classeIds || (p.classeId ? [p.classeId] : [])
})

const rows = computed(() => {
  const map: Record<string, { eleveId: string; nom?: string; scores: number[] }> = {}
  for (const a of attempts.value) {
    const id = a.eleveId || 'unknown'
    if (!map[id]) map[id] = { eleveId: id, nom: a.eleveNom, scores: [] }
    map[id].scores.push(a.score || 0)
  }
  return Object.values(map)
    .map((r) => ({
      ...r,
      count: r.scores.length,
      avg: Math.round(r.scores.reduce((a, b) => a + b, 0) / r.scores.length),
    }))
    .sort((a, b) => b.avg - a.avg)
})

onMounted(async () => {
  try {
    const ids = classeIds.value.slice(0, 10)
    if (!ids.length) return
    const q = query(collection(db, 'attempts'), where('classeId', 'in', ids))
    const snap = await getDocs(q)
    attempts.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Attempt))
  } finally {
    loading.value = false
  }
})
</script>
