<template>
  <div>
    <header class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
          ADMINISTRATION
        </p>
        <h1 class="page-title">Supervision des tickets</h1>
        <p class="page-sub">Suivi et assignation des demandes d'aide.</p>
      </div>
      <div class="relative min-w-[14rem]">
        <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input v-model="search" class="input-field" placeholder="Rechercher un élève…" />
      </div>
    </header>

    <div class="mb-6 grid gap-4 sm:grid-cols-3">
      <div class="glass-card flex items-center gap-3 p-4">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          <FilePlus class="h-5 w-5" />
        </div>
        <div>
          <p class="text-xs uppercase tracking-wide text-slate-500">Nouveaux</p>
          <p class="font-display text-2xl font-bold">{{ counts.nouveaux }}</p>
        </div>
      </div>
      <div class="glass-card flex items-center gap-3 p-4">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
          <Clock class="h-5 w-5" />
        </div>
        <div>
          <p class="text-xs uppercase tracking-wide text-slate-500">En retard</p>
          <p class="font-display text-2xl font-bold">{{ counts.retard }}</p>
        </div>
      </div>
      <div class="glass-card flex items-center gap-3 p-4">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
          <AlertTriangle class="h-5 w-5" />
        </div>
        <div>
          <p class="text-xs uppercase tracking-wide text-slate-500">Urgents</p>
          <p class="font-display text-2xl font-bold">{{ counts.urgents }}</p>
        </div>
      </div>
    </div>

    <div class="mb-4 flex flex-wrap gap-3">
      <select v-model="filtreStatut" class="input-field !w-auto !pl-4">
        <option value="">Statut : Tous</option>
        <option value="nouveau">Nouveau</option>
        <option value="ouvert">Ouvert</option>
        <option value="intervention">Intervention</option>
        <option value="en_cours">En cours</option>
        <option value="sans_reponse">Sans réponse</option>
        <option value="resolu">Résolu</option>
      </select>
      <select v-model="filtreClasse" class="input-field !w-auto !pl-4">
        <option value="">Classe : Toutes</option>
        <option v-for="c in classes" :key="c" :value="c">{{ c }}</option>
      </select>
      <select v-model="filtrePriorite" class="input-field !w-auto !pl-4">
        <option value="">Priorité : Toutes</option>
        <option value="normale">Normale</option>
        <option value="urgent">Urgent</option>
      </select>
    </div>

    <div class="glass-card overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-3">Élève</th>
            <th class="px-4 py-3">Notion</th>
            <th class="px-4 py-3">Classe</th>
            <th class="px-4 py-3">Statut</th>
            <th class="px-4 py-3">Priorité</th>
            <th class="px-4 py-3">Assigné à</th>
            <th class="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in filtered" :key="t.id" class="border-b border-slate-100">
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <div
                  class="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-200"
                >
                  {{ initials(t.eleveNom) }}
                </div>
                <span class="font-medium">{{ t.eleveNom || '—' }}</span>
              </div>
            </td>
            <td class="px-4 py-3 text-slate-600">{{ t.notion || '—' }}</td>
            <td class="px-4 py-3 text-slate-600">{{ t.classeNom || '—' }}</td>
            <td class="px-4 py-3">
              <select
                :value="t.status || 'ouvert'"
                class="rounded-full border px-2 py-1 text-xs"
                :class="statusClass(t.status)"
                @change="onStatus(t, $event)"
              >
                <option value="nouveau">Nouveau</option>
                <option value="ouvert">Ouvert</option>
                <option value="intervention">Intervention</option>
                <option value="en_cours">En cours</option>
                <option value="sans_reponse">Sans réponse</option>
                <option value="resolu">Résolu</option>
              </select>
            </td>
            <td class="px-4 py-3">
              <span
                class="rounded-full border px-2.5 py-0.5 text-[11px] font-medium"
                :class="
                  t.priorite === 'urgent'
                    ? 'border-red-500/40 text-red-600'
                    : 'border-blue-500/40 text-blue-600'
                "
              >
                {{ t.priorite === 'urgent' ? 'Urgent' : 'Normale' }}
              </span>
            </td>
            <td class="px-4 py-3 text-slate-600">{{ t.assigneNom || '—' }}</td>
            <td class="px-4 py-3">
              <button
                type="button"
                class="text-xs text-emerald-700 hover:underline"
                @click="assignTicket(t)"
              >
                Assigner
              </button>
            </td>
          </tr>
          <tr v-if="!filtered.length">
            <td colspan="7" class="px-4 py-10 text-center text-slate-400">Aucun ticket.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import type { Unsubscribe } from 'firebase/firestore'
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { Search, FilePlus, Clock, AlertTriangle } from 'lucide-vue-next'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import type { Ticket } from '@/types/models'

const auth = useAuthStore()
const tickets = ref<Ticket[]>([])
const search = ref('')
const filtreStatut = ref('')
const filtreClasse = ref('')
const filtrePriorite = ref('')
let unsub: Unsubscribe | null = null

const counts = reactive({
  nouveaux: 0,
  retard: 0,
  urgents: 0,
})

const classes = computed(() => {
  const set = new Set<string>()
  tickets.value.forEach((t) => {
    if (t.classeNom) set.add(t.classeNom)
  })
  return [...set].sort()
})

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return tickets.value.filter((t) => {
    if (filtreStatut.value && t.status !== filtreStatut.value) return false
    if (filtreClasse.value && t.classeNom !== filtreClasse.value) return false
    if (filtrePriorite.value) {
      const p = t.priorite || 'normale'
      if (p !== filtrePriorite.value) return false
    }
    if (!q) return true
    const hay = `${t.eleveNom || ''} ${t.notion || ''} ${t.classeNom || ''}`.toLowerCase()
    return hay.includes(q)
  })
})

function initials(name?: string) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function statusClass(status?: string) {
  const s = String(status || '').toLowerCase()
  if (s === 'intervention' || s === 'en_cours') return 'border-emerald-500/30 bg-emerald-100 text-emerald-700'
  if (s === 'sans_reponse') return 'border-red-500/30 bg-red-100 text-red-600'
  if (s === 'nouveau' || s === 'ouvert') return 'border-amber-500/30 bg-amber-100 text-amber-600'
  if (s === 'resolu') return 'border-slate-200 bg-slate-50 text-slate-500'
  return 'border-slate-200 bg-slate-50 text-slate-600'
}

function refreshCounts() {
  counts.nouveaux = tickets.value.filter(
    (t) => t.status === 'nouveau' || t.status === 'ouvert',
  ).length
  counts.retard = tickets.value.filter((t) => t.status === 'sans_reponse').length
  counts.urgents = tickets.value.filter((t) => t.priorite === 'urgent').length
}

onMounted(() => {
  unsub = onSnapshot(collection(db, 'tickets'), (snap) => {
    tickets.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Ticket)
    refreshCounts()
  })
})

onUnmounted(() => unsub?.())

function onStatus(t: Ticket, event: Event) {
  const target = event.target as HTMLSelectElement
  void updateDoc(doc(db, 'tickets', t.id), { status: target.value })
}

async function assignTicket(t: Ticket) {
  const name = window.prompt('Assigner à (nom)', t.assigneNom || auth.displayName)
  if (name == null) return
  await updateDoc(doc(db, 'tickets', t.id), {
    assigneNom: name.trim() || auth.displayName,
    assigneA: auth.user?.uid || null,
  })
}
</script>
