<template>
  <div>
    <header class="mb-6">
      <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#166534]/70">
        Ministère
      </p>
      <h1 class="font-display text-2xl font-semibold text-emerald-950">Programmes officiels</h1>
      <p class="mt-1 text-sm text-emerald-900/55">
        Chapitres du programme (collection program_chapters)
      </p>
    </header>

    <div class="mb-5 flex flex-wrap gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <label class="text-sm">
        <span class="mb-1 block text-xs text-emerald-900/50">Pays</span>
        <select
          v-model="filters.pays"
          class="rounded-xl border border-emerald-900/10 bg-[#f4f7f5] px-3 py-2 text-sm outline-none"
        >
          <option value="">Tous</option>
          <option v-for="p in paysOptions" :key="p" :value="p">{{ p }}</option>
        </select>
      </label>
      <label class="text-sm">
        <span class="mb-1 block text-xs text-emerald-900/50">Niveau</span>
        <select
          v-model="filters.niveau"
          class="rounded-xl border border-emerald-900/10 bg-[#f4f7f5] px-3 py-2 text-sm outline-none"
        >
          <option value="">Tous</option>
          <option v-for="n in niveauOptions" :key="n" :value="n">{{ n }}</option>
        </select>
      </label>
      <label class="text-sm">
        <span class="mb-1 block text-xs text-emerald-900/50">Matière</span>
        <select
          v-model="filters.matiere"
          class="rounded-xl border border-emerald-900/10 bg-[#f4f7f5] px-3 py-2 text-sm outline-none"
        >
          <option value="">Toutes</option>
          <option v-for="m in matiereOptions" :key="m" :value="m">{{ m }}</option>
        </select>
      </label>
    </div>

    <div v-if="loading" class="py-12 text-center text-emerald-900/40">Chargement…</div>
    <div
      v-else-if="!filtered.length"
      class="rounded-2xl bg-white p-10 text-center text-emerald-900/45 shadow-sm"
    >
      Aucun chapitre.
    </div>
    <div v-else class="overflow-hidden rounded-2xl bg-white shadow-sm">
      <table class="w-full min-w-[40rem] text-left text-sm">
        <thead class="bg-emerald-50/80 text-xs uppercase text-emerald-900/45">
          <tr>
            <th class="px-4 py-3 font-medium">Chapitre</th>
            <th class="px-4 py-3 font-medium">Pays</th>
            <th class="px-4 py-3 font-medium">Niveau</th>
            <th class="px-4 py-3 font-medium">Matière</th>
            <th class="px-4 py-3 font-medium">Statut</th>
            <th class="px-4 py-3 font-medium">Contenus IA</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="c in filtered"
            :key="c.id"
            class="border-t border-emerald-900/5 hover:bg-emerald-50/40"
          >
            <td class="px-4 py-3 font-medium text-emerald-950">{{ c.titre || '—' }}</td>
            <td class="px-4 py-3">{{ c.pays || '—' }}</td>
            <td class="px-4 py-3">{{ c.niveau || '—' }}</td>
            <td class="px-4 py-3">{{ c.matiere || '—' }}</td>
            <td class="px-4 py-3">
              <span
                class="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
                :class="statusClass(c.status)"
              >
                {{ c.status || '—' }}
              </span>
            </td>
            <td class="px-4 py-3 text-emerald-900/65">{{ c.contenusIA || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'
import type { ProgramChapter } from '@/types/models'

const loading = ref(true)
const chapters = ref<ProgramChapter[]>([])
const filters = reactive({ pays: '', niveau: '', matiere: '' })

const paysOptions = computed(() =>
  [...new Set(chapters.value.map((c) => c.pays).filter(Boolean) as string[])].sort(),
)
const niveauOptions = computed(() =>
  [...new Set(chapters.value.map((c) => c.niveau).filter(Boolean) as string[])].sort(),
)
const matiereOptions = computed(() =>
  [...new Set(chapters.value.map((c) => c.matiere).filter(Boolean) as string[])].sort(),
)

const filtered = computed(() =>
  chapters.value.filter((c) => {
    if (filters.pays && c.pays !== filters.pays) return false
    if (filters.niveau && c.niveau !== filters.niveau) return false
    if (filters.matiere && c.matiere !== filters.matiere) return false
    return true
  }),
)

function statusClass(status?: string) {
  if (status === 'termine') return 'bg-emerald-100 text-[#166534]'
  if (status === 'en_cours') return 'bg-sky-100 text-sky-800'
  if (status === 'planifie') return 'bg-amber-100 text-amber-800'
  return 'bg-slate-100 text-slate-700'
}

onMounted(async () => {
  try {
    const snap = await getDocs(collection(db, 'program_chapters'))
    chapters.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ProgramChapter))
  } finally {
    loading.value = false
  }
})
</script>
