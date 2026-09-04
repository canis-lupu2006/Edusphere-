<template>
  <div>
    <header class="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#166534]/70">
          Ministère
        </p>
        <h1 class="font-display text-2xl font-semibold text-emerald-950">Établissements</h1>
        <p class="mt-1 text-sm text-emerald-900/55">
          {{ filtered.length }} établissement(s) · données Firestore
        </p>
      </div>
      <div class="relative w-full max-w-xs">
        <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-800/40" />
        <input
          v-model="filter"
          type="search"
          placeholder="Filtrer par nom, région, ville…"
          class="w-full rounded-xl border border-emerald-900/10 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#166534]/40 focus:ring-2 focus:ring-[#166534]/15"
        />
      </div>
    </header>

    <div v-if="loading" class="py-12 text-center text-emerald-900/40">Chargement…</div>
    <div
      v-else-if="!filtered.length"
      class="rounded-2xl bg-white p-10 text-center text-emerald-900/45 shadow-sm"
    >
      Aucun établissement trouvé.
    </div>
    <div v-else class="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[40rem] text-left text-sm">
          <thead class="bg-emerald-50/80 text-xs uppercase text-emerald-900/50">
            <tr>
              <th class="px-4 py-3 font-medium">Établissement</th>
              <th class="px-4 py-3 font-medium">Région</th>
              <th class="px-4 py-3 font-medium">Ville</th>
              <th class="px-4 py-3 font-medium">Élèves</th>
              <th class="px-4 py-3 font-medium">Maîtrise</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="s in filtered"
              :key="s.id"
              class="border-t border-emerald-900/5 hover:bg-emerald-50/40"
            >
              <td class="px-4 py-3 font-medium text-emerald-950">{{ s.nom || s.name || '—' }}</td>
              <td class="px-4 py-3 text-emerald-900/65">{{ s.region || '—' }}</td>
              <td class="px-4 py-3 text-emerald-900/65">{{ s.ville || '—' }}</td>
              <td class="px-4 py-3 tabular-nums">{{ s.elevesCount ?? '—' }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <div class="h-1.5 w-20 overflow-hidden rounded-full bg-emerald-100">
                    <div
                      class="h-full rounded-full"
                      :class="barColor(s.maitrise)"
                      :style="{ width: `${Math.min(100, s.maitrise ?? 0)}%` }"
                    />
                  </div>
                  <span class="tabular-nums font-semibold text-[#166534]">
                    {{ s.maitrise ?? 0 }}%
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, ref, type Ref } from 'vue'
import { Search } from 'lucide-vue-next'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'
import type { School } from '@/types/models'

const schools = ref<School[]>([])
const loading = ref(true)
const localFilter = ref('')
const ministereSearch = inject<Ref<string>>('ministereSearch', ref(''))

const filter = computed({
  get: () => localFilter.value || ministereSearch.value,
  set: (v: string) => {
    localFilter.value = v
  },
})

const filtered = computed(() => {
  const q = filter.value.trim().toLowerCase()
  if (!q) return schools.value
  return schools.value.filter((s) => {
    const hay = [s.nom, s.name, s.region, s.ville, s.type].filter(Boolean).join(' ').toLowerCase()
    return hay.includes(q)
  })
})

function barColor(m?: number) {
  const v = m ?? 0
  if (v >= 70) return 'bg-[#166534]'
  if (v >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}

onMounted(async () => {
  try {
    const snap = await getDocs(collection(db, 'ecoles'))
    schools.value = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as School))
      .sort((a, b) => (b.maitrise ?? 0) - (a.maitrise ?? 0))
  } finally {
    loading.value = false
  }
})
</script>
