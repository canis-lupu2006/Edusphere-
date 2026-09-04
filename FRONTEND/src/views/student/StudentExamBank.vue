<template>
  <div>
    <header class="mb-6 flex items-start justify-between gap-4">
      <div>
        <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-blue-400">
          ESPACE ÉLÈVE
        </p>
        <h1 class="page-title">Banque d'épreuves</h1>
        <p class="page-sub">
          Épreuves collaboratives classées par pays, établissement, niveau, matière et chapitre.
        </p>
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

    <!-- Filtres -->
    <section class="glass-card mb-6 p-5">
      <div class="mb-4 flex items-center gap-3">
        <div class="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/15 text-blue-300">
          <Filter class="h-4 w-4" />
        </div>
        <h2 class="font-display text-base font-semibold">Filtres</h2>
      </div>
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label class="block">
          <span class="mb-1.5 block text-xs text-white/45">Pays</span>
          <select v-model="filters.pays" class="input-field !pl-4">
            <option value="">Tous</option>
            <option v-for="p in paysOptions" :key="p" :value="p">{{ p }}</option>
          </select>
        </label>
        <label class="block">
          <span class="mb-1.5 block text-xs text-white/45">Niveau</span>
          <select v-model="filters.niveau" class="input-field !pl-4">
            <option value="">Tous</option>
            <option v-for="n in niveauOptions" :key="n" :value="n">{{ n }}</option>
          </select>
        </label>
        <label class="block">
          <span class="mb-1.5 block text-xs text-white/45">Matière</span>
          <select v-model="filters.matiere" class="input-field !pl-4">
            <option value="">Toutes</option>
            <option v-for="m in matiereOptions" :key="m" :value="m">{{ m }}</option>
          </select>
        </label>
        <label class="block">
          <span class="mb-1.5 block text-xs text-white/45">Type d'épreuve</span>
          <select v-model="filters.type" class="input-field !pl-4">
            <option value="">Tous</option>
            <option v-for="t in typeOptions" :key="t" :value="t">{{ t }}</option>
          </select>
        </label>
      </div>
    </section>

    <!-- Résultats -->
    <section class="glass-card overflow-hidden">
      <div class="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div class="flex items-center gap-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/15 text-blue-300">
            <FileSearch class="h-4 w-4" />
          </div>
          <h2 class="font-display text-base font-semibold">Résultats</h2>
        </div>
        <span class="text-sm text-white/45">{{ filtered.length }} épreuves</span>
      </div>

      <div v-if="loading" class="py-12 text-center text-white/40">Chargement…</div>
      <div v-else-if="!filtered.length" class="py-12 text-center text-white/40">
        Aucune épreuve ne correspond aux filtres.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr class="border-b border-white/10 text-[10px] uppercase tracking-wider text-blue-300/70">
              <th class="px-5 py-3 font-semibold">Type</th>
              <th class="px-3 py-3 font-semibold">Matière</th>
              <th class="px-3 py-3 font-semibold">Niveau</th>
              <th class="px-3 py-3 font-semibold text-right">Télécharger</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="e in filtered"
              :key="e.id"
              class="border-b border-white/5 transition hover:bg-white/[0.03]"
            >
              <td class="px-5 py-3.5 font-medium">{{ e.type || 'Épreuve' }}</td>
              <td class="px-3 py-3.5 text-white/70">{{ e.matiere || '—' }}</td>
              <td class="px-3 py-3.5 text-white/55">{{ e.niveau || '—' }}</td>
              <td class="px-5 py-3.5 text-right">
                <button
                  type="button"
                  class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-500"
                  :disabled="!e.url"
                  :title="e.url ? 'Télécharger' : 'Lien indisponible'"
                  @click="download(e)"
                >
                  <Download class="h-4 w-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { Bell, Filter, FileSearch, Download } from 'lucide-vue-next'
import type { Epreuve } from '@/types/models'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const epreuves = ref<Epreuve[]>([])
const loading = ref(true)

const filters = ref({
  pays: 'Togo',
  niveau: auth.profile?.classeNom || '',
  matiere: '',
  type: 'Examen',
})

const paysOptions = computed(() =>
  unique(epreuves.value.map((e) => e.pays).filter(Boolean) as string[], ['Togo']),
)
const niveauOptions = computed(() =>
  unique(
    epreuves.value.map((e) => e.niveau).filter(Boolean) as string[],
    auth.profile?.classeNom ? [auth.profile.classeNom] : ['Terminale D'],
  ),
)
const matiereOptions = computed(() =>
  unique(epreuves.value.map((e) => e.matiere).filter(Boolean) as string[]),
)
const typeOptions = computed(() =>
  unique(epreuves.value.map((e) => e.type).filter(Boolean) as string[], ['Examen', 'Devoir']),
)

const filtered = computed(() => {
  return epreuves.value.filter((e) => {
    if (filters.value.pays && e.pays && e.pays !== filters.value.pays) return false
    if (filters.value.niveau && e.niveau && e.niveau !== filters.value.niveau) return false
    if (filters.value.matiere && e.matiere !== filters.value.matiere) return false
    if (filters.value.type && e.type && e.type !== filters.value.type) return false
    return true
  })
})

function unique(values: string[], extras: string[] = []) {
  return [...new Set([...extras, ...values])].sort()
}

function download(e: Epreuve) {
  if (!e.url) return
  window.open(e.url, '_blank', 'noopener,noreferrer')
}

onMounted(async () => {
  if (!filters.value.niveau && auth.profile?.classeNom) {
    filters.value.niveau = auth.profile.classeNom
  }
  try {
    const snap = await getDocs(collection(db, 'epreuves'))
    epreuves.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Epreuve))
  } catch {
    try {
      const q = query(collection(db, 'epreuves'), where('pays', '==', 'Togo'))
      const snap = await getDocs(q)
      epreuves.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Epreuve))
    } catch {
      epreuves.value = []
    }
  } finally {
    loading.value = false
  }
})
</script>
