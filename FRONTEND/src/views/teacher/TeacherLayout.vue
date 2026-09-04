<template>
  <DashboardLayout
    :items="nav"
    space-label="Professeur"
    :subtitle="'Enseignant'"
    accent="purple"
  >
    <RouterView />
  </DashboardLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterView } from 'vue-router'
import {
  LayoutDashboard,
  Ticket,
  BookOpen,
  ClipboardList,
  TrendingUp,
} from 'lucide-vue-next'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'

const nav = computed(() => [
  { to: '/teacher', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { to: '/teacher/tickets', label: 'Tickets', icon: Ticket },
  { to: '/teacher/cours', label: 'Cours', icon: BookOpen },
  { to: '/teacher/exercices', label: 'Exercices', icon: ClipboardList },
  { to: '/teacher/progression', label: 'Progression', icon: TrendingUp },
])
</script>
