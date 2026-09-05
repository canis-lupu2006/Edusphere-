<template>
  <DashboardLayout
    :items="nav"
    space-label="ADMINISTRATION"
    subtitle="Administratrice"
    accent="green"
    root-class="bg-[#F3F7F5] text-slate-900"
    bg-pattern="bg-edu-radial-admin"
  >
    <RouterView />
  </DashboardLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterView } from 'vue-router'
import {
  LayoutDashboard,
  Users,
  Calendar,
  BarChart3,
  Shield,
} from 'lucide-vue-next'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'

const nav = computed(() => [
  { to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { to: '/admin/users', label: 'Élèves & enseignants', icon: Users },
  { to: '/admin/emploi-du-temps', label: 'Emploi du temps', icon: Calendar },
  { to: '/admin/statistiques', label: 'Statistiques', icon: BarChart3 },
  { to: '/admin/supervision', label: 'Supervision', icon: Shield },
])
</script>
