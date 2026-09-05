<template>
  <div>
    <header class="mb-6">
      <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#166534]/70">
        Ministère
      </p>
      <h1 class="font-display text-2xl font-semibold text-emerald-950">
        Indicateurs par établissement
      </h1>
      <p class="mt-1 text-sm text-emerald-900/55">Comparaison nationale filtrable</p>
    </header>

    <div class="mb-5 flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <label class="text-sm">
        <span class="mb-1 block text-xs text-emerald-900/50">Région</span>
        <select
          v-model="filters.region"
          class="rounded-xl border border-emerald-900/10 bg-[#f4f7f5] px-3 py-2 text-sm outline-none focus:border-[#166534]/40"
        >
          <option value="">Toutes</option>
          <option v-for="r in regionOptions" :key="r" :value="r">{{ r }}</option>
        </select>
      </label>
      <label class="text-sm">
        <span class="mb-1 block text-xs text-emerald-900/50">Type</span>
        <select
          v-model="filters.type"
          class="rounded-xl border border-emerald-900/10 bg-[#f4f7f5] px-3 py-2 text-sm outline-none focus:border-[#166534]/40"
        >
          <option value="">Tous</option>
          <option v-for="t in typeOptions" :key="t" :value="t">{{ t }}</option>
        </select>
      </label>
      <button
        type="button"
        class="rounded-xl border border-emerald-900/15 px-4 py-2 text-sm text-emerald-900/70 hover:bg-emerald-50"
        @click="resetFilters"
      >
        Réinitialiser
      </button>
    </div>

    <div class="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div class="rounded-2xl bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-emerald-900/45">Établissements suivis</p>
        <p class="mt-1 font-display text-2xl font-bold text-[#166534]">{{ filtered.length }}</p>
      </div>
      <div class="rounded-2xl bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-emerald-900/45">Maîtrise moyenne</p>
        <p class="mt-1 font-display text-2xl font-bold text-[#166534]">{{ avgMaitrise }}%</p>
      </div>
      <div class="rounded-2xl bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-emerald-900/45">Élèves couverts</p>
        <p class="mt-1 font-display text-2xl font-bold text-[#166534]">
          {{ totalEleves.toLocaleString('fr-FR') }}
        </p>
      </div>
      <div class="rounded-2xl bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-emerald-900/45">À surveiller (&lt;50%)</p>
        <p class="mt-1 font-display text-2xl font-bold text-red-700">{{ atRisk }}</p>
      </div>
    </div>

    <section class="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div class="border-b border-emerald-900/10 px-5 py-4">
        <h2 class="font-display text-lg font-semibold text-emerald-950">
          Comparaison des établissements
        </h2>
      </div>
      <div v-if="loading" class="p-8 text-center text-sm text-emerald-900/40">Chargement…</div>
      <div v-else-if="!filtered.length" class="p-8 text-center text-sm text-emerald-900/40">
        Aucun établissement pour ces filtres.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[48rem] text-left text-sm">
          <thead class="bg-emerald-50/70 text-xs uppercase text-emerald-900/45">
            <tr>
              <th class="px-4 py-3 font-medium">#</th>
              <th class="px-4 py-3 font-medium">Établissement</th>
              <th class="px-4 py-3 font-medium">Région</th>
              <th class="px-4 py-3 font-medium">Type</th>
              <th class="px-4 py-3 font-medium">Élèves</th>
              <th class="px-4 py-3 font-medium">Maîtrise</th>
              <th class="px-4 py-3 font-medium">Hors-ligne</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(s, i) in filtered"
              :key="s.id"
              class="border-t border-emerald-900/5 hover:bg-emerald-50/30"
            >
              <td class="px-4 py-3 tabular-nums text-emerald-900/50">{{ i + 1 }}</td>
              <td class="px-4 py-3 font-medium text-emerald-950">{{ s.nom || s.name }}</td>
              <td class="px-4 py-3">{{ s.region || '—' }}</td>
              <td class="px-4 py-3">{{ s.type || s.niveau || '—' }}</td>
              <td class="px-4 py-3 tabular-nums">{{ s.elevesCount ?? '—' }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <div class="h-1.5 w-16 overflow-hidden rounded-full bg-emerald-100">
                    <div
                      class="h-full rounded-full"
                      :class="(s.maitrise ?? 0) >= 50 ? 'bg-[#166534]' : 'bg-red-500'"
                      :style="{ width: `${Math.min(100, s.maitrise ?? 0)}%` }"
                    />
                  </div>
                  <span class="font-semibold tabular-nums">{{ s.maitrise ?? 0 }}%</span>
                </div>
              </td>
              <td class="px-4 py-3 tabular-nums text-emerald-900/65">
                {{ s.usageHorsLigne ?? '—' }}{{ s.usageHorsLigne != null ? '%' : '' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'
import type { School } from '@/types/models'

const loading = ref(true)
const schools = ref<School[]>([])
const filters = reactive({ region: '', type: '' })

const regionOptions = computed(() =>
  [...new Set(schools.value.map((s) => s.region).filter(Boolean) as string[])].sort(),
)
const typeOptions = computed(() =>
  [...new Set(schools.value.map((s) => s.type || s.niveau).filter(Boolean) as string[])].sort(),
)

const filtered = computed(() => {
  return schools.value
    .filter((s) => {
      if (filters.region && s.region !== filters.region) return false
      if (filters.type && (s.type || s.niveau) !== filters.type) return false
      return true
    })
    .sort((a, b) => (b.maitrise ?? 0) - (a.maitrise ?? 0))
})

const avgMaitrise = computed(() => {
  const vals = filtered.value.map((s) => s.maitrise ?? 0)
  if (!vals.length) return 0
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
})

const totalEleves = computed(() =>
  filtered.value.reduce((a, s) => a + (s.elevesCount ?? 0), 0),
)

const atRisk = computed(() => filtered.value.filter((s) => (s.maitrise ?? 0) < 50).length)

function resetFilters() {
  filters.region = ''
  filters.type = ''
}

onMounted(async () => {
  try {
    const snap = await getDocs(collection(db, 'ecoles'))
    schools.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as School))
  } finally {
    loading.value = false
  }
})
</script>
