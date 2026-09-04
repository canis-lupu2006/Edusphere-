<template>
  <div>
    <header class="mb-8">
      <h1 class="page-title">Bonjour {{ firstName }} 👋</h1>
      <p class="page-sub">Vue d'ensemble de vos classes</p>
    </header>

    <div class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Classes" :value="classeIds.length" hint="Assignées" :icon="GraduationCap" />
      <StatCard
        label="Tickets ouverts"
        :value="openTickets.length"
        hint="Temps réel"
        :icon="MessageCircle"
        icon-bg="bg-teal-500/15"
        icon-color="text-teal-300"
      />
      <StatCard
        label="Cours"
        :value="courseCount"
        hint="Publiés"
        :icon="BookOpen"
        icon-bg="bg-violet-500/15"
        icon-color="text-violet-300"
      />
      <StatCard
        label="Tentatives récentes"
        :value="attemptCount"
        hint="7 derniers jours"
        :icon="ClipboardList"
        icon-bg="bg-amber-500/15"
        icon-color="text-amber-300"
      />
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <div class="glass-card p-5">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="font-display text-lg font-semibold">Tickets ouverts</h2>
          <RouterLink to="/teacher/tickets" class="text-sm text-blue-400">Voir tout →</RouterLink>
        </div>
        <TicketList :tickets="openTickets.slice(0, 5)" :resolvable="true" @resolve="resolveTicket" />
      </div>

      <div class="glass-card p-5">
        <h2 class="mb-4 font-display text-lg font-semibold">Résumé IA des tickets</h2>
        <button type="button" class="btn-primary mb-4 text-sm" :disabled="summarizing" @click="summarize">
          {{ summarizing ? 'Analyse…' : 'Résumer les tickets' }}
        </button>
        <p v-if="summary" class="whitespace-pre-wrap text-sm text-white/70">{{ summary }}</p>
        <p v-else class="text-sm text-white/40">Générez un résumé pédagogique via l'IA.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { Unsubscribe } from 'firebase/firestore'
import type { Ticket } from '@/types/models'
import { RouterLink } from 'vue-router'
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  getDocs,
} from 'firebase/firestore'
import { GraduationCap, MessageCircle, BookOpen, ClipboardList } from 'lucide-vue-next'
import StatCard from '@/components/StatCard.vue'
import TicketList from '@/components/TicketList.vue'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { useCloudFunctions } from '@/composables/useCloudFunctions'

const auth = useAuthStore()
const { getTicketSummary } = useCloudFunctions()
const firstName = computed(() => auth.displayName.split(' ')[0])

const classeIds = computed((): string[] => {
  const p = auth.profile
  if (!p) return []
  return p.classeIds || (p.classeId ? [p.classeId] : [])
})

const openTickets = ref<Ticket[]>([])
const courseCount = ref(0)
const attemptCount = ref(0)
const summary = ref('')
const summarizing = ref(false)
let unsubs: Unsubscribe[] = []

onMounted(() => {
  const ids = classeIds.value
  if (!ids.length) return

  // Tickets pour les classes (max 10 pour 'in')
  const chunk = ids.slice(0, 10)
  const tq = query(
    collection(db, 'tickets'),
    where('classeId', 'in', chunk),
    where('status', '==', 'ouvert')
  )
  unsubs.push(
    onSnapshot(tq, (snap) => {
      openTickets.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Ticket))
    })
  )

  if (auth.user) {
    getDocs(query(collection(db, 'courses'), where('enseignantId', '==', auth.user.uid))).then(
      (snap) => {
        courseCount.value = snap.size
      },
    )
  }
})

onUnmounted(() => unsubs.forEach((u) => u()))

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
  } catch (e) {
    summary.value = 'Résumé indisponible pour le moment.'
  } finally {
    summarizing.value = false
  }
}
</script>
