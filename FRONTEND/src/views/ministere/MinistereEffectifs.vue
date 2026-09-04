<template>
  <div>
    <header class="mb-6">
      <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#166534]/70">
        Ministère
      </p>
      <h1 class="font-display text-2xl font-semibold text-emerald-950">Élèves & Enseignants</h1>
      <p class="mt-1 text-sm text-emerald-900/55">Effectifs nationaux agrégés</p>
    </header>

    <div class="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div class="rounded-2xl bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-emerald-900/45">Élèves</p>
        <p class="mt-1 font-display text-3xl font-bold text-[#166534]">
          {{ stats.eleves.toLocaleString('fr-FR') }}
        </p>
      </div>
      <div class="rounded-2xl bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-emerald-900/45">Enseignants</p>
        <p class="mt-1 font-display text-3xl font-bold text-[#166534]">
          {{ stats.enseignants.toLocaleString('fr-FR') }}
        </p>
      </div>
      <div class="rounded-2xl bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-emerald-900/45">Ratio élèves / enseignant</p>
        <p class="mt-1 font-display text-3xl font-bold text-[#166534]">{{ ratio }}</p>
      </div>
      <div class="rounded-2xl bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-emerald-900/45">Établissements</p>
        <p class="mt-1 font-display text-3xl font-bold text-[#166534]">{{ stats.ecoles }}</p>
      </div>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <section class="rounded-2xl bg-white p-5 shadow-sm">
        <h2 class="mb-4 font-display text-lg font-semibold text-emerald-950">
          Répartition par genre (élèves)
        </h2>
        <div class="space-y-3">
          <div>
            <div class="mb-1 flex justify-between text-sm">
              <span>Filles</span>
              <span class="font-semibold text-[#166534]">{{ gender.filles }}%</span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-emerald-100">
              <div class="h-full rounded-full bg-[#166534]" :style="{ width: `${gender.filles}%` }" />
            </div>
          </div>
          <div>
            <div class="mb-1 flex justify-between text-sm">
              <span>Garçons</span>
              <span class="font-semibold text-sky-700">{{ gender.garcons }}%</span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-sky-100">
              <div class="h-full rounded-full bg-sky-600" :style="{ width: `${gender.garcons}%` }" />
            </div>
          </div>
        </div>
        <p class="mt-3 text-[11px] text-emerald-900/45">
          {{ gender.fromData ? 'Calculé depuis le champ genre des utilisateurs' : 'Répartition indicative (statique)' }}
        </p>
      </section>

      <section class="rounded-2xl bg-white p-5 shadow-sm">
        <h2 class="mb-4 font-display text-lg font-semibold text-emerald-950">
          Top régions (élèves déclarés)
        </h2>
        <div v-if="loading" class="py-6 text-center text-sm text-emerald-900/40">Chargement…</div>
        <ul v-else-if="regions.length" class="space-y-3">
          <li v-for="r in regions" :key="r.name">
            <div class="mb-1 flex justify-between text-sm">
              <span class="font-medium text-emerald-950">{{ r.name }}</span>
              <span class="tabular-nums text-emerald-900/70">
                {{ r.eleves.toLocaleString('fr-FR') }} · {{ r.pct }}%
              </span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-emerald-100">
              <div class="h-full rounded-full bg-emerald-600" :style="{ width: `${r.pct}%` }" />
            </div>
          </li>
        </ul>
        <p v-else class="text-sm text-emerald-900/45">Aucune région renseignée.</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'
import type { School } from '@/types/models'

const loading = ref(true)
const stats = reactive({ eleves: 0, enseignants: 0, ecoles: 0 })
const gender = reactive({ filles: 48, garcons: 52, fromData: false })
const regions = ref<{ name: string; eleves: number; pct: number }[]>([])

const ratio = computed(() =>
  stats.enseignants ? Math.round(stats.eleves / stats.enseignants) : '—',
)

onMounted(async () => {
  try {
    const [usersSnap, schoolsSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'ecoles')),
    ])

    let eleves = 0
    let enseignants = 0
    let f = 0
    let g = 0
    let gendered = 0

    usersSnap.forEach((d) => {
      const data = d.data()
      if (data.role === 'eleve') {
        eleves++
        const genre = String(data.genre || data.sexe || '').toLowerCase()
        if (genre === 'f' || genre === 'fille' || genre === 'female' || genre === 'femme') {
          f++
          gendered++
        } else if (genre === 'm' || genre === 'garcon' || genre === 'garçon' || genre === 'male' || genre === 'homme') {
          g++
          gendered++
        }
      } else if (data.role === 'enseignant') {
        enseignants++
      }
    })

    stats.eleves = eleves
    stats.enseignants = enseignants
    stats.ecoles = schoolsSnap.size

    if (gendered > 0) {
      gender.filles = Math.round((f / gendered) * 100)
      gender.garcons = 100 - gender.filles
      gender.fromData = true
    }

    const schools = schoolsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as School))
    const map = new Map<string, number>()
    for (const s of schools) {
      const region = (s.region || 'Non renseignée').trim()
      map.set(region, (map.get(region) || 0) + (s.elevesCount ?? 0))
    }
    const total = [...map.values()].reduce((a, b) => a + b, 0) || 1
    regions.value = [...map.entries()]
      .map(([name, elevesCount]) => ({
        name,
        eleves: elevesCount,
        pct: Math.round((elevesCount / total) * 100),
      }))
      .sort((a, b) => b.eleves - a.eleves)
      .slice(0, 8)
  } finally {
    loading.value = false
  }
})
</script>
