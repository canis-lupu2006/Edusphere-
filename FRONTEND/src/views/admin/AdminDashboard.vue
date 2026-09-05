<template>
  <div>
    <header class="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-teal-700">
          ADMINISTRATION
        </p>
        <h1 class="page-title">Tableau de bord</h1>
        <div class="mt-2 flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-700"
          >
            {{ schoolInitials }}
          </div>
          <div>
            <p class="font-medium text-slate-900">{{ schoolName }}</p>
            <p class="text-xs text-slate-500">Vue d'ensemble de l'établissement</p>
          </div>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <RouterLink to="/admin/users" class="btn-secondary text-sm !border-emerald-500/40 !text-emerald-700">
          <UserPlus class="h-4 w-4" />
          Ajouter élève
        </RouterLink>
        <button type="button" class="btn-secondary text-sm" @click="publishAnnouncement">
          <Megaphone class="h-4 w-4" />
          Publier annonce
        </button>
        <button type="button" class="btn-secondary text-sm" @click="exportReport">
          <Download class="h-4 w-4" />
          Exporter
        </button>
      </div>
    </header>

    <div class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Élèves inscrits"
        :value="stats.eleves"
        hint="Comptes rôle élève"
        :icon="Users"
        icon-bg="bg-emerald-100"
        icon-color="text-emerald-700"
      />
      <StatCard
        label="Enseignants"
        :value="stats.enseignants"
        hint="Comptes rôle enseignant"
        :icon="GraduationCap"
        icon-bg="bg-teal-100"
        icon-color="text-teal-700"
      />
      <StatCard
        label="Classes"
        :value="stats.classes"
        hint="Collège & Lycée"
        :icon="School"
        icon-bg="bg-amber-100"
        icon-color="text-amber-600"
      />
      <StatCard
        label="Usage hors-ligne"
        :value="`${stats.offline}%`"
        hint="Estimation locale"
        :icon="CloudOff"
        icon-bg="bg-emerald-100"
        icon-color="text-emerald-700"
      />
    </div>

    <div class="mb-6 grid gap-4 lg:grid-cols-2">
      <div class="glass-card p-5">
        <h2 class="mb-4 font-display text-lg font-semibold">Indicateurs d'impact</h2>
        <ul class="space-y-4 text-sm">
          <li class="flex items-center justify-between gap-3">
            <span class="flex items-center gap-2 text-slate-500">
              <Target class="h-4 w-4 text-emerald-700" />
              Maîtrise moyenne
            </span>
            <span class="font-semibold text-emerald-700">{{ impact.maitrise }}%</span>
          </li>
          <li class="flex items-center justify-between gap-3">
            <span class="flex items-center gap-2 text-slate-500">
              <Clock class="h-4 w-4 text-emerald-700" />
              Score moyen tentatives
            </span>
            <span class="font-semibold text-emerald-700">{{ impact.avgScore }}%</span>
          </li>
          <li class="flex items-center justify-between gap-3">
            <span class="flex items-center gap-2 text-slate-500">
              <CheckCircle2 class="h-4 w-4 text-emerald-700" />
              Tickets résolus
            </span>
            <span class="font-semibold text-emerald-700">
              {{ impact.resolved }} / {{ impact.totalTickets }}
            </span>
          </li>
          <li class="flex items-center justify-between gap-3">
            <span class="flex items-center gap-2 text-slate-500">
              <Star class="h-4 w-4 text-amber-600" />
              Tickets ouverts
            </span>
            <span class="font-semibold text-emerald-700">{{ impact.openTickets }}</span>
          </li>
        </ul>
      </div>

      <div class="glass-card p-5">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="flex items-center gap-2 font-display text-lg font-semibold">
            <Bell class="h-4 w-4 text-emerald-700" />
            Alertes administratives
          </h2>
          <RouterLink to="/admin/supervision" class="text-xs text-emerald-700 hover:underline">
            Voir tout →
          </RouterLink>
        </div>
        <ul v-if="alerts.length" class="space-y-3">
          <li
            v-for="a in alerts.slice(0, 5)"
            :key="a.id"
            class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="text-sm font-medium">{{ a.titre || a.type || 'Alerte' }}</p>
                <p class="mt-0.5 text-xs text-slate-500">{{ a.detail || '—' }}</p>
              </div>
              <span
                class="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                :class="alertBadgeClass(a)"
              >
                {{ a.status || a.priorite || 'À surveiller' }}
              </span>
            </div>
          </li>
        </ul>
        <p v-else class="py-6 text-center text-sm text-slate-400">Aucune alerte pour le moment.</p>
      </div>
    </div>

    <div class="glass-card p-5">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="font-display text-lg font-semibold">Activité récente</h2>
      </div>
      <ul v-if="activity.length" class="space-y-3">
        <li
          v-for="log in activity.slice(0, 8)"
          :key="log.id"
          class="flex items-start gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3"
        >
          <div
            class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            :class="activityIconBg(log)"
          >
            <component :is="activityIcon(log)" class="h-4 w-4" />
          </div>
          <div class="min-w-0">
            <p class="text-sm font-medium">{{ log.type || 'Activité' }}</p>
            <p class="mt-0.5 text-xs text-slate-500">{{ log.message || '—' }}</p>
          </div>
        </li>
      </ul>
      <p v-else class="py-6 text-center text-sm text-slate-400">Aucune activité récente.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import type { Unsubscribe } from 'firebase/firestore'
