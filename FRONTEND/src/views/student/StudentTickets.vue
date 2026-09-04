<template>
  <div>
    <header class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-blue-400">
          ESPACE ÉLÈVE
        </p>
        <h1 class="page-title">Mes tickets</h1>
        <p class="page-sub">Le pont entre l'accompagnement automatisé et l'intervention humaine.</p>
      </div>
      <div class="flex items-center gap-3">
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
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 px-4 py-2.5 text-sm font-semibold shadow-glow-purple"
          :disabled="creating"
          @click="createTicket"
        >
          Nouveau ticket +
        </button>
      </div>
    </header>

    <div class="grid gap-4 lg:grid-cols-2">
      <!-- Liste -->
      <section class="glass-card overflow-hidden">
        <div class="flex items-center gap-2 border-b border-white/10 px-5 py-4">
          <FileText class="h-4 w-4 text-blue-300" />
          <h2 class="font-display text-base font-semibold">Requêtes effectuées</h2>
        </div>
        <div v-if="loading" class="py-10 text-center text-sm text-white/40">Chargement…</div>
        <div v-else-if="!tickets.length" class="py-10 text-center text-sm text-white/40">
          Aucun ticket pour le moment.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr class="border-b border-white/10 text-[10px] uppercase tracking-wider text-blue-300/70">
                <th class="px-5 py-3 font-semibold">Notion</th>
                <th class="px-3 py-3 font-semibold">Matière</th>
                <th class="px-3 py-3 font-semibold">Statut</th>
                <th class="px-3 py-3 font-semibold">Professeur</th>
                <th class="w-8" />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="t in tickets"
                :key="t.id"
                class="cursor-pointer border-b border-white/5 transition hover:bg-white/[0.03]"
                :class="selectedId === t.id ? 'bg-blue-500/10' : ''"
                @click="selectedId = t.id"
              >
                <td class="px-5 py-3.5 font-medium">{{ t.notion || t.message || '—' }}</td>
                <td class="px-3 py-3.5">
                  <div class="flex items-center gap-2">
                    <span
                      class="flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold"
                      :class="subjectTheme(t.matiere).bg + ' ' + subjectTheme(t.matiere).text"
                    >
                      {{ subjectTheme(t.matiere).glyph }}
                    </span>
                    <span class="text-white/70">{{ t.matiere || '—' }}</span>
                  </div>
                </td>
                <td class="px-3 py-3.5">
                  <span
                    class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                    :class="statusBadge(t.status)"
                  >
                    {{ statusLabel(t.status) }}
                  </span>
                </td>
                <td class="px-3 py-3.5">
                  <div class="flex items-center gap-2">
                    <span
                      class="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/25 text-[10px] font-bold text-violet-200"
                    >
                      {{ teacherInitials(t) }}
                    </span>
                    <span class="text-white/70">{{ teacherName(t) }}</span>
                  </div>
                </td>
                <td class="pr-4">
                  <ChevronRight class="h-4 w-4 text-white/30" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Timeline -->
      <section class="glass-card p-5">
        <h2 class="mb-5 font-display text-base font-semibold">
          Ticket —
          {{ selected?.notion || selected?.message || 'Sélectionne un ticket' }}
        </h2>
        <ol v-if="selected" class="relative space-y-0 pl-2">
          <li
            v-for="(step, i) in timeline"
            :key="i"
            class="relative flex gap-4 pb-6 last:pb-0"
          >
            <div class="relative flex flex-col items-center">
              <div
                class="z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                :class="stepCircle(step)"
              >
                <Check v-if="step.done" class="h-3.5 w-3.5" />
              </div>
              <div
                v-if="i < timeline.length - 1"
                class="absolute top-7 h-full w-px bg-white/10"
              />
            </div>
            <div class="min-w-0 flex-1 pt-0.5">
              <p class="text-xs font-semibold uppercase tracking-wide text-white/45">
                {{ step.label }}
              </p>
              <p class="mt-0.5 text-sm text-white/80">{{ step.description }}</p>
              <p v-if="step.at" class="mt-1 text-xs text-white/35">{{ step.at }}</p>
            </div>
          </li>
        </ol>
        <p v-else class="text-sm text-white/40">Sélectionne une requête pour voir le suivi.</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { Unsubscribe } from 'firebase/firestore'
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { Bell, FileText, ChevronRight, Check } from 'lucide-vue-next'
import type { Ticket, TicketStatus, TicketStep } from '@/types/models'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { subjectTheme } from '@/utils/subjectTheme'

interface TimelineStep {
  label: string
  description: string
  done: boolean
  active: boolean
  at?: string
}

