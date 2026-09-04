<template>
  <div>
    <header class="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 class="page-title">Bonjour {{ firstName }} 👋</h1>
        <p class="page-sub">Voici où en est ta progression cette semaine.</p>
      </div>
      <button
        type="button"
        class="relative rounded-xl border border-white/10 bg-white/5 p-2.5 text-white/70 transition hover:bg-white/10"
        aria-label="Notifications"
      >
        <Bell class="h-5 w-5" />
        <span
          class="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
        >
          2
        </span>
      </button>
    </header>

    <div class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Devoirs à rendre"
        :value="String(stats.devoirs).padStart(2, '0')"
        hint="À terminer cette semaine"
        :icon="Calendar"
        icon-bg="bg-blue-500/15"
        icon-color="text-blue-300"
      />
      <div class="stat-card">
        <div class="mb-3 flex items-start justify-between">
          <div class="relative flex h-12 w-12 items-center justify-center">
            <svg class="h-12 w-12 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="3" />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="url(#progGrad)"
                stroke-width="3"
                stroke-linecap="round"
                :stroke-dasharray="`${stats.progression * 0.97} 100`"
              />
              <defs>
                <linearGradient id="progGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#8b5cf6" />
                  <stop offset="100%" stop-color="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <span class="absolute text-xs font-bold text-violet-200">{{ stats.progression }}%</span>
          </div>
        </div>
        <p class="text-xs uppercase tracking-wide text-white/45">Progression</p>
        <p class="mt-1 font-display text-2xl font-bold">{{ stats.progression }}%</p>
        <p class="mt-1 text-xs text-white/40">Bravo, continue !</p>
      </div>
      <StatCard
        label="Matière à réviser"
        :value="String(stats.revisions).padStart(2, '0')"
        hint="Chapitres identifiés"
        :icon="BookOpen"
        icon-bg="bg-amber-500/15"
        icon-color="text-amber-300"
      />
      <StatCard
        label="Streak"
        :value="`${stats.streak} j`"
        hint="Garde le rythme !"
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
          <li v-for="p in progressBySubject" :key="p.matiere" class="flex items-center gap-3">
            <div
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
              :class="subjectTheme(p.matiere).bg + ' ' + subjectTheme(p.matiere).text"
            >
              {{ subjectTheme(p.matiere).glyph }}
            </div>
            <div class="min-w-0 flex-1">
              <div class="mb-1 flex justify-between text-sm">
                <span class="truncate">{{ p.matiere }}</span>
                <span class="text-white/50">{{ p.percent }}%</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  class="h-full rounded-full bg-gradient-to-r"
                  :class="subjectTheme(p.matiere).bar"
                  :style="{ width: `${p.percent}%` }"
                />
              </div>
            </div>
          </li>
        </ul>
        <div class="mt-5 text-center">
          <RouterLink to="/student/progression" class="text-sm text-blue-400 hover:underline">
            Voir tous mes progrès &gt;
          </RouterLink>
        </div>
      </div>

      <div class="glass-card flex flex-col border-violet-500/20 p-5">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="flex items-center gap-2 font-display text-lg font-semibold">
            <Sparkles class="h-5 w-5 text-violet-300" /> Tuteur IA
          </h2>
          <span class="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
            IA EN LIGNE
          </span>
        </div>

        <div v-if="weakNotion" class="mb-4">
          <p class="mb-2 text-xs text-white/45">Difficulté détectée :</p>
          <span class="inline-flex rounded-full border border-violet-400/40 bg-violet-500/15 px-3 py-1 text-xs text-violet-200">
            {{ weakNotion }}
          </span>
        </div>

        <div class="mb-4 flex flex-1 flex-col items-center justify-center py-2">
          <p class="mb-1 text-xs text-white/45">Maîtrise estimée</p>
          <p class="font-display text-4xl font-bold text-white">{{ weakMastery }}%</p>
          <p class="mt-2 max-w-xs text-center text-sm text-white/50">
            Consolidons ensemble cette notion pour passer au niveau supérieur.
          </p>
        </div>

        <RouterLink
          to="/student/tuteur"
          class="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 px-5 py-3 font-semibold shadow-glow-purple"
        >
          Commencer une session →
        </RouterLink>
      </div>
    </div>

    <div class="glass-card p-5">
      <h2 class="mb-4 font-display text-lg font-semibold">À faire prochainement</h2>
      <ul v-if="upcoming.length" class="divide-y divide-white/5">
        <li
          v-for="item in upcoming"
          :key="item.id"
          class="flex flex-wrap items-center justify-between gap-3 py-3"
        >
          <div class="min-w-0">
            <p class="text-xs font-medium" :class="subjectTheme(item.matiere).text">
              {{ item.matiere || 'À faire' }}
            </p>
            <p class="font-medium">{{ item.titre }}</p>
            <p class="text-xs text-white/40">{{ item.dateLabel }}</p>
          </div>
          <RouterLink :to="item.to" class="text-sm text-blue-400 hover:underline">
            Démarrer &gt;
          </RouterLink>
        </li>
      </ul>
      <p v-else class="text-sm text-white/40">Rien de prévu pour le moment.</p>
      <div class="mt-4 text-center">
        <RouterLink to="/student/exercices" class="text-sm text-white/45 hover:text-white/70">
          Voir toutes mes tâches ∨
        </RouterLink>
      </div>
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
import { Calendar, BookOpen, Flame, Sparkles, Bell } from 'lucide-vue-next'
import type { Unsubscribe } from 'firebase/firestore'
import StatCard from '@/components/StatCard.vue'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { subjectTheme } from '@/utils/subjectTheme'
import type { Exercise, Homework, ProgressRecord } from '@/types/models'

interface UpcomingItem {
  id: string
  titre: string
  matiere?: string
  dateLabel: string
  to: string
}

const auth = useAuthStore()
const firstName = computed(() => auth.displayName.split(' ')[0])

const stats = ref({
  devoirs: 0,
  progression: 0,
  revisions: 8,
  streak: Number(auth.profile?.streak ?? 5) || 5,
})
const progressBySubject = ref<{ matiere: string; percent: number }[]>([])
const upcoming = ref<UpcomingItem[]>([])
const weakNotion = ref('')
const weakMastery = ref(42)
let unsubs: Unsubscribe[] = []

onMounted(async () => {
  const uid = auth.user?.uid
  const classeId = auth.profile?.classeId
  if (!uid) return

  stats.value.streak = Number(auth.profile?.streak ?? 5) || 5

  // Homework à faire
  try {
    if (classeId) {
      const hq = query(
        collection(db, 'homework'),
        where('classeId', '==', classeId),
        where('status', '==', 'a_faire'),
      )
      unsubs.push(
        onSnapshot(
          hq,
          (snap) => {
            stats.value.devoirs = snap.size
          },
          async () => {
            const hq2 = query(collection(db, 'homework'), where('eleveId', '==', uid))
            const snap = await getDocs(hq2)
            stats.value.devoirs = snap.docs.filter(
              (d) => (d.data().status || 'a_faire') === 'a_faire',
            ).length
          },
        ),
      )
    } else {
      const hq2 = query(collection(db, 'homework'), where('eleveId', '==', uid))
      const snap = await getDocs(hq2)
      stats.value.devoirs = snap.docs.filter(
        (d) => (d.data().status || 'a_faire') === 'a_faire',
      ).length
    }
  } catch {
    /* ignore */
  }

  // Progress
  try {
    const pq = query(collection(db, 'progress'), where('eleveId', '==', uid))
    const pSnap = await getDocs(pq)
    const rows = pSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ProgressRecord))
    progressBySubject.value = rows.map((data) => ({
      matiere: data.matiere || data.courseTitre || 'Matière',
      percent: Math.round(Number(data.percent ?? data.maitrise ?? 0)),
    }))
    if (progressBySubject.value.length) {
      stats.value.progression = Math.round(
        progressBySubject.value.reduce((a, b) => a + b.percent, 0) /
          progressBySubject.value.length,
      )
      const weakest = [...progressBySubject.value].sort((a, b) => a.percent - b.percent)[0]
      if (weakest && weakest.percent < 60) {
        weakMastery.value = weakest.percent
        const row = rows.find(
          (r) => (r.matiere || r.courseTitre) === weakest.matiere,
        )
        const topics = row?.topics || row?.competences || []
        weakNotion.value =
          (topics[0] as { titre?: string; notion?: string } | undefined)?.titre ||
          (topics[0] as { titre?: string; notion?: string } | undefined)?.notion ||
          weakest.matiere
      }
    }
  } catch (e) {
    console.warn(e)
  }

  // Revisions count
  try {
    const rq = query(collection(db, 'revisions'), where('eleveId', '==', uid))
    const rSnap = await getDocs(rq)
    if (rSnap.size) stats.value.revisions = rSnap.size
  } catch {
    /* keep default */
  }

  // Upcoming: homework + exercises
  const items: UpcomingItem[] = []

  if (classeId) {
    try {
      const hq = query(collection(db, 'homework'), where('classeId', '==', classeId), limit(5))
      const hSnap = await getDocs(hq)
      hSnap.docs.forEach((d) => {
        const h = { id: d.id, ...d.data() } as Homework
        if (h.status && !['a_faire', 'en_cours', 'a_venir'].includes(String(h.status))) return
        items.push({
          id: `hw-${h.id}`,
          titre: h.titre ? `Devoir à rendre — ${h.titre}` : 'Devoir à rendre',
          matiere: h.matiere,
          dateLabel: 'Cette semaine',
          to: '/student/exercices',
        })
      })
    } catch {
      /* ignore */
    }

    try {
      const cq = query(collection(db, 'courses'), where('classeId', '==', classeId))
      const cSnap = await getDocs(cq)
      const courseIds = cSnap.docs.map((d) => d.id).slice(0, 10)
      if (courseIds.length) {
        const eq = query(collection(db, 'exercises'), where('courseId', 'in', courseIds), limit(5))
        const eSnap = await getDocs(eq)
        eSnap.docs.forEach((d) => {
          const ex = { id: d.id, ...d.data() } as Exercise
          items.push({
            id: `ex-${ex.id}`,
            titre: ex.titre ? `Révisions — ${ex.titre}` : 'Exercice',
            matiere: ex.matiere,
            dateLabel: 'À faire',
            to: `/student/exercices/${ex.id}`,
          })
        })
      }
    } catch (e) {
      console.warn(e)
    }
  }

  upcoming.value = items.slice(0, 4)
})

onUnmounted(() => unsubs.forEach((u) => u()))
</script>
