<template>
  <div>
    <StudentPageHeader
      title="Progression & révisions"
      subtitle="Vue globale de ta maîtrise, historique des tentatives et lacunes détectées."
    >
      <template #actions>
        <select
          v-model="matiereFilter"
          class="min-w-[180px] rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none"
        >
          <option value="">Toutes les matières</option>
          <option v-for="m in matieres" :key="m" :value="m">{{ m }}</option>
        </select>
      </template>
    </StudentPageHeader>

    <!-- Vue globale -->
    <section class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div class="glass-card p-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Moyenne globale</p>
        <p class="mt-1 font-display text-3xl font-bold text-slate-900">{{ globalAvg }}%</p>
        <p class="mt-1 text-xs" :class="deltaGlobal >= 0 ? 'text-emerald-600' : 'text-rose-600'">
          {{ deltaGlobal >= 0 ? '+' : '' }}{{ deltaGlobal }} pts vs précédente
        </p>
      </div>
      <div class="glass-card p-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Matières suivies</p>
        <p class="mt-1 font-display text-3xl font-bold text-slate-900">{{ progress.length }}</p>
      </div>
      <div class="glass-card p-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Tentatives</p>
        <p class="mt-1 font-display text-3xl font-bold text-slate-900">{{ attempts.length }}</p>
      </div>
      <div class="glass-card p-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Lacunes actives</p>
        <p class="mt-1 font-display text-3xl font-bold text-amber-600">{{ errors.length }}</p>
      </div>
    </section>

    <!-- Radar matières -->
    <section class="glass-card mb-6 p-5">
      <h2 class="mb-4 font-display text-lg font-semibold">Vue globale par matière</h2>
      <div v-if="!progress.length" class="text-sm text-slate-400">Pas encore de données.</div>
      <ul v-else class="space-y-4">
        <li v-for="(p, i) in progressSorted" :key="p.id">
          <div class="mb-1 flex flex-wrap items-end justify-between gap-2 text-sm">
            <span class="font-medium">{{ p.matiere || p.courseTitre || 'Matière' }}</span>
            <span class="text-slate-500">
              {{ Math.round(Number(p.percent ?? p.maitrise ?? 0)) }}%
              <span
                v-if="p.previousPercent != null"
                class="ml-2 text-xs"
                :class="
                  Number(p.percent) >= Number(p.previousPercent)
                    ? 'text-emerald-600'
                    : 'text-rose-600'
                "
              >
                (avant {{ Math.round(Number(p.previousPercent)) }}%)
              </span>
            </span>
          </div>
          <div class="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              class="h-full rounded-full bg-gradient-to-r transition-all"
              :class="barClass(i)"
              :style="{ width: `${Math.min(100, Math.round(Number(p.percent ?? p.maitrise ?? 0)))}%` }"
            />
          </div>
        </li>
      </ul>
    </section>

    <div class="mb-6 grid gap-4 lg:grid-cols-2">
      <div class="glass-card p-5">
        <h2 class="mb-4 font-display text-lg font-semibold">
          {{ masteryTitle }} — détail compétences
        </h2>
        <ul v-if="masteryTopics.length" class="space-y-4">
          <li v-for="(t, i) in masteryTopics" :key="i">
            <div class="mb-1 flex justify-between text-sm">
              <span>{{ t.titre }}</span>
              <span class="text-slate-500">{{ t.percent }}%</span>
            </div>
            <div class="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                class="h-full rounded-full bg-gradient-to-r"
                :class="barClass(i)"
                :style="{ width: `${t.percent}%` }"
              />
            </div>
          </li>
        </ul>
        <p v-else class="text-sm text-slate-400">Pas encore de détail de compétences.</p>
      </div>

      <div class="glass-card p-5">
        <div class="mb-4 flex items-center gap-3">
          <CalendarDays class="h-5 w-5 text-blue-600" />
          <h2 class="font-display text-lg font-semibold">Révisions programmées</h2>
        </div>
        <ul v-if="revisions.length" class="space-y-3">
          <li
            v-for="r in revisions"
            :key="r.id"
            class="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5"
          >
            <div class="min-w-0 flex-1">
              <p class="text-xs font-medium" :class="revisionTone(r).label">
                {{ dueLabelOf(r) }}
              </p>
              <p class="truncate text-sm">
                {{ r.titre || 'Révision' }}
                <span v-if="r.matiere" class="text-slate-400">({{ r.matiere }})</span>
              </p>
            </div>
            <span class="rounded-md px-2 py-0.5 text-xs font-bold" :class="revisionTone(r).badge">
              {{ r.count ?? 1 }}
            </span>
          </li>
        </ul>
        <p v-else class="text-sm text-slate-400">Aucune révision programmée.</p>
      </div>
    </div>

    <!-- Historique tentatives -->
    <section class="glass-card mb-6 p-5">
      <h2 class="mb-4 font-display text-lg font-semibold">Historique des tentatives</h2>
      <div v-if="!filteredAttempts.length" class="text-sm text-slate-400">
        Aucune tentative pour le moment. Complète un exercice pour voir l’analyse ici.
      </div>
      <ul v-else class="divide-y divide-slate-100">
        <li
          v-for="a in filteredAttempts"
          :key="a.id"
          class="flex flex-wrap items-start justify-between gap-3 py-3"
        >
          <div class="min-w-0 flex-1">
            <p class="font-medium text-slate-900">
              {{ a.matiere || 'Exercice' }}
              <span class="text-slate-400">·</span>
              score {{ a.score ?? '—' }}%
            </p>
            <p v-if="a.analyse" class="mt-1 line-clamp-2 text-sm text-slate-500">{{ a.analyse }}</p>
            <div v-if="a.lacunes?.length" class="mt-2 flex flex-wrap gap-1">
              <span
                v-for="(l, i) in a.lacunes"
                :key="i"
                class="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800"
              >
                {{ l }}
              </span>
            </div>
          </div>
          <RouterLink
            v-if="a.exerciseId"
            :to="`/student/exercices/${a.exerciseId}`"
            class="text-xs font-semibold text-blue-600 hover:underline"
          >
            Revoir →
          </RouterLink>
        </li>
      </ul>
    </section>

    <div class="glass-card p-5">
      <div class="mb-4 flex items-center gap-2">
        <AlertTriangle class="h-5 w-5 text-amber-400" />
        <h2 class="font-display text-lg font-semibold">Lacunes & erreurs fréquentes</h2>
      </div>
      <ul v-if="filteredErrors.length" class="divide-y divide-slate-100">
        <li
          v-for="e in filteredErrors"
          :key="e.id"
          class="flex items-center gap-3 py-3"
        >
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
            :class="errorIconClass(e)"
          >
            {{ errorGlyph(e) }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-medium">{{ e.titre || 'Erreur' }}</p>
            <p class="text-xs text-slate-400">
              {{ e.matiere || '—' }}
              <span v-if="e.notion || e.competence"> · {{ e.notion || e.competence }}</span>
            </p>
          </div>
        </li>
      </ul>
      <p v-else class="text-sm text-slate-400">Aucune lacune détectée pour ce filtre.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore'
import { CalendarDays, AlertTriangle } from 'lucide-vue-next'
import type {
  Attempt,
  FrequentError,
  ProgressRecord,
  ProgressTopic,
  Revision,
} from '@/types/models'
import StudentPageHeader from '@/components/StudentPageHeader.vue'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const progress = ref<ProgressRecord[]>([])
const revisions = ref<Revision[]>([])
const errors = ref<FrequentError[]>([])
const attempts = ref<Attempt[]>([])
const matiereFilter = ref('')

const matieres = computed(() => {
  const set = new Set<string>()
  progress.value.forEach((p) => p.matiere && set.add(p.matiere))
  attempts.value.forEach((a) => a.matiere && set.add(a.matiere))
  return [...set].sort()
})

const progressSorted = computed(() =>
  [...progress.value].sort(
    (a, b) => Number(b.percent ?? b.maitrise ?? 0) - Number(a.percent ?? a.maitrise ?? 0),
  ),
)

const filteredProgress = computed(() => {
  if (!matiereFilter.value) return progress.value
  return progress.value.filter((p) => p.matiere === matiereFilter.value)
})

const globalAvg = computed(() => {
  if (!progress.value.length) return 0
  const sum = progress.value.reduce((acc, p) => acc + Number(p.percent ?? p.maitrise ?? 0), 0)
  return Math.round(sum / progress.value.length)
})

const deltaGlobal = computed(() => {
  if (!progress.value.length) return 0
  const prev =
    progress.value.reduce((acc, p) => acc + Number(p.previousPercent ?? p.percent ?? 0), 0) /
    progress.value.length
  return Math.round(globalAvg.value - prev)
})

const masteryTitle = computed(() => {
  if (matiereFilter.value) return matiereFilter.value
  return filteredProgress.value[0]?.matiere || 'Compétences'
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
  return topics
})

const filteredAttempts = computed(() => {
  const list = matiereFilter.value
    ? attempts.value.filter((a) => a.matiere === matiereFilter.value)
    : attempts.value
  return list.slice(0, 25)
})

const filteredErrors = computed(() => {
  if (!matiereFilter.value) return errors.value
  return errors.value.filter((e) => e.matiere === matiereFilter.value)
})

function barClass(i: number) {
  const bars = [
    'from-blue-500 to-cyan-400',
    'from-violet-600 to-indigo-500',
    'from-emerald-500 to-teal-400',
    'from-amber-500 to-orange-400',
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
    return { label: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' }
  if (days === 1)
    return { label: 'text-orange-600', badge: 'bg-orange-100 text-orange-600' }
  return { label: 'text-blue-600', badge: 'bg-blue-100 text-blue-600' }
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
  if (m.includes('math')) return 'bg-rose-100 text-rose-700'
  if (m.includes('fran')) return 'bg-blue-100 text-blue-700'
  return 'bg-violet-100 text-violet-700'
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
    const eq = query(collection(db, 'frequent_errors'), where('eleveId', '==', uid), limit(40))
    const eSnap = await getDocs(eq)
    errors.value = eSnap.docs.map((d) => ({ id: d.id, ...d.data() } as FrequentError))
  } catch {
    errors.value = []
  }

  try {
    const aq = query(
      collection(db, 'attempts'),
      where('eleveId', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(40),
    )
    const aSnap = await getDocs(aq)
    attempts.value = aSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Attempt))
  } catch {
    try {
      const aq = query(collection(db, 'attempts'), where('eleveId', '==', uid), limit(40))
      const aSnap = await getDocs(aq)
      attempts.value = aSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Attempt))
    } catch {
      attempts.value = []
    }
  }
})
</script>
