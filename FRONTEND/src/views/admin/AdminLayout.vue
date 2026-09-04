<template>
  <DashboardLayout
    :items="nav"
    space-label="Administration"
    subtitle="Administrateur"
    accent="green"
  >
    <RouterView />
  </DashboardLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterView } from 'vue-router'
import { LayoutDashboard, Users, School } from 'lucide-vue-next'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'

const nav = computed(() => [
  { to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { to: '/admin/users', label: 'Utilisateurs', icon: Users },
  { to: '/admin/classes', label: 'Classes', icon: School },
])
</script>
