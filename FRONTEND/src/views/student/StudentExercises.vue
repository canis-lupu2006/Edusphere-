<template>
  <div>
    <header class="mb-6">
      <h1 class="page-title">Exercices</h1>
      <p class="page-sub">Entraîne-toi et soumets tes réponses.</p>
    </header>

    <div v-if="loading" class="py-12 text-center text-white/40">Chargement…</div>
    <div v-else-if="!exercises.length" class="glass-card py-12 text-center text-white/40">
      Aucun exercice disponible.
    </div>
    <ul v-else class="space-y-3">
      <li
        v-for="ex in exercises"
        :key="ex.id"
        class="glass-card flex items-center justify-between gap-4 p-4"
      >
        <div>
          <p class="font-medium">{{ ex.titre }}</p>
          <p class="text-xs text-white/40">
            {{ ex.questions?.length || 0 }} questions
            <span v-if="ex.matiere"> · {{ ex.matiere }}</span>
          </p>
        </div>
        <RouterLink :to="`/student/exercices/${ex.id}`" class="btn-primary text-sm !py-2">
          Commencer
        </RouterLink>
      </li>
    </ul>

    <section class="mt-10">
      <h2 class="mb-4 font-display text-lg font-semibold">Historique & recommandations</h2>
      <div v-if="!attempts.length" class="text-sm text-white/40">Aucune tentative pour l'instant.</div>
      <ul v-else class="space-y-2">
        <li
          v-for="a in attempts"
          :key="a.id"
          class="glass-card flex items-center justify-between p-3 text-sm"
        >
          <span>Exercice {{ a.exerciseId }}</span>
          <span class="font-semibold text-blue-300">{{ a.score ?? '—' }}%</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import type { Unsubscribe } from 'firebase/firestore'
import type { Attempt, Exercise } from '@/types/models'
import { RouterLink } from 'vue-router'
import { collection, query, where, getDocs, onSnapshot, orderBy, limit } from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const exercises = ref<Exercise[]>([])
const attempts = ref<Attempt[]>([])
const loading = ref(true)
let unsub: Unsubscribe | null = null

onMounted(async () => {
  const classeId = auth.profile?.classeId
  const uid = auth.user?.uid

  try {
    if (classeId) {
      const cq = query(collection(db, 'courses'), where('classeId', '==', classeId))
      const cSnap = await getDocs(cq)
      const ids = cSnap.docs.map((d) => d.id).slice(0, 10)
      if (ids.length) {
        const eq = query(collection(db, 'exercises'), where('courseId', 'in', ids))
        const eSnap = await getDocs(eq)
        exercises.value = eSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Exercise))
      }
    }
  } finally {
    loading.value = false
  }

  if (uid) {
    const aq = query(
      collection(db, 'attempts'),
      where('eleveId', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    )
    unsub = onSnapshot(
      aq,
      (snap) => {
        attempts.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Attempt))
      },
      () => {
        // Fallback sans orderBy si index manquant
        const simple = query(collection(db, 'attempts'), where('eleveId', '==', uid), limit(20))
        unsub = onSnapshot(simple, (snap) => {
          attempts.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Attempt))
        })
      }
    )
  }
})

onUnmounted(() => unsub?.())
</script>
