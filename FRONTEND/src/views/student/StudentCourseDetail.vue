<template>
  <div>
    <button
      type="button"
      class="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
      @click="$router.push('/student/cours')"
    >
      <ArrowLeft class="h-4 w-4" /> Mes cours
    </button>

    <div v-if="loading" class="py-16 text-center text-slate-400">Chargement…</div>
    <div v-else-if="!course" class="glass-card py-12 text-center text-slate-400">
      Cours introuvable.
    </div>
    <template v-else>
      <header class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-blue-600">
            {{ course.matiere }}
          </p>
          <h1 class="page-title">{{ course.titre }}</h1>
          <p v-if="course.description" class="page-sub max-w-2xl">{{ course.description }}</p>
          <p class="mt-2 text-xs text-slate-500">
            Enseignant
            <span class="font-medium text-slate-700">{{ course.enseignantNom || '—' }}</span>
          </p>
        </div>
        <button type="button" class="btn-secondary text-sm" @click="showTicket = true">
          Je ne comprends pas
        </button>
      </header>

      <div class="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-xl px-4 py-2 text-sm font-semibold transition"
          :class="
            tab === 'lire'
              ? 'bg-blue-600 text-white'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          "
          @click="tab = 'lire'"
        >
          Lire le cours
        </button>
        <button
          type="button"
          class="rounded-xl px-4 py-2 text-sm font-semibold transition"
          :class="
            tab === 'ressources'
              ? 'bg-blue-600 text-white'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          "
          @click="tab = 'ressources'"
        >
          Ressources ({{ resources.length }})
        </button>
        <button
          type="button"
          class="rounded-xl px-4 py-2 text-sm font-semibold transition"
          :class="
            tab === 'exercices'
              ? 'bg-blue-600 text-white'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          "
          @click="tab = 'exercices'"
        >
          Exercices ({{ exercises.length }})
        </button>
      </div>

      <section v-if="tab === 'lire'" class="glass-card p-6">
        <h2 class="mb-4 font-display text-lg font-semibold">Contenu du cours</h2>
        <div
          v-if="course.contenuTexte?.trim()"
          class="prose-edu whitespace-pre-wrap text-sm leading-relaxed text-slate-700"
        >
          {{ course.contenuTexte }}
        </div>
        <div v-else class="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
          <BookOpen class="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p class="text-sm text-slate-500">
            Le professeur n’a pas encore rédigé le texte de ce cours.
          </p>
          <p v-if="resources.length" class="mt-2 text-xs text-slate-400">
            Consulte les ressources jointes en attendant.
          </p>
          <button
            v-if="resources.length"
            type="button"
            class="mt-4 text-sm font-semibold text-blue-600 hover:underline"
            @click="tab = 'ressources'"
          >
            Voir les ressources →
          </button>
        </div>

        <!-- Aperçu PDF si première ressource PDF -->
        <div v-if="pdfPreviewUrl" class="mt-6">
          <h3 class="mb-2 text-sm font-semibold text-slate-800">Aperçu PDF</h3>
          <iframe
            :src="pdfPreviewUrl"
            class="h-[min(70vh,720px)] w-full rounded-xl border border-slate-200 bg-white"
            title="Aperçu du cours PDF"
          />
        </div>
      </section>

      <section v-else-if="tab === 'ressources'" class="glass-card p-5">
        <h2 class="mb-3 font-display text-lg font-semibold">Ressources</h2>
        <ul v-if="resources.length" class="space-y-2">
          <li v-for="(r, i) in resources" :key="r.id || r.url + i">
            <a
              :href="r.url"
              target="_blank"
              rel="noopener"
              class="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm transition hover:border-blue-200 hover:bg-blue-50/50"
            >
              <FileText class="h-5 w-5 shrink-0 text-blue-600" />
              <span class="min-w-0 flex-1 truncate font-medium text-slate-800">
                {{ r.titre || r.name || 'Ressource' }}
              </span>
              <ExternalLink class="h-4 w-4 shrink-0 text-slate-400" />
            </a>
          </li>
        </ul>
        <p v-else class="text-sm text-slate-400">Aucune ressource pour ce cours.</p>
      </section>

      <section v-else class="glass-card p-5">
        <h2 class="mb-3 font-display text-lg font-semibold">Exercices liés</h2>
        <ul v-if="exercises.length" class="divide-y divide-slate-100">
          <li
            v-for="ex in exercises"
            :key="ex.id"
            class="flex items-center justify-between py-3"
          >
            <span>{{ ex.titre }}</span>
            <RouterLink :to="`/student/exercices/${ex.id}`" class="text-sm text-blue-600">
              Ouvrir →
            </RouterLink>
          </li>
        </ul>
        <p v-else class="text-sm text-slate-400">Aucun exercice.</p>
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
          class="mt-3 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none"
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
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { Unsubscribe } from 'firebase/firestore'
import type { Course, Exercise, ResourceItem } from '@/types/models'
import { useRoute, RouterLink } from 'vue-router'
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  addDoc,
} from 'firebase/firestore'
import { ArrowLeft, BookOpen, ExternalLink, FileText } from 'lucide-vue-next'
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
const tab = ref<'lire' | 'ressources' | 'exercices'>('lire')
let unsub: Unsubscribe | null = null

const resources = computed((): ResourceItem[] => {
  return course.value?.ressources || course.value?.resources || []
})

const pdfPreviewUrl = computed(() => {
  const pdf = resources.value.find((r) => {
    const t = (r.fileType || r.titre || r.name || r.url || '').toLowerCase()
    return t.includes('pdf')
  })
  return pdf?.url || ''
})

onMounted(async () => {
  const id = String(route.params.id)
  unsub = onSnapshot(
    doc(db, 'courses', id),
    async (snap) => {
      course.value = snap.exists() ? ({ id: snap.id, ...snap.data() } as Course) : null
      loading.value = false
      if (course.value && !exercises.value.length) {
        const eq = query(collection(db, 'exercises'), where('courseId', '==', course.value.id))
        const eSnap = await getDocs(eq)
        exercises.value = eSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Exercise))
      }
      if (course.value && !course.value.contenuTexte?.trim() && resources.value.length) {
        tab.value = 'ressources'
      }
    },
    () => {
      loading.value = false
    },
  )
})

onUnmounted(() => unsub?.())

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
