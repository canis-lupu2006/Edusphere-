<template>
  <div>
    <header class="mb-6">
      <p class="text-xs font-semibold uppercase tracking-wide text-blue-400">Espace élève</p>
      <h1 class="page-title">Progression & révisions</h1>
      <p class="page-sub">Suivi de ta maîtrise et recommandations.</p>
    </header>

    <div class="mb-6 grid gap-4 lg:grid-cols-2">
      <div class="glass-card p-5">
        <h2 class="mb-4 font-display text-lg font-semibold">Maîtrise par matière</h2>
        <ul v-if="progress.length" class="space-y-4">
          <li v-for="p in progress" :key="p.id">
            <div class="mb-1 flex justify-between text-sm">
              <span>{{ p.matiere || p.courseTitre }}</span>
              <span>{{ p.percent ?? p.maitrise ?? 0 }}%</span>
            </div>
            <div class="h-2 rounded-full bg-white/10">
              <div
                class="h-full rounded-full bg-blue-500"
                :style="{ width: `${p.percent ?? p.maitrise ?? 0}%` }"
              />
            </div>
          </li>
        </ul>
        <p v-else class="text-sm text-white/40">Pas encore de progression enregistrée.</p>
      </div>

      <div class="glass-card p-5">
        <h2 class="mb-4 font-display text-lg font-semibold">Dernières tentatives</h2>
        <ul v-if="attempts.length" class="space-y-2 text-sm">
          <li
            v-for="a in attempts"
            :key="a.id"
            class="flex justify-between rounded-lg bg-white/[0.03] px-3 py-2"
          >
            <span class="text-white/60">{{ a.exerciseId }}</span>
            <span class="font-semibold">{{ a.score }}%</span>
          </li>
        </ul>
        <p v-else class="text-sm text-white/40">Aucune tentative.</p>
      </div>
    </div>

    <div class="glass-card p-5">
      <h2 class="mb-3 font-display text-lg font-semibold">Recommandations IA</h2>
      <ul v-if="recommendations.length" class="space-y-2">
        <li
          v-for="(r, i) in recommendations"
          :key="i"
          class="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 text-sm text-white/70"
        >
          {{ r }}
        </li>
      </ul>
      <p v-else class="text-sm text-white/40">
        Soumets des exercices pour recevoir des recommandations personnalisées.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Attempt, ProgressRecord } from '@/types/models'
import { collection, query, where, getDocs, limit } from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const progress = ref<ProgressRecord[]>([])
const attempts = ref<Attempt[]>([])
const recommendations = ref<string[]>([])

onMounted(async () => {
  const uid = auth.user?.uid
  if (!uid) return

  const pq = query(collection(db, 'progress'), where('eleveId', '==', uid))
  const pSnap = await getDocs(pq)
  progress.value = pSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ProgressRecord))

  const aq = query(collection(db, 'attempts'), where('eleveId', '==', uid), limit(15))
  const aSnap = await getDocs(aq)
  attempts.value = aSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Attempt))

  recommendations.value = attempts.value
    .filter((a) => a.recommendation || a.analyse)
    .map((a) => String(a.recommendation || a.analyse))
    .slice(0, 5)
})
</script>
