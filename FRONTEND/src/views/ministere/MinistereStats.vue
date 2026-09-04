<template>
  <div>
    <header class="mb-6">
      <h1 class="font-display text-2xl font-semibold text-emerald-900">Statistiques nationales</h1>
      <p class="mt-1 text-sm text-emerald-900/50">Indicateurs agrégés EduSphere.</p>
    </header>

    <div class="grid gap-4 md:grid-cols-3">
      <div class="rounded-2xl bg-white p-5 shadow-sm">
        <p class="text-xs uppercase text-emerald-900/45">Tentatives totales</p>
        <p class="mt-2 font-display text-3xl font-bold text-emerald-900">{{ totalAttempts }}</p>
      </div>
      <div class="rounded-2xl bg-white p-5 shadow-sm">
        <p class="text-xs uppercase text-emerald-900/45">Score moyen</p>
        <p class="mt-2 font-display text-3xl font-bold text-emerald-900">{{ avgScore }}%</p>
      </div>
      <div class="rounded-2xl bg-white p-5 shadow-sm">
        <p class="text-xs uppercase text-emerald-900/45">Cours publiés</p>
        <p class="mt-2 font-display text-3xl font-bold text-emerald-900">{{ totalCourses }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'

const totalAttempts = ref(0)
const avgScore = ref(0)
const totalCourses = ref(0)

onMounted(async () => {
  const attempts = await getDocs(collection(db, 'attempts'))
  totalAttempts.value = attempts.size
  const scores = attempts.docs.map((d) => d.data().score || 0)
  avgScore.value = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0

  const courses = await getDocs(collection(db, 'courses'))
  totalCourses.value = courses.size
})
</script>
