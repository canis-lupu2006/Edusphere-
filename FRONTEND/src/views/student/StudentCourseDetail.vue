<template>
  <div>
    <button
      type="button"
      class="mb-4 inline-flex items-center gap-2 text-sm text-white/50 hover:text-white"
      @click="$router.push('/student/cours')"
    >
      <ArrowLeft class="h-4 w-4" /> Mes cours
    </button>

    <div v-if="loading" class="py-16 text-center text-white/40">Chargement…</div>
    <div v-else-if="!course" class="glass-card py-12 text-center text-white/40">
      Cours introuvable.
    </div>
    <template v-else>
      <header class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-xs text-blue-400">{{ course.matiere }}</p>
          <h1 class="page-title">{{ course.titre }}</h1>
          <p v-if="course.description" class="page-sub max-w-2xl">{{ course.description }}</p>
        </div>
        <button type="button" class="btn-secondary text-sm" @click="showTicket = true">
          Je ne comprends pas
        </button>
      </header>

      <section class="glass-card mb-6 p-5">
        <h2 class="mb-3 font-display text-lg font-semibold">Ressources</h2>
        <ul v-if="resources.length" class="space-y-2">
          <li v-for="(r, i) in resources" :key="i">
            <a
              :href="r.url"
              target="_blank"
              rel="noopener"
              class="flex items-center gap-2 text-sm text-blue-300 hover:underline"
            >
              <FileText class="h-4 w-4" />
              {{ r.titre || r.name || r.url }}
            </a>
          </li>
        </ul>
        <p v-else class="text-sm text-white/40">Aucune ressource pour ce cours.</p>
      </section>

      <section class="glass-card p-5">
        <h2 class="mb-3 font-display text-lg font-semibold">Exercices liés</h2>
        <ul v-if="exercises.length" class="divide-y divide-white/5">
          <li
            v-for="ex in exercises"
            :key="ex.id"
            class="flex items-center justify-between py-3"
          >
            <span>{{ ex.titre }}</span>
            <RouterLink :to="`/student/exercices/${ex.id}`" class="text-sm text-blue-400">
              Ouvrir →
            </RouterLink>
          </li>
        </ul>
        <p v-else class="text-sm text-white/40">Aucun exercice.</p>
      </section>
    </template>

    <div
      v-if="showTicket"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      @click.self="showTicket = false"
    >
      <div class="glass-card w-full max-w-md p-6">
        <h3 class="font-display text-lg font-semibold">Je ne comprends pas</h3>
        <textarea
          v-model="ticketMsg"
          rows="4"
          class="mt-3 w-full rounded-xl border border-white/10 bg-[#0d1424] p-3 text-sm outline-none"
          placeholder="Explique ta difficulté…"
        />
        <div class="mt-4 flex justify-end gap-2">
          <button type="button" class="btn-secondary text-sm" @click="showTicket = false">Annuler</button>
          <button type="button" class="btn-primary text-sm" @click="sendTicket">Envoyer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Course, Exercise, ResourceItem } from '@/types/models'
import { useRoute, RouterLink } from 'vue-router'
import { doc, getDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore'
import { ArrowLeft, FileText } from 'lucide-vue-next'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { nowTimestamp } from '@/utils/scoring'

const route = useRoute()
const auth = useAuthStore()
const loading = ref(true)
const course = ref<Course | null>(null)
const exercises = ref<Exercise[]>([])
const showTicket = ref(false)
const ticketMsg = ref('')

const resources = computed(() => course.value?.ressources || course.value?.resources || [])

onMounted(async () => {
  try {
    const snap = await getDoc(doc(db, 'courses', String(route.params.id)))
    course.value = snap.exists() ? ({ id: snap.id, ...snap.data() } as Course) : null
    if (course.value) {
      const eq = query(collection(db, 'exercises'), where('courseId', '==', course.value.id))
      const eSnap = await getDocs(eq)
      exercises.value = eSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Exercise))
    }
  } finally {
    loading.value = false
  }
})

async function sendTicket() {
  if (!ticketMsg.value.trim() || !course.value) return
  await addDoc(collection(db, 'tickets'), {
    eleveId: auth.user!.uid,
    eleveNom: auth.displayName,
    classeId: auth.profile?.classeId || course.value.classeId || null,
    courseId: course.value.id,
    message: ticketMsg.value.trim(),
    status: 'ouvert',
    createdAt: nowTimestamp(),
  })
  showTicket.value = false
  ticketMsg.value = ''
  alert('Ticket créé.')
}
</script>
