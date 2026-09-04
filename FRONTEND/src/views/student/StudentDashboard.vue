<template>
  <div>
    <header class="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 class="page-title">Bonjour {{ firstName }} 👋</h1>
        <p class="page-sub">Voici où en est ta progression cette semaine.</p>
      </div>
    </header>

    <div class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Devoirs à rendre"
        :value="stats.devoirs"
        hint="À terminer cette semaine"
        :icon="Calendar"
        icon-bg="bg-blue-500/15"
        icon-color="text-blue-300"
      />
      <StatCard
        label="Progression"
        :value="`${stats.progression}%`"
        hint="Bravo, continue !"
        :icon="Target"
        icon-bg="bg-violet-500/15"
        icon-color="text-violet-300"
      />
      <StatCard
        label="Tentatives"
        :value="stats.attempts"
        hint="Exercices soumis"
        :icon="BookOpen"
        icon-bg="bg-amber-500/15"
        icon-color="text-amber-300"
      />
      <StatCard
        label="Tickets ouverts"
        :value="stats.tickets"
        hint="Demandes d'aide"
        :icon="Flame"
        icon-bg="bg-orange-500/15"
        icon-color="text-orange-300"
      />
    </div>

    <div class="mb-6 grid gap-4 lg:grid-cols-2">
      <div class="glass-card p-5">
        <h2 class="mb-4 font-display text-lg font-semibold">Mes progrès par matière</h2>
        <div v-if="!progressBySubject.length" class="text-sm text-white/40">
          Pas encore de données de progression.
        </div>
        <ul v-else class="space-y-4">
          <li v-for="p in progressBySubject" :key="p.matiere">
            <div class="mb-1 flex justify-between text-sm">
              <span>{{ p.matiere }}</span>
              <span class="text-white/50">{{ p.percent }}%</span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                class="h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-500"
                :style="{ width: `${p.percent}%` }"
              />
            </div>
          </li>
        </ul>
        <RouterLink to="/student/progression" class="mt-4 inline-block text-sm text-blue-400 hover:underline">
          Voir tous mes progrès →
        </RouterLink>
      </div>

      <div class="glass-card border-violet-500/20 p-5">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="flex items-center gap-2 font-display text-lg font-semibold">
            <Sparkles class="h-5 w-5 text-violet-300" /> Tuteur IA
          </h2>
          <span class="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
            IA EN LIGNE
          </span>
        </div>
        <p class="text-sm text-white/50">
          Besoin d'aide sur un chapitre ? Le tuteur te guide pas à pas.
        </p>
        <RouterLink
          to="/student/tuteur"
          class="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 px-5 py-3 font-semibold shadow-glow-purple"
        >
          Commencer une session →
        </RouterLink>
      </div>
    </div>

    <div class="glass-card p-5">
      <h2 class="mb-4 font-display text-lg font-semibold">À faire prochainement</h2>
      <ul v-if="upcoming.length" class="divide-y divide-white/5">
        <li
          v-for="ex in upcoming"
          :key="ex.id"
          class="flex items-center justify-between gap-3 py-3"
        >
          <div>
            <p class="font-medium">{{ ex.titre }}</p>
            <p class="text-xs text-white/40">{{ ex.matiere || 'Exercice' }}</p>
          </div>
          <RouterLink :to="`/student/exercices/${ex.id}`" class="text-sm text-blue-400 hover:underline">
            Démarrer →
          </RouterLink>
        </li>
      </ul>
      <p v-else class="text-sm text-white/40">Aucun exercice à faire pour le moment.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  collection,
  query,
  where,
  onSnapshot,
  limit,
  getDocs,
} from 'firebase/firestore'
import { Calendar, Target, BookOpen, Flame, Sparkles } from 'lucide-vue-next'
import type { Unsubscribe } from 'firebase/firestore'
import StatCard from '@/components/StatCard.vue'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import type { Exercise } from '@/types/models'

const auth = useAuthStore()
const firstName = computed(() => auth.displayName.split(' ')[0])

const stats = ref({ devoirs: 0, progression: 0, attempts: 0, tickets: 0 })
const progressBySubject = ref<{ matiere: string; percent: number }[]>([])
const upcoming = ref<Exercise[]>([])
let unsubs: Unsubscribe[] = []

onMounted(async () => {
  const uid = auth.user?.uid
  const classeId = auth.profile?.classeId
  if (!uid) return

  // Tickets ouverts
  const tq = query(
    collection(db, 'tickets'),
    where('eleveId', '==', uid),
    where('status', '==', 'ouvert')
  )
  unsubs.push(
    onSnapshot(tq, (snap) => {
      stats.value.tickets = snap.size
    })
  )

  // Attempts
  const aq = query(collection(db, 'attempts'), where('eleveId', '==', uid))
  unsubs.push(
    onSnapshot(aq, (snap) => {
      stats.value.attempts = snap.size
      const scores = snap.docs.map((d) => d.data().score || 0)
      stats.value.progression = scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0
    })
  )

  // Progress par matière
  try {
    const pq = query(collection(db, 'progress'), where('eleveId', '==', uid))
    const pSnap = await getDocs(pq)
    progressBySubject.value = pSnap.docs.map((d) => {
      const data = d.data()
      return {
        matiere: data.matiere || data.courseTitre || 'Matière',
        percent: data.percent ?? data.maitrise ?? 0,
      }
    })
  } catch (e) {
    console.warn(e)
  }

  // Exercices de la classe
  if (classeId) {
    try {
      const cq = query(collection(db, 'courses'), where('classeId', '==', classeId))
      const cSnap = await getDocs(cq)
      const courseIds = cSnap.docs.map((d) => d.id)
      if (courseIds.length) {
        // Firestore 'in' max 10
        const chunk = courseIds.slice(0, 10)
        const eq = query(
          collection(db, 'exercises'),
          where('courseId', 'in', chunk),
          limit(5)
        )
        const eSnap = await getDocs(eq)
        upcoming.value = eSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Exercise))
        stats.value.devoirs = eSnap.size
      }
    } catch (e) {
      console.warn(e)
    }
  }
})

onUnmounted(() => unsubs.forEach((u) => u()))
</script>
