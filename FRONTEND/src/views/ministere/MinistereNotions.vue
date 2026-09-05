<template>
  <div>
    <header class="mb-6">
      <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#166534]/70">
        Ministère
      </p>
      <h1 class="font-display text-2xl font-semibold text-emerald-950">Notions difficiles</h1>
      <p class="mt-1 text-sm text-emerald-900/55">
        Agrégation nationale des notions les plus problématiques
      </p>
    </header>

    <div v-if="loading" class="py-12 text-center text-emerald-900/40">Chargement…</div>
    <div
      v-else-if="!aggregated.length"
      class="rounded-2xl bg-white p-10 text-center text-emerald-900/45 shadow-sm"
    >
      Aucune notion détectée dans comprehension.
    </div>
    <ul v-else class="space-y-2">
      <li
        v-for="(n, i) in aggregated"
        :key="n.notion"
        class="flex flex-wrap items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm"
      >
        <span class="w-8 text-sm font-semibold text-emerald-900/40">{{ i + 1 }}</span>
        <div class="min-w-[12rem] flex-1">
          <p class="font-medium text-emerald-950">{{ n.notion }}</p>
          <p class="mt-0.5 text-xs text-emerald-900/50">
            {{ n.matiere || 'Matière n/c' }} · {{ n.count }} occurrence(s)
          </p>
        </div>
        <div class="min-w-[10rem] flex-[2]">
          <div class="h-2 overflow-hidden rounded-full bg-red-100">
            <div
              class="h-full rounded-full bg-red-500"
              :style="{ width: `${Math.min(100, n.difficultePercent)}%` }"
            />
          </div>
        </div>
        <span class="w-24 text-right font-display text-lg font-semibold tabular-nums text-red-700">
          {{ n.difficultePercent }}%
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'
import type { ComprehensionTopic } from '@/types/models'

const loading = ref(true)
const topics = ref<ComprehensionTopic[]>([])

const aggregated = computed(() => {
  const map = new Map<
    string,
    { notion: string; matiere?: string; totalDiff: number; count: number }
  >()
  for (const t of topics.value) {
    const key = (t.notion || 'Notion inconnue').trim()
    const cur = map.get(key) || {
      notion: key,
      matiere: t.matiere,
      totalDiff: 0,
      count: 0,
    }
    cur.totalDiff += Number(t.difficultePercent ?? 0)
    cur.count += 1
    if (!cur.matiere && t.matiere) cur.matiere = t.matiere
    map.set(key, cur)
  }
  return [...map.values()]
    .map((n) => ({
      notion: n.notion,
      matiere: n.matiere,
      count: n.count,
      difficultePercent: Math.round(n.totalDiff / n.count),
    }))
    .sort((a, b) => b.difficultePercent - a.difficultePercent)
})

onMounted(async () => {
  try {
    const snap = await getDocs(collection(db, 'comprehension'))
    topics.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ComprehensionTopic))
  } finally {
    loading.value = false
  }
})
</script>
