<template>
  <div>
    <header class="mb-6 flex items-start justify-between gap-4">
      <div>
        <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-blue-400">
          ESPACE ÉLÈVE
        </p>
        <h1 class="page-title">Mes cours</h1>
        <p class="page-sub">Retrouve tes cours et continue ton apprentissage</p>
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

    <div class="mb-6 flex flex-wrap gap-3">
      <div class="relative min-w-[240px] flex-1">
        <Search class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
        <input
          v-model="search"
          type="search"
          class="input-field"
          placeholder="Rechercher un cours ou une matière..."
        />
      </div>
      <select v-model="matiereFilter" class="input-field !w-auto !pl-4 min-w-[180px]">
        <option value="">Toutes les matières</option>
        <option v-for="m in matieres" :key="m" :value="m">{{ m }}</option>
      </select>
    </div>

    <div v-if="loading" class="py-12 text-center text-white/40">Chargement des cours…</div>
    <div v-else-if="!filtered.length" class="glass-card py-12 text-center text-white/40">
      Aucun cours trouvé.
    </div>
    <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="course in filtered"
        :key="course.id"
        class="glass-card flex flex-col rounded-2xl p-5 transition hover:border-white/20"
      >
        <div
          class="mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-base font-bold"
          :class="themeOf(course).bg + ' ' + themeOf(course).text"
        >
          {{ themeOf(course).glyph }}
        </div>
        <h3 class="font-display text-lg font-semibold">
          {{ course.titre || course.matiere || 'Cours' }}
        </h3>
        <span
          class="mt-2 inline-flex w-fit rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
          :class="themeOf(course).badge"
        >
          {{ String(chapterCount(course)).padStart(2, '0') }} chapitres
        </span>
        <p class="mt-3 text-xs text-white/45">
          Enseignant
          <span class="ml-1 text-white/70">{{ course.enseignantNom || '—' }}</span>
        </p>
        <div class="mt-auto pt-5">
          <RouterLink
            :to="`/student/cours/${course.id}`"
            class="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition"
            :class="themeOf(course).btn"
          >
            Ouvrir le cours →
          </RouterLink>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { Unsubscribe } from 'firebase/firestore'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { Bell, Search } from 'lucide-vue-next'
import type { Course } from '@/types/models'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { subjectTheme } from '@/utils/subjectTheme'

const auth = useAuthStore()
const courses = ref<Course[]>([])
const loading = ref(true)
const search = ref('')
const matiereFilter = ref('')
let unsub: Unsubscribe | null = null

const matieres = computed(() =>
  [...new Set(courses.value.map((c) => c.matiere).filter(Boolean) as string[])].sort(),
)

function themeOf(course: Course) {
  return subjectTheme(course.matiere || course.titre)
}

function chapterCount(course: Course) {
  if (typeof course.chapitres === 'number') return course.chapitres
  if (Array.isArray(course.chapitres)) return course.chapitres.length
  const res = course.ressources || course.resources || []
  return Array.isArray(res) ? res.length : 0
}

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return courses.value.filter((c) => {
    if (matiereFilter.value && c.matiere !== matiereFilter.value) return false
    if (!q) return true
    return (
      (c.titre || '').toLowerCase().includes(q) ||
      (c.matiere || '').toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q)
    )
  })
})

onMounted(() => {
  const classeId = auth.profile?.classeId
  if (!classeId) {
    loading.value = false
    return
  }
  const q = query(collection(db, 'courses'), where('classeId', '==', classeId))
  unsub = onSnapshot(
    q,
    (snap) => {
      courses.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Course))
      loading.value = false
    },
    () => {
      loading.value = false
    },
  )
})

onUnmounted(() => unsub?.())
</script>
