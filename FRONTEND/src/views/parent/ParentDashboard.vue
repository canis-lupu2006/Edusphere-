<template>
  <div>
    <header class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="font-display text-2xl font-semibold md:text-3xl">
          Suivi de
          <span v-if="currentChild">{{ currentChild.displayName || currentChild.nom || 'l\'enfant' }}</span>
          <span v-else>vos enfants</span>
        </h1>
        <p class="mt-1 text-sm text-[#1a3d32]/55">
          {{ currentChild?.classeNom || 'Progression, notes et alertes' }}
        </p>
      </div>
      <select
        v-if="enfants.length > 1"
        v-model="selectedId"
        class="rounded-xl border border-[#1a5c45]/20 bg-white px-3 py-2 text-sm outline-none"
      >
        <option v-for="e in enfants" :key="e.uid" :value="e.uid">
          {{ e.displayName || e.nom || e.uid }}
        </option>
      </select>
    </header>

    <div class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div class="rounded-2xl border border-[#1a5c45]/10 bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-[#1a3d32]/45">Niveau global</p>
        <p class="mt-1 font-display text-2xl font-bold text-emerald-700">{{ niveauLabel }}</p>
        <p class="mt-1 text-xs text-[#1a3d32]/45">Moyenne {{ avgScore }}%</p>
      </div>
      <div class="rounded-2xl border border-[#1a5c45]/10 bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-[#1a3d32]/45">Tentatives</p>
        <p class="mt-1 font-display text-2xl font-bold">{{ attempts.length }}</p>
      </div>
      <div class="rounded-2xl border border-[#1a5c45]/10 bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-[#1a3d32]/45">Alertes tickets</p>
        <p class="mt-1 font-display text-2xl font-bold text-amber-600">{{ openTickets.length }}</p>
      </div>
      <div class="rounded-2xl border border-[#1a5c45]/10 bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-[#1a3d32]/45">Progressions</p>
        <p class="mt-1 font-display text-2xl font-bold">{{ progress.length }}</p>
      </div>
    </div>

    <div class="mb-6 rounded-2xl border border-[#1a5c45]/10 bg-white p-5 shadow-sm">
      <h2 class="mb-4 font-display text-lg font-semibold">Alertes importantes</h2>
      <ul v-if="openTickets.length" class="space-y-3">
        <li
          v-for="t in openTickets"
          :key="t.id"
          class="flex items-center justify-between gap-3 rounded-xl bg-[#f7f3eb] px-4 py-3 text-sm"
        >
          <span>{{ t.message }}</span>
          <span class="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
            Ticket ouvert
          </span>
        </li>
      </ul>
      <p v-else class="text-sm text-[#1a3d32]/45">Aucune alerte pour le moment.</p>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <div class="rounded-2xl border border-[#1a5c45]/10 bg-white p-5 shadow-sm">
        <h2 class="mb-3 font-display text-lg font-semibold">Notes / tentatives</h2>
        <ul v-if="attempts.length" class="space-y-2 text-sm">
          <li
            v-for="a in attempts.slice(0, 8)"
            :key="a.id"
            class="flex justify-between rounded-lg bg-[#f7f3eb] px-3 py-2"
          >
            <span class="truncate">{{ a.exerciseId }}</span>
            <span class="font-semibold">{{ a.score }}%</span>
          </li>
        </ul>
        <p v-else class="text-sm text-[#1a3d32]/45">Pas encore de notes.</p>
      </div>
      <div class="rounded-2xl border border-[#1a5c45]/10 bg-white p-5 shadow-sm">
        <h2 class="mb-3 font-display text-lg font-semibold">Progression</h2>
        <ul v-if="progress.length" class="space-y-3">
          <li v-for="p in progress" :key="p.id">
            <div class="mb-1 flex justify-between text-sm">
              <span>{{ p.matiere || p.courseTitre }}</span>
              <span>{{ p.percent ?? p.maitrise ?? 0 }}%</span>
            </div>
            <div class="h-2 rounded-full bg-[#1a5c45]/10">
              <div
                class="h-full rounded-full bg-[#1a5c45]"
                :style="{ width: `${p.percent ?? p.maitrise ?? 0}%` }"
              />
            </div>
          </li>
        </ul>
        <p v-else class="text-sm text-[#1a3d32]/45">Aucune progression.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import type { Unsubscribe } from 'firebase/firestore'
import type { Attempt, ProgressRecord, Ticket, UserProfile } from '@/types/models'
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const enfants = ref<UserProfile[]>([])
const selectedId = ref('')
const attempts = ref<Attempt[]>([])
const progress = ref<ProgressRecord[]>([])
const openTickets = ref<Ticket[]>([])
let unsubs: Unsubscribe[] = []

const currentChild = computed(() =>
  enfants.value.find((e) => e.uid === selectedId.value || e.id === selectedId.value),
)

const avgScore = computed(() => {
  if (!attempts.value.length) return 0
  return Math.round(
    attempts.value.reduce((a, b) => a + (b.score || 0), 0) / attempts.value.length
  )
})

const niveauLabel = computed(() => {
  const s = avgScore.value
  if (s >= 80) return 'Excellent'
  if (s >= 60) return 'Bon'
  if (s >= 40) return 'Fragile'
  if (attempts.value.length) return 'À soutenir'
  return '—'
})

onMounted(async () => {
  const ids = auth.profile?.enfantIds || []
  const loaded: UserProfile[] = []
  for (const id of ids) {
    const snap = await getDoc(doc(db, 'users', id))
    if (snap.exists()) {
      loaded.push({ uid: snap.id, id: snap.id, role: null, ...snap.data() } as UserProfile)
    } else {
      loaded.push({ uid: id, id, role: null })
    }
  }
  enfants.value = loaded
  selectedId.value = loaded[0]?.uid || ''
})

watch(selectedId, (id) => {
  unsubs.forEach((u) => u())
  unsubs = []
  attempts.value = []
  progress.value = []
  openTickets.value = []
  if (!id) return

  getDocs(query(collection(db, 'attempts'), where('eleveId', '==', id))).then((snap) => {
    attempts.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Attempt))
  })
  getDocs(query(collection(db, 'progress'), where('eleveId', '==', id))).then((snap) => {
    progress.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ProgressRecord))
  })
  unsubs.push(
    onSnapshot(
      query(collection(db, 'tickets'), where('eleveId', '==', id), where('status', '==', 'ouvert')),
      (snap) => {
        openTickets.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Ticket))
      }
    )
  )
})

onUnmounted(() => unsubs.forEach((u) => u()))
</script>