const auth = useAuthStore()
const tickets = ref<Ticket[]>([])
const loading = ref(true)
const creating = ref(false)
const selectedId = ref('')
let unsub: Unsubscribe | null = null

const selected = computed(() => tickets.value.find((t) => t.id === selectedId.value) || null)

const timeline = computed((): TimelineStep[] => {
  const t = selected.value
  if (!t) return []
  if (t.steps?.length) {
    return t.steps.map((s: TicketStep, i: number) => ({
      label: s.label || s.titre || `Étape ${i + 1}`,
      description: s.description || '—',
      done: !!s.done,
      active: !!s.active,
      at: typeof s.at === 'string' ? s.at : undefined,
    }))
  }
  return syntheticTimeline(t)
})

function statusLabel(s?: TicketStatus) {
  const v = String(s || 'ouvert').toLowerCase()
  if (v.includes('resolu') || v.includes('clot')) return 'Résolu'
  if (v.includes('cours') || v.includes('intervention')) return 'En cours'
  if (v.includes('nouveau') || v.includes('ouvert')) return 'Ouvert'
  return s || 'Ouvert'
}

function statusBadge(s?: TicketStatus) {
  const label = statusLabel(s)
  if (label === 'Résolu') return 'bg-violet-500/15 text-violet-300'
  if (label === 'En cours') return 'bg-emerald-500/15 text-emerald-300'
  return 'bg-blue-500/15 text-blue-300'
}

function teacherName(t: Ticket) {
  return t.enseignantNom || t.assigneNom || '—'
}

function teacherInitials(t: Ticket) {
  return teacherName(t)
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function syntheticTimeline(t: Ticket): TimelineStep[] {
  const status = String(t.status || 'ouvert').toLowerCase()
  const resolved = status.includes('resolu') || status.includes('clot')
  const inProgress =
    status.includes('cours') || status.includes('intervention') || status.includes('nouveau')
  const notion = t.notion || 'cette notion'
  const teacher = teacherName(t)

  return [
    {
      label: 'Création',
      description: `Ticket lié à la notion « ${notion} ».`,
      done: true,
      active: false,
      at: "Aujourd'hui",
    },
    {
      label: 'Notification',
      description: teacher !== '—' ? `${teacher} a été alerté.` : 'Enseignant alerté.',
      done: true,
      active: false,
      at: "Aujourd'hui",
    },
    {
      label: 'Intervention',
      description: inProgress || resolved ? 'Séance de soutien en cours.' : 'En attente',
      done: resolved,
      active: inProgress && !resolved,
      at: inProgress || resolved ? "Aujourd'hui" : undefined,
    },
    {
      label: 'Suivi',
      description: resolved ? 'Suivi effectué.' : 'En attente',
      done: resolved,
      active: false,
    },
    {
      label: 'Validation',
      description: resolved ? 'Validé.' : 'En attente',
      done: resolved,
      active: false,
    },
    {
      label: 'Clôture',
      description: resolved ? 'Ticket clôturé.' : 'En attente',
      done: resolved,
      active: false,
    },
  ]
}

function stepCircle(step: TimelineStep) {
  if (step.done) return 'bg-emerald-500 text-white'
  if (step.active) return 'bg-blue-500 text-white ring-4 ring-blue-500/30'
  return 'border-2 border-white/20 bg-transparent text-transparent'
}

onMounted(() => {
  if (!auth.user) {
    loading.value = false
    return
  }
  const q = query(collection(db, 'tickets'), where('eleveId', '==', auth.user.uid))
  unsub = onSnapshot(q, (snap) => {
    tickets.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Ticket))
    loading.value = false
    if (!selectedId.value && tickets.value.length) {
      selectedId.value = tickets.value[0].id
    }
  })
})

onUnmounted(() => unsub?.())

async function createTicket() {
  const uid = auth.user?.uid
  if (!uid || creating.value) return
  const notion = window.prompt('Notion / sujet du ticket ?')
  if (!notion?.trim()) return
  const message = window.prompt('Message (optionnel) ?') || notion.trim()
  const matiere = window.prompt('Matière (optionnel) ?') || ''
  creating.value = true
  try {
    await addDoc(collection(db, 'tickets'), {
      eleveId: uid,
      eleveNom: auth.displayName,
      classeId: auth.profile?.classeId || '',
      classeNom: auth.profile?.classeNom || '',
      notion: notion.trim(),
      message: message.trim(),
      matiere: matiere.trim(),
      status: 'ouvert',
      createdAt: serverTimestamp(),
    })
  } catch (e) {
    console.error(e)
    window.alert("Impossible de créer le ticket.")
  } finally {
    creating.value = false
  }
}
</script>
