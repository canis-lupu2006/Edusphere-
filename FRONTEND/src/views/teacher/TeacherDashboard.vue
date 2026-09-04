<template>
  <div>
    <header class="mb-8">
      <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-violet-300">
        PROFESSEUR
      </p>
      <h1 class="page-title">Bonjour {{ firstName }}</h1>
      <p class="page-sub">Vue d'ensemble de vos classes</p>
    </header>

    <div class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RouterLink to="/teacher/comprehension" class="block transition hover:brightness-110">
        <StatCard
          label="Compréhension"
          :value="classeIds.length"
          hint="Classes suivies"
          :icon="GraduationCap"
        />
      </RouterLink>
      <RouterLink to="/teacher/tickets" class="block transition hover:brightness-110">
        <StatCard
          label="Tickets ouverts"
          :value="openTickets.length"
          hint="Temps réel"
          :icon="MessageSquare"
          icon-bg="bg-teal-500/15"
          icon-color="text-teal-300"
        />
      </RouterLink>
      <RouterLink to="/teacher/contenus" class="block transition hover:brightness-110">
        <StatCard
          label="Contenus IA"
          :value="pendingAi"
          hint="En attente"
          :icon="Sparkles"
          icon-bg="bg-violet-500/15"
          icon-color="text-violet-300"
        />
      </RouterLink>
      <RouterLink to="/teacher/devoirs" class="block transition hover:brightness-110">
        <StatCard
          label="Devoirs"
          :value="homeworkCount"
          hint="Publiés"
          :icon="ClipboardList"
          icon-bg="bg-amber-500/15"
          icon-color="text-amber-300"
        />
      </RouterLink>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <div class="glass-card p-5">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="font-display text-lg font-semibold">Tickets ouverts</h2>
          <RouterLink to="/teacher/tickets" class="text-sm text-blue-400">Voir tout →</RouterLink>
        </div>
        <TicketList :tickets="openTickets.slice(0, 5)" :resolvable="true" @resolve="resolveTicket" />
      </div>

      <div class="glass-card space-y-3 p-5">
        <h2 class="font-display text-lg font-semibold">Accès rapides</h2>
        <RouterLink
          to="/teacher/comprehension"
          class="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition hover:bg-white/10"
        >
          <GraduationCap class="h-4 w-4 text-blue-300" />
          Compréhension de la classe
        </RouterLink>
        <RouterLink
          to="/teacher/programme"
          class="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition hover:bg-white/10"
        >
          <Calendar class="h-4 w-4 text-blue-300" />
          Programme & Planification
        </RouterLink>
        <RouterLink
          to="/teacher/contenus"
          class="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition hover:bg-white/10"
        >
          <Sparkles class="h-4 w-4 text-violet-300" />
          Contenus & Validation IA
        </RouterLink>
        <RouterLink
          to="/teacher/devoirs"
          class="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition hover:bg-white/10"
        >
          <ClipboardList class="h-4 w-4 text-amber-300" />
          Devoirs & Évaluations
        </RouterLink>

        <div v-if="summary" class="mt-4 rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 text-sm text-white/70">
          <p class="mb-1 font-semibold text-violet-300">Résumé IA</p>
          <p class="whitespace-pre-wrap">{{ summary }}</p>
        </div>
        <button
          v-else
          type="button"
          class="btn-secondary mt-2 w-full text-sm"
          :disabled="summarizing || !classeIds.length"
          @click="summarize"
        >
          {{ summarizing ? 'Analyse…' : 'Résumer les tickets (optionnel)' }}
        </button>
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
import {
  GraduationCap,
  MessageSquare,
  Sparkles,
  ClipboardList,
  Calendar,
} from 'lucide-vue-next'
import StatCard from '@/components/StatCard.vue'
import TicketList from '@/components/TicketList.vue'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { useCloudFunctions } from '@/composables/useCloudFunctions'

const auth = useAuthStore()
const { getTicketSummary } = useCloudFunctions()
const firstName = computed(() => auth.displayName.split(' ')[0] || 'Professeur')

const classeIds = computed((): string[] => {
  const p = auth.profile
  if (!p) return []
  return p.classeIds || (p.classeId ? [p.classeId] : [])
})

const openTickets = ref<Ticket[]>([])
const pendingAi = ref(0)
const homeworkCount = ref(0)
const summary = ref('')
const summarizing = ref(false)
let unsubs: Unsubscribe[] = []

onMounted(() => {
  const ids = classeIds.value
  if (ids.length) {
    const chunk = ids.slice(0, 10)
    const tq = query(
      collection(db, 'tickets'),
      where('classeId', 'in', chunk),
      where('status', '==', 'ouvert'),
    )
    unsubs.push(
      onSnapshot(tq, (snap) => {
        openTickets.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Ticket))
      }),
    )
  }

  const uid = auth.user?.uid
  if (uid) {
    getDocs(
      query(
        collection(db, 'ai_contents'),
        where('enseignantId', '==', uid),
        where('status', '==', 'en_attente'),
      ),
    ).then((snap) => {
      pendingAi.value = snap.size
    })
    getDocs(query(collection(db, 'homework'), where('enseignantId', '==', uid))).then((snap) => {
      homeworkCount.value = snap.size
    })
  }
})

onUnmounted(() => unsubs.forEach((u) => u()))

async function resolveTicket(t: Ticket) {
  await updateDoc(doc(db, 'tickets', t.id), { status: 'resolu' })
}

async function summarize() {
  if (!classeIds.value.length) return
  summarizing.value = true
  try {
    const data = await getTicketSummary({ classeId: classeIds.value[0] })
    summary.value =
      typeof data === 'string'
        ? data
        : (data as { summary?: string })?.summary || JSON.stringify(data)
  } catch {
    summary.value = ''
  } finally {
    summarizing.value = false
  }
}
</script>
