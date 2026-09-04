<template>
  <div>
    <header class="mb-6">
      <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-violet-300">
        PROFESSEUR
      </p>
      <h1 class="page-title">Programme & Planification</h1>
      <p class="page-sub">
        Programme officiel par pays, niveau et matière, et planification des séances.
      </p>
    </header>

    <div class="glass-card mb-6 p-5">
      <h2 class="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
        <Filter class="h-4 w-4 text-blue-300" />
        Filtres du programme
      </h2>
      <div class="grid gap-4 sm:grid-cols-3">
        <label class="block text-xs text-white/45">
          Pays
          <select v-model="pays" class="input-field mt-1 !pl-4">
            <option>TOGO</option>
            <option>BENIN</option>
            <option>COTE D'IVOIRE</option>
            <option>SENEGAL</option>
          </select>
        </label>
        <label class="block text-xs text-white/45">
          Niveau
          <select v-model="niveau" class="input-field mt-1 !pl-4">
            <option>Terminale D</option>
            <option>Terminale C</option>
            <option>Première D</option>
            <option>Seconde</option>
          </select>
        </label>
        <label class="block text-xs text-white/45">
          Matière
          <select v-model="matiere" class="input-field mt-1 !pl-4">
            <option>Mathématiques</option>
            <option>Physique-Chimie</option>
            <option>SVT</option>
            <option>Français</option>
          </select>
        </label>
      </div>
    </div>

    <div class="glass-card overflow-hidden">
      <div class="border-b border-white/5 px-5 py-4">
        <h2 class="flex items-center gap-2 font-display text-lg font-semibold">
          <BookOpen class="h-4 w-4 text-blue-300" />
          Chapitres du programme
        </h2>
      </div>
      <div v-if="loading" class="p-8 text-center text-white/40">Chargement…</div>
      <div v-else-if="!filtered.length" class="p-8 text-center text-white/40">
        Aucun chapitre pour ces filtres.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-white/5 text-xs uppercase tracking-wide text-white/40">
            <tr>
              <th class="px-5 py-3 font-medium">Chapitre</th>
              <th class="px-5 py-3 font-medium">Statut</th>
              <th class="px-5 py-3 font-medium">Contenus IA</th>
              <th class="px-5 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr v-for="ch in filtered" :key="ch.id" class="hover:bg-white/[0.02]">
              <td class="px-5 py-3 font-medium">{{ ch.titre }}</td>
              <td class="px-5 py-3">
                <span
                  class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  :class="statusBadge(ch.status)"
                >
                  {{ statusLabel(ch.status) }}
                </span>
              </td>
              <td class="px-5 py-3 text-white/70">
                <span v-if="ch.contenusIA === 'valides'" class="inline-flex items-center gap-1.5 text-emerald-300">
                  <CheckCircle2 class="h-3.5 w-3.5" />
                  Exercices IA validés
                </span>
                <span v-else class="inline-flex items-center gap-1.5 text-amber-300">
                  <Clock class="h-3.5 w-3.5" />
                  En attente de validation
                </span>
              </td>
              <td class="px-5 py-3">
                <RouterLink
                  to="/teacher/contenus"
                  class="inline-flex rounded-lg border border-blue-500/40 px-3 py-1.5 text-xs font-medium text-blue-300 transition hover:bg-blue-500/10"
                >
                  Ouvrir
                </RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { Unsubscribe } from 'firebase/firestore'
import type { ChapterStatus, ProgramChapter } from '@/types/models'
import { RouterLink } from 'vue-router'
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore'
import { BookOpen, CheckCircle2, Clock, Filter } from 'lucide-vue-next'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const pays = ref('TOGO')
const niveau = ref('Terminale D')
const matiere = ref('Mathématiques')
const chapters = ref<ProgramChapter[]>([])
const loading = ref(true)
let unsub: Unsubscribe | null = null

const filtered = computed(() =>
  chapters.value.filter((c) => {
    const okPays = !c.pays || c.pays.toUpperCase() === pays.value.toUpperCase()
    const okNiveau = !c.niveau || c.niveau === niveau.value
    const okMatiere = !c.matiere || c.matiere === matiere.value
    return okPays && okNiveau && okMatiere
  }),
)

function statusLabel(s?: ChapterStatus) {
  const map: Record<string, string> = {
    planifie: 'Planifié',
    en_cours: 'En cours',
    termine: 'Terminé',
    a_planifier: 'À planifier',
  }
  return map[s || ''] || s || '—'
}

function statusBadge(s?: ChapterStatus) {
  const map: Record<string, string> = {
    planifie: 'bg-blue-500/20 text-blue-300',
    en_cours: 'bg-amber-500/20 text-amber-300',
    termine: 'bg-emerald-500/20 text-emerald-300',
    a_planifier: 'bg-white/10 text-white/50',
  }
  return map[s || ''] || 'bg-white/10 text-white/50'
}

onMounted(async () => {
  const uid = auth.user?.uid
  if (!uid) {
    loading.value = false
    return
  }

  const qTeacher = query(collection(db, 'program_chapters'), where('enseignantId', '==', uid))
  unsub = onSnapshot(
    qTeacher,
    (snap) => {
      if (snap.size) {
        chapters.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ProgramChapter))
        loading.value = false
        return
      }
      // fallback: by matiere
      getDocs(query(collection(db, 'program_chapters'), where('matiere', '==', matiere.value))).then(
        (s) => {
          chapters.value = s.docs.map((d) => ({ id: d.id, ...d.data() } as ProgramChapter))
          loading.value = false
        },
      )
    },
    () => {
      getDocs(collection(db, 'program_chapters')).then((s) => {
        chapters.value = s.docs.map((d) => ({ id: d.id, ...d.data() } as ProgramChapter))
        loading.value = false
      })
    },
  )
})

onUnmounted(() => unsub?.())
</script>
