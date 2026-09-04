<template>
  <div>
    <header class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="font-display text-2xl font-semibold text-[#1a3d32] md:text-3xl">
          Devoirs &amp; échéances
        </h1>
        <p class="mt-1 text-sm text-[#1a3d32]/55">
          Consultez les prochains devoirs et leurs échéances.
        </p>
      </div>
      <ChildSelector />
    </header>

    <section class="rounded-2xl border border-[#1a5c45]/10 bg-white p-5 shadow-sm md:p-6">
      <div class="mb-5 flex items-center gap-2">
        <Calendar class="h-4 w-4 text-[#1a5c45]" />
        <h2 class="font-display text-lg font-semibold">Vos devoirs à venir</h2>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr class="border-b border-[#1a5c45]/10 text-xs uppercase tracking-wide text-[#1a3d32]/45">
              <th class="pb-3 pr-4 font-medium">Matière</th>
              <th class="pb-3 pr-4 font-medium">Titre</th>
              <th class="pb-3 pr-4 font-medium">Échéance</th>
              <th class="pb-3 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="h in homework"
              :key="h.id"
              class="border-b border-[#1a5c45]/06 last:border-0"
            >
              <td class="py-3.5 pr-4">
                <div class="flex items-center gap-2.5">
                  <div
                    class="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a5c45]/10 text-xs font-bold text-[#1a5c45]"
                  >
                    {{ (h.matiere || '?').charAt(0) }}
                  </div>
                  <span class="font-medium text-[#1a3d32]">{{ h.matiere || '—' }}</span>
                </div>
              </td>
              <td class="py-3.5 pr-4 text-[#1a3d32]/80">{{ h.titre || '—' }}</td>
              <td class="py-3.5 pr-4 text-[#1a3d32]/70">{{ formatEcheance(h.echeance) }}</td>
              <td class="py-3.5">
                <span
                  class="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  :class="statusClass(h.status)"
                >
                  {{ statusLabel(h.status) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <p
          v-if="!homework.length"
          class="py-10 text-center text-sm text-[#1a3d32]/45"
        >
          Aucun devoir pour le moment.
        </p>
      </div>

      <div class="mt-6 flex flex-wrap items-center gap-3 rounded-2xl bg-[#F7F3EB] px-4 py-4">
        <div class="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <Lightbulb class="h-4 w-4" />
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-[#1a3d32]/45">
            Conseil parent
          </p>
          <p class="text-sm text-[#1a3d32]/75">
            Encouragez une courte séance de révision la veille de l'échéance.
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { inject, onUnmounted, ref, watch, type Ref } from 'vue'
import { Calendar, Lightbulb } from 'lucide-vue-next'
import {
  collection,
  onSnapshot,
  query,
  where,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/firebase'
import type { Homework, UserProfile } from '@/types/models'
import ChildSelector from './ChildSelector.vue'

const selectedChild = inject<Ref<UserProfile | null>>('selectedChild', ref(null))
const homework = ref<Homework[]>([])
let unsubs: Unsubscribe[] = []

function statusLabel(status?: string) {
  const map: Record<string, string> = {
    a_faire: 'À faire',
    en_cours: 'En cours',
    a_venir: 'À venir',
    rendu: 'Rendu',
    en_retard: 'En retard',
  }
  return map[status || ''] || status || '—'
}

function statusClass(status?: string) {
  switch (status) {
    case 'a_faire':
      return 'bg-amber-100 text-amber-800'
    case 'en_cours':
      return 'bg-[#1a5c45]/12 text-[#1a5c45]'
    case 'a_venir':
      return 'bg-violet-100 text-violet-700'
    case 'rendu':
      return 'bg-emerald-100 text-emerald-800'
    case 'en_retard':
      return 'bg-[#E98A76]/20 text-[#c45c4a]'
    default:
      return 'bg-[#ebe4d6] text-[#1a3d32]/60'
  }
}

function formatEcheance(value: Homework['echeance']) {
  if (!value) return '—'
  if (typeof value === 'string') return value
  const ts = value as Timestamp
  if (typeof ts?.toDate === 'function') {
    const d = ts.toDate()
    return d.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  return '—'
}

function clear() {
  unsubs.forEach((u) => u())
  unsubs = []
}

watch(
  () => [selectedChild.value?.uid, selectedChild.value?.classeId] as const,
  ([eleveId, classeId]) => {
    clear()
    homework.value = []
    if (!eleveId && !classeId) return

    const byEleve = new Map<string, Homework>()
    const byClasse = new Map<string, Homework>()
    const apply = () => {
      const merge = new Map([...byClasse, ...byEleve])
      homework.value = Array.from(merge.values())
    }

    if (eleveId) {
      unsubs.push(
        onSnapshot(query(collection(db, 'homework'), where('eleveId', '==', eleveId)), (snap) => {
          byEleve.clear()
          snap.docs.forEach((d) => byEleve.set(d.id, { id: d.id, ...d.data() } as Homework))
          apply()
        }),
      )
    }
    if (classeId) {
      unsubs.push(
        onSnapshot(query(collection(db, 'homework'), where('classeId', '==', classeId)), (snap) => {
          byClasse.clear()
          snap.docs.forEach((d) => byClasse.set(d.id, { id: d.id, ...d.data() } as Homework))
          apply()
        }),
      )
    }
  },
  { immediate: true },
)

onUnmounted(clear)
</script>
