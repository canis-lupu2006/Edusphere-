<template>
  <DashboardLayout
    :items="nav"
    space-label="ESPACE ÉLÈVE"
    :subtitle="auth.profile?.classeNom || auth.profile?.classeId || 'Élève'"
    accent="blue"
    root-class="bg-[#F5F8FC] text-slate-900"
    bg-pattern="bg-edu-radial"
  >
    <RouterView />
  </DashboardLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterView } from 'vue-router'
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  Sparkles,
  TrendingUp,
  Users,
  Ticket,
  Archive,
} from 'lucide-vue-next'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const nav = computed(() => [
  { to: '/student', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { to: '/student/cours', label: 'Mes cours', icon: BookOpen },
  { to: '/student/exercices', label: 'Exercices', icon: ClipboardList },
  { to: '/student/tuteur', label: 'Tuteur IA', icon: Sparkles },
  { to: '/student/progression', label: 'Progression', icon: TrendingUp },
  { to: '/student/groupes', label: 'Groupes', icon: Users },
  { to: '/student/tickets', label: 'Mes tickets', icon: Ticket },
  { to: '/student/epreuves', label: "Banque d'épreuves", icon: Archive },
])
</script>