import { RouterLink } from 'vue-router'
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  addDoc,
  limit,
} from 'firebase/firestore'
import {
  Users,
  GraduationCap,
  School,
  CloudOff,
  UserPlus,
  Megaphone,
  Download,
  Target,
  Clock,
  CheckCircle2,
  Star,
  Bell,
  UserPlus2,
  FileText,
  Activity,
} from 'lucide-vue-next'
import StatCard from '@/components/StatCard.vue'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { nowTimestamp } from '@/utils/scoring'
import type { AlertItem, ActivityLog, Attempt, ProgressRecord, Ticket } from '@/types/models'

const auth = useAuthStore()

const schoolName = computed(
  () => auth.profile?.ecoleNom || 'Établissement',
)
const schoolInitials = computed(() =>
  schoolName.value
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase(),
)

const stats = reactive({
  eleves: 0,
  enseignants: 0,
  classes: 0,
  offline: 23,
})

const impact = reactive({
  maitrise: 0,
  avgScore: 0,
  resolved: 0,
  totalTickets: 0,
  openTickets: 0,
})

const alerts = ref<AlertItem[]>([])
const activity = ref<ActivityLog[]>([])
let unsubs: Unsubscribe[] = []

function alertBadgeClass(a: AlertItem) {
  const key = String(a.priorite || a.status || '').toLowerCase()
  if (key.includes('urgent')) return 'bg-red-500/20 text-red-600'
  if (key.includes('surveiller') || key.includes('attention')) return 'bg-amber-500/20 text-amber-600'
  return 'bg-emerald-500/20 text-emerald-700'
}

function activityIcon(log: ActivityLog) {
  const t = String(log.type || '').toLowerCase()
  if (t.includes('élève') || t.includes('eleve') || t.includes('inscrit')) return UserPlus2
  if (t.includes('annonce')) return Megaphone
  if (t.includes('rapport') || t.includes('export')) return FileText
  return Activity
}

function activityIconBg(log: ActivityLog) {
  const t = String(log.type || '').toLowerCase()
  if (t.includes('élève') || t.includes('eleve') || t.includes('inscrit')) return 'bg-emerald-100 text-emerald-700'
  if (t.includes('annonce')) return 'bg-blue-100 text-blue-600'
  if (t.includes('rapport') || t.includes('export')) return 'bg-violet-100 text-violet-600'
  return 'bg-slate-100 text-slate-500'
}

onMounted(async () => {
  const ecoleId = auth.profile?.ecoleId

  const usersSnap = await getDocs(collection(db, 'users'))
  let eleves = 0
  let enseignants = 0
  usersSnap.forEach((d) => {
    const data = d.data()
    if (ecoleId && data.ecoleId && data.ecoleId !== ecoleId) return
    if (data.role === 'eleve') eleves++
    if (data.role === 'enseignant') enseignants++
  })
  stats.eleves = eleves
  stats.enseignants = enseignants

  const classesQ = ecoleId
    ? query(collection(db, 'classes'), where('ecoleId', '==', ecoleId))
    : collection(db, 'classes')
  const classesSnap = await getDocs(classesQ)
  stats.classes = classesSnap.size

  const [attemptsSnap, progressSnap, ticketsSnap] = await Promise.all([
    getDocs(collection(db, 'attempts')),
    getDocs(collection(db, 'progress')),
    getDocs(collection(db, 'tickets')),
  ])

  const attempts = attemptsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Attempt)
  const scores = attempts.map((a) => Number(a.score ?? a.scoreDetail?.percent ?? 0))
  impact.avgScore = scores.length
    ? Math.round(scores.reduce((s, n) => s + n, 0) / scores.length)
    : 0

  const progress = progressSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as ProgressRecord)
  const maitrises = progress
    .map((p) => Number(p.maitrise ?? p.percent ?? 0))
    .filter((n) => !Number.isNaN(n))
  impact.maitrise = maitrises.length
    ? Math.round(maitrises.reduce((s, n) => s + n, 0) / maitrises.length)
    : 0

  const tickets = ticketsSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Ticket)
  impact.totalTickets = tickets.length
  impact.resolved = tickets.filter((t) => t.status === 'resolu').length
  impact.openTickets = tickets.filter(
    (t) => t.status === 'ouvert' || t.status === 'nouveau' || t.status === 'en_cours',
  ).length

  if (ecoleId) {
    unsubs.push(
      onSnapshot(
        query(collection(db, 'alerts'), where('ecoleId', '==', ecoleId)),
        (snap) => {
          alerts.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AlertItem)
        },
      ),
    )
    unsubs.push(
      onSnapshot(
        query(collection(db, 'activity_logs'), where('ecoleId', '==', ecoleId), limit(20)),
        (snap) => {
          activity.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ActivityLog)
        },
        () => {
          // Fallback without order if composite index missing
          getDocs(query(collection(db, 'activity_logs'), where('ecoleId', '==', ecoleId))).then(
            (snap) => {
              activity.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ActivityLog)
            },
          )
        },
      ),
    )
  } else {
    unsubs.push(
      onSnapshot(collection(db, 'alerts'), (snap) => {
        alerts.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AlertItem)
      }),
    )
    unsubs.push(
      onSnapshot(query(collection(db, 'activity_logs'), limit(20)), (snap) => {
        activity.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ActivityLog)
      }),
    )
  }
})

onUnmounted(() => unsubs.forEach((u) => u()))

async function publishAnnouncement() {
  const titre = window.prompt('Titre de l\'annonce')
  if (!titre?.trim()) return
  const message = window.prompt('Message') || ''
  await addDoc(collection(db, 'school_announcements'), {
    titre: titre.trim(),
    message: message.trim(),
    ecoleId: auth.profile?.ecoleId || null,
    createdAt: nowTimestamp(),
  })
  window.alert('Annonce publiée.')
}

function exportReport() {
  window.alert('Export du rapport en cours de préparation.')
}
</script>
