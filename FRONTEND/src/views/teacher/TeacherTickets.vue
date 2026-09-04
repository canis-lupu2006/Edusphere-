<template>
  <div>
    <header class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="page-title">Tickets</h1>
        <p class="page-sub">Demandes d'aide de vos élèves (temps réel).</p>
      </div>
      <button type="button" class="btn-primary text-sm" :disabled="summarizing" @click="summarize">
        Résumer les tickets
      </button>
    </header>

    <div v-if="summary" class="glass-card mb-6 border-violet-500/20 p-4 text-sm text-white/70">
      <p class="mb-1 font-semibold text-violet-300">Résumé IA</p>
      <p class="whitespace-pre-wrap">{{ summary }}</p>
    </div>

    <TicketList :tickets="tickets" :loading="loading" resolvable @resolve="resolveTicket" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { Unsubscribe } from 'firebase/firestore'
import type { Ticket } from '@/types/models'
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import TicketList from '@/components/TicketList.vue'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { useCloudFunctions } from '@/composables/useCloudFunctions'

const auth = useAuthStore()
const { getTicketSummary } = useCloudFunctions()
const tickets = ref<Ticket[]>([])
const loading = ref(true)
const summary = ref('')
const summarizing = ref(false)
let unsub: Unsubscribe | null = null

const classeIds = computed((): string[] => {
  const p = auth.profile
  if (!p) return []
  return p.classeIds || (p.classeId ? [p.classeId] : [])
})

onMounted(() => {
  const ids = classeIds.value.slice(0, 10)
  if (!ids.length) {
    loading.value = false
    return
  }
  const q = query(collection(db, 'tickets'), where('classeId', 'in', ids))
  unsub = onSnapshot(q, (snap) => {
    tickets.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Ticket))
    loading.value = false
  })
})

onUnmounted(() => unsub?.())

async function resolveTicket(t: Ticket) {
  await updateDoc(doc(db, 'tickets', t.id), { status: 'resolu' })
}

async function summarize() {
  summarizing.value = true
  try {
    const data = await getTicketSummary({ classeId: classeIds.value[0] })
    summary.value =
      typeof data === 'string'
        ? data
        : (data as { summary?: string })?.summary || JSON.stringify(data)
  } catch {
    summary.value = 'Impossible de générer le résumé.'
  } finally {
    summarizing.value = false
  }
}
</script>
