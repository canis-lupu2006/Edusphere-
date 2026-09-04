<template>
  <div>
    <header class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-violet-300">
          ESPACE ÉLÈVE
        </p>
        <h1 class="page-title">Progression & révisions</h1>
        <p class="page-sub">Ta maîtrise par compétence et ton programme de répétition espacée.</p>
      </div>
      <div class="flex items-center gap-3">
        <select v-model="matiereFilter" class="input-field !w-auto !pl-4 min-w-[180px]">
          <option value="">Toutes les matières</option>
          <option v-for="m in matieres" :key="m" :value="m">{{ m }}</option>
        </select>
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
      </div>
    </header>

    <div class="mb-6 grid gap-4 lg:grid-cols-2">
      <!-- Maîtrise -->
      <div class="glass-card p-5">
        <div class="mb-4 flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20 text-sm font-bold text-blue-300"
          >
            Σ
          </div>
          <h2 class="font-display text-lg font-semibold">
            {{ masteryTitle }}
          </h2>
        </div>
        <ul v-if="masteryTopics.length" class="space-y-4">
          <li v-for="(t, i) in masteryTopics" :key="i">
            <div class="mb-1 flex justify-between text-sm">
              <span>{{ t.titre }}</span>
              <span class="text-white/50">{{ t.percent }}%</span>
            </div>
            <div class="h-2.5 overflow-hidden rounded-full bg-white/10">
              <div
                class="h-full rounded-full bg-gradient-to-r"
                :class="barClass(i)"
                :style="{ width: `${t.percent}%` }"
              />
            </div>
          </li>
        </ul>
        <p v-else class="text-sm text-white/40">Pas encore de progression enregistrée.</p>
        <RouterLink
          to="/student/progression"
          class="mt-5 inline-block text-sm text-blue-400 hover:underline"
        >
          Voir le détail par compétences →
        </RouterLink>
      </div>

      <!-- Révisions -->
      <div class="glass-card p-5">
        <div class="mb-4 flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-700/60 text-blue-300"
          >
            <CalendarDays class="h-5 w-5" />
          </div>
          <h2 class="font-display text-lg font-semibold">Révisions programmées</h2>
        </div>
        <ul v-if="revisions.length" class="space-y-3">
          <li
            v-for="r in revisions"
            :key="r.id"
            class="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5"
          >
            <div
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              :class="revisionTone(r).icon"
            >
              <CalendarDays class="h-4 w-4" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs font-medium" :class="revisionTone(r).label">
                {{ dueLabelOf(r) }}
              </p>
              <p class="truncate text-sm">
                {{ r.titre || 'Révision' }}
                <span v-if="r.matiere" class="text-white/40">({{ r.matiere }})</span>
              </p>
            </div>
            <span
              class="rounded-md px-2 py-0.5 text-xs font-bold"
              :class="revisionTone(r).badge"
            >
              {{ r.count ?? 1 }}
            </span>
          </li>
        </ul>
        <p v-else class="text-sm text-white/40">Aucune révision programmée.</p>
      </div>
    </div>

    <!-- Erreurs fréquentes -->
    <div class="glass-card p-5">
      <div class="mb-4 flex items-center gap-2">
        <AlertTriangle class="h-5 w-5 text-amber-400" />
        <h2 class="font-display text-lg font-semibold">Erreurs fréquentes</h2>
      </div>
      <ul v-if="errors.length" class="divide-y divide-white/5">
        <li
          v-for="e in errors"
          :key="e.id"
          class="flex cursor-pointer items-center gap-3 py-3 transition hover:bg-white/[0.02]"
        >
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
            :class="errorIconClass(e)"
          >
            {{ errorGlyph(e) }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-medium">{{ e.titre || 'Erreur' }}</p>
            <p class="text-xs text-white/40">
              {{ e.matiere || '—' }}
              <span v-if="e.notion || e.competence">
                • {{ e.notion || e.competence }}
              </span>
            </p>
          </div>
          <ChevronRight class="h-4 w-4 text-white/30" />
        </li>
      </ul>
      <p v-else class="text-sm text-white/40">Aucune erreur fréquente détectée.</p>
      <div class="mt-4 text-center">
        <button type="button" class="text-sm text-blue-400 hover:underline">
          Voir toutes les erreurs fréquentes →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { collection, query, where, getDocs, limit } from 'firebase/firestore'
import { Bell, CalendarDays, AlertTriangle, ChevronRight } from 'lucide-vue-next'
import type { FrequentError, ProgressRecord, ProgressTopic, Revision } from '@/types/models'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const progress = ref<ProgressRecord[]>([])
const revisions = ref<Revision[]>([])
const errors = ref<FrequentError[]>([])
const matiereFilter = ref('')

const matieres = computed(() =>
  [...new Set(progress.value.map((p) => p.matiere).filter(Boolean) as string[])].sort(),
)

const filteredProgress = computed(() => {
  if (!matiereFilter.value) return progress.value
  return progress.value.filter((p) => p.matiere === matiereFilter.value)
})

const masteryTitle = computed(() => {
  if (matiereFilter.value) return matiereFilter.value
  return filteredProgress.value[0]?.matiere || filteredProgress.value[0]?.courseTitre || 'Mathématiques'
})

const masteryTopics = computed(() => {
  const rows = filteredProgress.value
  const topics: { titre: string; percent: number }[] = []
  for (const r of rows) {
    const list = (r.topics || r.competences || []) as ProgressTopic[]
    if (list.length) {
      for (const t of list) {
        topics.push({
          titre: t.titre || t.notion || 'Notion',
          percent: Math.round(Number(t.percent ?? t.maitrise ?? 0)),
        })
      }
    } else {
      topics.push({
        titre: r.matiere || r.courseTitre || 'Matière',
        percent: Math.round(Number(r.percent ?? r.maitrise ?? 0)),
      })
    }
  }
  return topics.slice(0, 6)
})

function barClass(i: number) {
  const bars = [
    'from-blue-500 to-cyan-400',
    'from-violet-600 to-indigo-500',
    'from-fuchsia-500 to-violet-500',
  ]
  return bars[i % bars.length]
}

function dueLabelOf(r: Revision) {
  if (r.dueLabel) return r.dueLabel
  const days = Number(r.dueInDays ?? 0)
  if (days <= 0) return "Aujourd'hui"
  if (days === 1) return 'Demain'
  return `Dans ${days} jours`
}

function revisionTone(r: Revision) {
  const days = Number(r.dueInDays ?? (r.dueLabel?.toLowerCase().includes('auj') ? 0 : 3))
  if (days <= 0)
    return {
      icon: 'bg-emerald-500/15 text-emerald-300',
      label: 'text-emerald-300',
      badge: 'bg-emerald-500/15 text-emerald-300',
    }
  if (days === 1)
    return {
      icon: 'bg-orange-500/15 text-orange-300',
      label: 'text-orange-300',
      badge: 'bg-orange-500/15 text-orange-300',
    }
  if (days <= 3)
    return {
      icon: 'bg-violet-500/15 text-violet-300',
      label: 'text-violet-300',
      badge: 'bg-violet-500/15 text-violet-300',
    }
  return {
    icon: 'bg-blue-500/15 text-blue-300',
    label: 'text-blue-300',
    badge: 'bg-blue-500/15 text-blue-300',
  }
}

function errorGlyph(e: FrequentError) {
  if (e.icon) return e.icon
  const m = (e.matiere || '').toLowerCase()
  if (m.includes('math')) return '+/−'
  if (m.includes('fran')) return 'Aa'
  return '≠'
}

function errorIconClass(e: FrequentError) {
  const m = (e.matiere || '').toLowerCase()
  if (m.includes('math')) return 'bg-rose-900/50 text-rose-300'
  if (m.includes('fran')) return 'bg-blue-500/20 text-blue-300'
  return 'bg-violet-500/20 text-violet-300'
}

onMounted(async () => {
  const uid = auth.user?.uid
  if (!uid) return

  const pq = query(collection(db, 'progress'), where('eleveId', '==', uid))
  const pSnap = await getDocs(pq)
  progress.value = pSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ProgressRecord))

  try {
    const rq = query(collection(db, 'revisions'), where('eleveId', '==', uid), limit(20))
    const rSnap = await getDocs(rq)
    revisions.value = rSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Revision))
  } catch {
    revisions.value = []
  }

  try {
    const eq = query(collection(db, 'frequent_errors'), where('eleveId', '==', uid), limit(20))
    const eSnap = await getDocs(eq)
    errors.value = eSnap.docs.map((d) => ({ id: d.id, ...d.data() } as FrequentError))
  } catch {
    errors.value = []
  }
})
</script>
