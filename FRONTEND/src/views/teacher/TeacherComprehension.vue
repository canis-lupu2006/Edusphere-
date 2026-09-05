<template>
  <div>
    <header class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-violet-600">
          PROFESSEUR
        </p>
        <h1 class="page-title">Compréhension de la classe</h1>
        <p class="page-sub">Détection des notions problématiques</p>
      </div>
      <select v-model="selectedClasseId" class="input-field !w-auto !pl-4 min-w-[10rem]">
        <option v-if="!classes.length" value="" disabled>Aucune classe</option>
        <option v-for="c in classes" :key="c.id" :value="c.id">
          {{ c.nom || c.id }}
        </option>
      </select>
    </header>

    <div class="glass-card overflow-hidden">
      <div v-if="loading" class="p-8 text-center text-slate-400">Chargement…</div>
      <div v-else-if="!topics.length" class="p-8 text-center text-slate-400">
        Aucune notion détectée pour cette classe.
      </div>
      <ul v-else class="divide-y divide-white/5">
        <li
          v-for="t in topics"
          :key="t.id"
          class="flex flex-wrap items-center gap-4 px-5 py-4"
        >
          <div class="min-w-[10rem] flex-1">
            <p class="font-medium">{{ t.notion }}</p>
            <p class="mt-0.5 text-xs" :class="difficulteColor(t.difficultePercent)">
              {{ t.difficultePercent ?? 0 }}% en difficulté
            </p>
          </div>
          <div class="min-w-[8rem] flex-[2]">
            <div class="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                class="h-full rounded-full transition-all"
                :class="barColor(t.maitrisePercent)"
                :style="{ width: `${Math.min(100, t.maitrisePercent ?? 0)}%` }"
              />
            </div>
          </div>
          <button
            type="button"
            class="btn-secondary !px-3 !py-2 text-xs"
            :disabled="creatingId === t.id"
            @click="createGroupedTicket(t)"
          >
            {{ creatingId === t.id ? 'Création…' : 'Créer un ticket groupé' }}
          </button>
          <span class="w-12 text-right font-display text-lg font-semibold tabular-nums">
            {{ t.maitrisePercent ?? 0 }}%
          </span>
        </li>
      </ul>
      <p v-if="toast" class="border-t border-slate-100 px-5 py-3 text-sm text-emerald-700">
        {{ toast }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import type { Unsubscribe } from 'firebase/firestore'
import type { ClassRecord, ComprehensionTopic } from '@/types/models'
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  addDoc,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { nowTimestamp } from '@/utils/scoring'

const auth = useAuthStore()
const classes = ref<ClassRecord[]>([])
const selectedClasseId = ref('')
const topics = ref<ComprehensionTopic[]>([])
const loading = ref(true)
const creatingId = ref<string | null>(null)
const toast = ref('')
let unsub: Unsubscribe | null = null

function difficulteColor(pct?: number) {
  const v = pct ?? 0
  if (v >= 50) return 'text-red-400'
  if (v >= 30) return 'text-amber-600'
  return 'text-emerald-700'
}

function barColor(pct?: number) {
  const v = pct ?? 0
  if (v >= 70) return 'bg-emerald-500'
  if (v >= 50) return 'bg-amber-400'
  return 'bg-red-500'
}

async function loadClasses() {
  const uid = auth.user?.uid
  if (!uid) return

  const profileIds = auth.profile?.classeIds || (auth.profile?.classeId ? [auth.profile.classeId] : [])
  const byTeacher = await getDocs(
    query(collection(db, 'classes'), where('enseignantIds', 'array-contains', uid)),
  )
  const map = new Map<string, ClassRecord>()

  for (const d of byTeacher.docs) {
    map.set(d.id, { id: d.id, ...d.data() } as ClassRecord)
  }

  for (const id of profileIds) {
    if (!map.has(id)) {
      map.set(id, { id, nom: id })
    }
  }

  classes.value = Array.from(map.values())
  if (classes.value.length && !selectedClasseId.value) {
    selectedClasseId.value = classes.value[0].id
  }
}

function subscribeTopics(classeId: string) {
  unsub?.()
  unsub = null
  topics.value = []
  if (!auth.user) {
    loading.value = false
    return
  }
  loading.value = true
  const uid = auth.user.uid
  // Prefer enseignantId; filter client-side by selected classe when set
  const q = query(collection(db, 'comprehension'), where('enseignantId', '==', uid))
  unsub = onSnapshot(q, (snap) => {
    let rows = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ComprehensionTopic))
    if (classeId) rows = rows.filter((t) => !t.classeId || t.classeId === classeId)
    topics.value = rows
    loading.value = false
  })
}

async function createGroupedTicket(t: ComprehensionTopic) {
  if (!auth.user || !selectedClasseId.value) return
  creatingId.value = t.id
  toast.value = ''
  try {
    await addDoc(collection(db, 'tickets'), {
      notion: t.notion,
      status: 'ouvert',
      groupé: true,
      classeId: selectedClasseId.value,
      enseignantId: auth.user.uid,
      message: `Ticket groupé — difficulté ${t.difficultePercent ?? 0}% sur « ${t.notion} »`,
      createdAt: nowTimestamp(),
    })
    toast.value = `Ticket groupé créé pour « ${t.notion} ».`
  } catch {
    toast.value = 'Impossible de créer le ticket.'
  } finally {
    creatingId.value = null
  }
}

watch(selectedClasseId, (id) => subscribeTopics(id))

onMounted(async () => {
  await loadClasses()
  if (selectedClasseId.value) subscribeTopics(selectedClasseId.value)
  else loading.value = false
})

onUnmounted(() => unsub?.())
</script>
