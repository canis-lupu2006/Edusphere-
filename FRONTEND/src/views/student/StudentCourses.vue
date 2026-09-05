<template>
  <div>
    <StudentPageHeader
      title="Mes cours"
      subtitle="Retrouve tes cours et continue ton apprentissage"
    />

    <div class="mb-6 flex flex-wrap gap-3">
      <div class="relative min-w-[240px] flex-1">
        <Search class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          v-model="search"
          type="search"
          class="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/15"
          placeholder="Rechercher un cours ou une matière..."
        />
      </div>
      <select
        v-model="matiereFilter"
        class="min-w-[180px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/15"
      >
        <option value="">Toutes les matières</option>
        <option v-for="m in matieres" :key="m" :value="m">{{ m }}</option>
      </select>
    </div>

    <div v-if="loading" class="py-12 text-center text-slate-400">Chargement des cours…</div>
    <div v-else-if="!filtered.length" class="glass-card py-12 text-center text-slate-400">
      Aucun cours trouvé.
    </div>
    <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="course in filtered"
        :key="course.id"
        class="glass-card flex flex-col rounded-2xl p-5 transition hover:border-slate-300 hover:shadow-md"
      >
        <div
          class="mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-base font-bold"
          :class="themeOf(course).bg + ' ' + themeOf(course).text"
        >
          {{ themeOf(course).glyph }}
        </div>
        <h3 class="font-display text-lg font-semibold text-slate-900">
          {{ course.titre || course.matiere || 'Cours' }}
        </h3>
        <span
          class="mt-2 inline-flex w-fit rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
          :class="themeOf(course).badge"
        >
          {{ String(chapterCount(course)).padStart(2, '0') }} chapitres
        </span>
        <p class="mt-3 text-xs text-slate-500">
          Enseignant
          <span class="ml-1 font-medium text-slate-700">{{ course.enseignantNom || '—' }}</span>
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
import { Search } from 'lucide-vue-next'
import type { Course } from '@/types/models'
import StudentPageHeader from '@/components/StudentPageHeader.vue'
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
