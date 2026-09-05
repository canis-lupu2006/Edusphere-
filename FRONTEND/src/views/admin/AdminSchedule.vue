<template>
  <div>
    <header class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
          ADMINISTRATION
        </p>
        <h1 class="page-title">Emploi du temps</h1>
        <p class="page-sub">Planning par classe et événements à venir.</p>
      </div>
      <select v-model="selectedClasseId" class="input-field !w-auto min-w-[12rem] !pl-4">
        <option value="">Sélectionner une classe</option>
        <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.nom || c.id }}</option>
      </select>
    </header>

    <div class="glass-card mb-8 overflow-hidden">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
        <div class="flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span class="flex items-center gap-1.5">
            <span class="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Cours
          </span>
          <span class="flex items-center gap-1.5">
            <span class="h-2.5 w-2.5 rounded-sm bg-blue-500" /> Examen
          </span>
          <span class="flex items-center gap-1.5">
            <span class="h-2.5 w-2.5 rounded-sm bg-violet-500" /> Activité
          </span>
        </div>
      </div>

      <div v-if="!selectedClasseId" class="px-5 py-12 text-center text-sm text-slate-400">
        Choisissez une classe pour afficher l'emploi du temps.
      </div>
      <div v-else-if="!slots.length" class="px-5 py-12 text-center text-sm text-slate-400">
        Aucun créneau pour cette classe.
      </div>
      <div v-else class="divide-y divide-white/5">
        <section v-for="jour in joursOrder" :key="jour" class="px-5 py-4">
          <h3 class="mb-3 text-xs font-semibold uppercase tracking-wider text-emerald-700/80">
            {{ jour }}
          </h3>
          <ul v-if="byJour[jour]?.length" class="space-y-2">
            <li
              v-for="s in byJour[jour]"
              :key="s.id"
              class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3"
              :class="slotBorder(s)"
            >
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="font-medium">{{ s.matiere || '—' }}</p>
                  <span
                    class="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
                    :class="typeBadge(s)"
                  >
                    {{ s.type || 'cours' }}
                  </span>
                </div>
                <p class="mt-1 text-xs text-slate-500">
                  {{ s.enseignantNom || '—' }}
                  <span v-if="s.salle"> · {{ s.salle }}</span>
                </p>
              </div>
              <p class="shrink-0 text-xs text-slate-500">
                {{ s.debut || '?' }} – {{ s.fin || '?' }}
              </p>
            </li>
          </ul>
          <p v-else class="text-xs text-slate-400">Aucun cours</p>
        </section>
      </div>
    </div>

    <section>
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 class="font-display text-lg font-semibold">Événements à venir</h2>
        <button
          type="button"
          class="btn-secondary text-sm !border-emerald-500/40 !text-emerald-700"
          @click="addEvent"
        >
          <Plus class="h-4 w-4" />
          Ajouter un événement
        </button>
      </div>
      <ul v-if="events.length" class="space-y-3">
        <li
          v-for="e in events"
          :key="e.id"
          class="glass-card flex items-center gap-4 px-4 py-3"
        >
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Calendar class="h-4 w-4" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-medium">{{ e.titre || 'Événement' }}</p>
            <p class="text-xs text-emerald-700/80">{{ e.dateLabel || 'Date à définir' }}</p>
          </div>
          <ChevronRight class="h-4 w-4 text-slate-400" />
        </li>
      </ul>
      <p v-else class="glass-card py-8 text-center text-sm text-slate-400">Aucun événement.</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import type { Unsubscribe } from 'firebase/firestore'
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  addDoc,
} from 'firebase/firestore'
import { Calendar, Plus, ChevronRight } from 'lucide-vue-next'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { nowTimestamp } from '@/utils/scoring'
import type { ClassRecord, ScheduleSlot, SchoolEvent } from '@/types/models'

const auth = useAuthStore()
const classes = ref<ClassRecord[]>([])
const selectedClasseId = ref('')
const slots = ref<ScheduleSlot[]>([])
const events = ref<SchoolEvent[]>([])
let unsubSched: Unsubscribe | null = null
let unsubEvents: Unsubscribe | null = null

const joursOrder = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

const byJour = computed(() => {
  const map: Record<string, ScheduleSlot[]> = {}
  joursOrder.forEach((j) => {
    map[j] = []
  })
  slots.value.forEach((s) => {
    const j = normalizeJour(s.jour)
    if (!map[j]) map[j] = []
    map[j].push(s)
  })
  Object.keys(map).forEach((j) => {
    map[j].sort((a, b) => String(a.debut || '').localeCompare(String(b.debut || '')))
  })
  return map
})

function normalizeJour(j?: string) {
  if (!j) return 'Lundi'
  const raw = j.trim()
  const found = joursOrder.find((d) => d.toLowerCase() === raw.toLowerCase())
  if (found) return found
  const short: Record<string, string> = {
    lun: 'Lundi',
    mar: 'Mardi',
    mer: 'Mercredi',
    jeu: 'Jeudi',
    ven: 'Vendredi',
    sam: 'Samedi',
  }
  return short[raw.toLowerCase().slice(0, 3)] || raw
}

function typeBadge(s: ScheduleSlot) {
  const t = String(s.type || 'cours').toLowerCase()
  if (t === 'examen') return 'bg-blue-500/20 text-blue-600'
  if (t === 'activite' || t === 'activité') return 'bg-violet-500/20 text-violet-600'
  return 'bg-emerald-500/20 text-emerald-700'
}

function slotBorder(s: ScheduleSlot) {
  const t = String(s.type || 'cours').toLowerCase()
  if (t === 'examen') return 'border-l-4 border-l-blue-500 bg-blue-500/5'
  if (t === 'activite' || t === 'activité') return 'border-l-4 border-l-violet-500 bg-violet-500/5'
  return 'border-l-4 border-l-emerald-500 bg-emerald-500/5'
}

onMounted(async () => {
  const ecoleId = auth.profile?.ecoleId
  const classesQ = ecoleId
    ? query(collection(db, 'classes'), where('ecoleId', '==', ecoleId))
    : collection(db, 'classes')
  const snap = await getDocs(classesQ)
  classes.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ClassRecord)
  if (classes.value.length) selectedClasseId.value = classes.value[0].id

  const eventsQ = ecoleId
    ? query(collection(db, 'events'), where('ecoleId', '==', ecoleId))
    : collection(db, 'events')
  unsubEvents = onSnapshot(eventsQ, (s) => {
    events.value = s.docs.map((d) => ({ id: d.id, ...d.data() }) as SchoolEvent)
  })
})

watch(selectedClasseId, (id) => {
  unsubSched?.()
  slots.value = []
  if (!id) return
  unsubSched = onSnapshot(
    query(collection(db, 'schedules'), where('classeId', '==', id)),
    (snap) => {
      slots.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ScheduleSlot)
    },
  )
})

onUnmounted(() => {
  unsubSched?.()
  unsubEvents?.()
})

async function addEvent() {
  const titre = window.prompt('Titre de l\'événement')
  if (!titre?.trim()) return
  const dateLabel = window.prompt('Date / horaire (ex: 5 septembre, 16h00)') || ''
  await addDoc(collection(db, 'events'), {
    titre: titre.trim(),
    dateLabel: dateLabel.trim(),
    ecoleId: auth.profile?.ecoleId || null,
    classeId: selectedClasseId.value || null,
    createdAt: nowTimestamp(),
  })
}
</script>
