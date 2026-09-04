<template>
  <div>
    <header class="mb-6 flex items-start justify-between gap-4">
      <div>
        <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-blue-400">
          ESPACE ÉLÈVE
        </p>
        <h1 class="page-title">Exercices</h1>
        <p class="page-sub">
          Exercices progressifs générés à partir des chapitres et adaptés à ton niveau.
        </p>
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

    <div class="mb-6 flex gap-6 border-b border-white/10">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="relative pb-3 text-sm font-medium transition"
        :class="activeTab === tab.key ? 'text-blue-400' : 'text-white/45 hover:text-white/70'"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span
          v-if="activeTab === tab.key"
          class="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-blue-500"
        />
      </button>
    </div>

    <div class="glass-card overflow-hidden">
      <div v-if="loading" class="py-12 text-center text-white/40">Chargement…</div>
      <div v-else-if="!filtered.length" class="py-12 text-center text-white/40">
        Aucun exercice dans cet onglet.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr class="border-b border-white/10 text-[10px] uppercase tracking-wider text-blue-300/70">
              <th class="px-5 py-3 font-semibold">Titre</th>
              <th class="px-3 py-3 font-semibold">Matières</th>
              <th class="px-3 py-3 font-semibold">Compétences</th>
              <th class="px-3 py-3 font-semibold">Difficulté</th>
              <th class="px-3 py-3 font-semibold">Statut</th>
              <th class="px-3 py-3 font-semibold">Score</th>
              <th class="px-3 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in filtered"
              :key="row.id"
              class="cursor-pointer border-b border-white/5 transition hover:bg-white/[0.03]"
              @click="goTo(row.id)"
            >
              <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                    :class="subjectTheme(row.matiere).bg + ' ' + subjectTheme(row.matiere).text"
                  >
                    {{ subjectTheme(row.matiere).glyph }}
                  </div>
                  <span class="font-medium">{{ row.titre || 'Exercice' }}</span>
                </div>
              </td>
              <td class="px-3 py-4 text-white/70">{{ row.matiere || '—' }}</td>
              <td class="px-3 py-4 text-white/55">{{ row.competence || '—' }}</td>
              <td class="px-3 py-4">
                <span
                  class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                  :class="diffClass(row.difficulte)"
                >
                  {{ diffLabel(row.difficulte) }}
                </span>
              </td>
              <td class="px-3 py-4">
                <span
                  class="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                  :class="statusClass(row.computedStatus)"
                >
                  {{ statusLabel(row.computedStatus) }}
                </span>
              </td>
              <td class="px-3 py-4 text-white/70">
                {{ row.score != null ? `${row.score}%` : '—' }}
              </td>
              <td class="px-3 py-4 text-right">
                <MoreVertical class="ml-auto h-4 w-4 text-white/30" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        class="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-3 text-xs text-white/45"
      >
        <span>
          Affichage de 1 à {{ filtered.length }} sur {{ filtered.length }} exercices
        </span>
        <div class="flex items-center gap-2">
          <button type="button" class="rounded-lg border border-white/10 px-2 py-1" disabled>
            &lt;
          </button>
          <span class="rounded-lg bg-blue-600 px-2.5 py-1 font-semibold text-white">1</span>
          <button type="button" class="rounded-lg border border-white/10 px-2 py-1" disabled>
            &gt;
          </button>
        </div>
        <span>Par page <strong class="text-white/70">10</strong></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Unsubscribe } from 'firebase/firestore'
import { collection, query, where, getDocs, onSnapshot, limit } from 'firebase/firestore'
import { Bell, MoreVertical } from 'lucide-vue-next'
import type { Attempt, Exercise, ExerciseStatus } from '@/types/models'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { subjectTheme } from '@/utils/subjectTheme'

type TabKey = 'tous' | 'a_faire' | 'en_cours' | 'termine'

interface ExerciseRow extends Exercise {
  score?: number | null
  computedStatus: ExerciseStatus
}

const tabs: { key: TabKey; label: string }[] = [
  { key: 'tous', label: 'Tous' },
  { key: 'a_faire', label: 'À faire' },
  { key: 'en_cours', label: 'En cours' },
  { key: 'termine', label: 'Terminés' },
]

const auth = useAuthStore()
const router = useRouter()
const exercises = ref<ExerciseRow[]>([])
const attempts = ref<Attempt[]>([])
const loading = ref(true)
const activeTab = ref<TabKey>('tous')
let unsub: Unsubscribe | null = null

const filtered = computed(() => {
  if (activeTab.value === 'tous') return exercises.value
  return exercises.value.filter((e) => e.computedStatus === activeTab.value)
})

function goTo(id: string) {
  router.push(`/student/exercices/${id}`)
}

function diffLabel(d?: string) {
  const v = (d || 'moyen').toLowerCase()
  if (v.includes('facil') || v === 'easy') return 'Facile'
  if (v.includes('diffic') || v === 'hard') return 'Difficile'
  return 'Moyen'
}

function diffClass(d?: string) {
  const label = diffLabel(d)
  if (label === 'Facile') return 'bg-emerald-500/15 text-emerald-300'
  if (label === 'Difficile') return 'bg-rose-500/15 text-rose-300'
  return 'bg-amber-500/15 text-amber-300'
}

function statusLabel(s: ExerciseStatus) {
  if (s === 'termine') return 'Terminé'
  if (s === 'en_cours') return 'En cours'
  return 'À faire'
}

function statusClass(s: ExerciseStatus) {
  if (s === 'termine') return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
  if (s === 'en_cours') return 'border-blue-500/40 bg-blue-500/10 text-blue-300'
  return 'border-slate-500/40 bg-slate-500/10 text-slate-300'
}

function resolveStatus(ex: Exercise, attempt?: Attempt): ExerciseStatus {
  if (ex.status === 'termine' || ex.status === 'en_cours' || ex.status === 'a_faire') {
    return ex.status
  }
  if (attempt?.score != null && Number(attempt.score) >= 0) return 'termine'
  if (attempt) return 'en_cours'
  return 'a_faire'
}

function rebuildRows() {
  const byEx = new Map<string, Attempt>()
  for (const a of attempts.value) {
    if (!a.exerciseId) continue
    const prev = byEx.get(a.exerciseId)
    if (!prev || Number(a.score ?? 0) >= Number(prev.score ?? 0)) byEx.set(a.exerciseId, a)
  }
  exercises.value = exercises.value.map((ex) => {
    const attempt = byEx.get(ex.id)
    return {
      ...ex,
      score: attempt?.score != null ? Math.round(Number(attempt.score)) : null,
      computedStatus: resolveStatus(ex, attempt),
      difficulte: ex.difficulte || 'moyen',
      competence: ex.competence || (ex as { chapitre?: string }).chapitre || '—',
    }
  })
}

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
        exercises.value = eSnap.docs.map((d) => {
          const data = { id: d.id, ...d.data() } as Exercise
          return {
            ...data,
            score: null,
            computedStatus: 'a_faire' as ExerciseStatus,
            difficulte: data.difficulte || 'moyen',
          }
        })
      }
    }
  } finally {
    loading.value = false
  }

  if (uid) {
    const aq = query(collection(db, 'attempts'), where('eleveId', '==', uid), limit(100))
    unsub = onSnapshot(aq, (snap) => {
      attempts.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Attempt))
      rebuildRows()
    })
  }
})

onUnmounted(() => unsub?.())
</script>
