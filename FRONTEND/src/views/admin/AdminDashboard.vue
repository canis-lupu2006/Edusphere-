<template>
  <div>
    <header class="mb-8">
      <h1 class="page-title">Tableau de bord</h1>
      <p class="page-sub">{{ auth.profile?.ecoleNom || 'Administration établissement' }}</p>
    </header>

    <div class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Élèves" :value="stats.eleves" :icon="GraduationCap" icon-bg="bg-emerald-500/15" icon-color="text-emerald-300" />
      <StatCard label="Enseignants" :value="stats.enseignants" :icon="Users" icon-bg="bg-teal-500/15" icon-color="text-teal-300" />
      <StatCard label="Classes" :value="stats.classes" :icon="School" />
      <StatCard label="Tickets ouverts" :value="stats.tickets" :icon="Ticket" icon-bg="bg-amber-500/15" icon-color="text-amber-300" />
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <div class="glass-card p-5">
        <h2 class="mb-3 font-display text-lg font-semibold">Indicateurs</h2>
        <ul class="space-y-3 text-sm">
          <li class="flex justify-between">
            <span class="text-white/50">Taux de réussite moyen</span>
            <span class="font-semibold">{{ stats.avgSuccess }}%</span>
          </li>
          <li class="flex justify-between">
            <span class="text-white/50">Tickets résolus</span>
            <span class="font-semibold">{{ stats.resolvedTickets }}</span>
          </li>
        </ul>
      </div>
      <div class="glass-card p-5">
        <h2 class="mb-3 font-display text-lg font-semibold">Actions rapides</h2>
        <div class="flex flex-wrap gap-2">
          <RouterLink to="/admin/users" class="btn-secondary text-sm">Gérer les utilisateurs</RouterLink>
          <RouterLink to="/admin/classes" class="btn-secondary text-sm">Gérer les classes</RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import { RouterLink } from 'vue-router'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { GraduationCap, Users, School, Ticket } from 'lucide-vue-next'
import StatCard from '@/components/StatCard.vue'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const stats = reactive({
  eleves: 0,
  enseignants: 0,
  classes: 0,
  tickets: 0,
  resolvedTickets: 0,
  avgSuccess: 0,
})

onMounted(async () => {
  const users = await getDocs(collection(db, 'users'))
  let eleves = 0
  let enseignants = 0
  users.forEach((d) => {
    const r = d.data().role
    if (r === 'eleve') eleves++
    if (r === 'enseignant') enseignants++
  })
  stats.eleves = eleves
  stats.enseignants = enseignants

  const classes = await getDocs(collection(db, 'classes'))
  stats.classes = classes.size

  const openT = await getDocs(query(collection(db, 'tickets'), where('status', '==', 'ouvert')))
  stats.tickets = openT.size
  const resolved = await getDocs(query(collection(db, 'tickets'), where('status', '==', 'resolu')))
  stats.resolvedTickets = resolved.size

  const attempts = await getDocs(collection(db, 'attempts'))
  const scores = attempts.docs.map((d) => d.data().score || 0)
  stats.avgSuccess = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0
})
</script>
