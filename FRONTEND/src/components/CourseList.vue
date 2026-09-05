<template>
  <div>
    <div v-if="loading" class="py-12 text-center text-slate-400">Chargement des cours…</div>
    <div v-else-if="!filtered.length" class="glass-card py-12 text-center text-slate-400">
      Aucun cours trouvé.
    </div>
    <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="course in filtered"
        :key="course.id"
        class="glass-card flex flex-col p-5 transition hover:border-slate-200"
      >
        <div
          class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold"
          :style="{ background: accentOf(course).bg, color: accentOf(course).fg }"
        >
          {{ (course.matiere || course.titre || '?').slice(0, 1).toUpperCase() }}
        </div>
        <h3 class="font-display text-lg font-semibold">{{ course.titre || course.matiere }}</h3>
        <p class="mt-1 text-xs text-slate-500">
          {{ course.matiere }}
          <span v-if="course.enseignantNom"> · {{ course.enseignantNom }}</span>
        </p>
        <p v-if="course.description" class="mt-2 line-clamp-2 text-sm text-slate-500">
          {{ course.description }}
        </p>
        <div class="mt-auto pt-4">
          <RouterLink
            :to="linkTo(course)"
            class="btn-primary w-full text-sm"
            :style="{ backgroundImage: `linear-gradient(90deg, ${accentOf(course).from}, ${accentOf(course).to})` }"
          >
            Ouvrir le cours
            <ArrowRight class="h-4 w-4" />
          </RouterLink>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowRight } from 'lucide-vue-next'
import type { Course } from '@/types/models'

const props = withDefaults(
  defineProps<{
    courses?: Course[]
    loading?: boolean
    search?: string
    basePath?: string
  }>(),
  {
    courses: () => [],
    loading: false,
    search: '',
    basePath: '/student/cours',
  },
)

const palette = [
  { bg: 'rgba(59,130,246,0.2)', fg: '#93c5fd', from: '#2563eb', to: '#3b82f6' },
  { bg: 'rgba(139,92,246,0.2)', fg: '#c4b5fd', from: '#7c3aed', to: '#8b5cf6' },
  { bg: 'rgba(16,185,129,0.2)', fg: '#6ee7b7', from: '#059669', to: '#10b981' },
  { bg: 'rgba(245,158,11,0.2)', fg: '#fcd34d', from: '#d97706', to: '#f59e0b' },
  { bg: 'rgba(239,68,68,0.2)', fg: '#fca5a5', from: '#dc2626', to: '#ef4444' },
  { bg: 'rgba(20,184,166,0.2)', fg: '#5eead4', from: '#0d9488', to: '#14b8a6' },
]

function accentOf(course: Course) {
  const key = (course.matiere || course.titre || '').length
  return palette[key % palette.length]
}

function linkTo(course: Course) {
  return `${props.basePath}/${course.id}`
}

const filtered = computed(() => {
  const q = props.search.trim().toLowerCase()
  if (!q) return props.courses
  return props.courses.filter(
    (c) =>
      (c.titre || '').toLowerCase().includes(q) ||
      (c.matiere || '').toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q),
  )
})
</script>
