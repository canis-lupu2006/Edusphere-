<template>
  <div>
    <header class="mb-6">
      <p class="text-xs font-semibold uppercase tracking-wide text-blue-400">Espace élève</p>
      <h1 class="page-title">Mes cours</h1>
      <p class="page-sub">Retrouve tes cours et continue ton apprentissage.</p>
    </header>

    <div class="mb-6">
      <input
        v-model="search"
        type="search"
        class="input-field max-w-md !pl-4"
        placeholder="Rechercher un cours ou une matière…"
      />
    </div>

    <CourseList :courses="courses" :loading="loading" :search="search" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import type { Unsubscribe } from 'firebase/firestore'
import type { Course } from '@/types/models'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import CourseList from '@/components/CourseList.vue'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const courses = ref<Course[]>([])
const loading = ref(true)
const search = ref('')
let unsub: Unsubscribe | null = null

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
    }
  )
})

onUnmounted(() => unsub?.())
</script>
