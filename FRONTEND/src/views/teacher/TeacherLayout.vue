<template>
  <DashboardLayout
    :items="nav"
    space-label="PROFESSEUR"
    :subtitle="'Professeur'"
    accent="purple"
    root-class="bg-[#F7F6FB] text-slate-900"
    bg-pattern="bg-edu-radial-teacher"
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
  GraduationCap,
  Calendar,
  Sparkles,
  ClipboardList,
  MessageSquare,
} from 'lucide-vue-next'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'

const nav = computed(() => [
  { to: '/teacher', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { to: '/teacher/cours', label: 'Mes cours', icon: BookOpen },
  { to: '/teacher/comprehension', label: 'Compréhension', icon: GraduationCap },
  { to: '/teacher/programme', label: 'Programme & Planification', icon: Calendar },
  { to: '/teacher/contenus', label: 'Contenus & Validation IA', icon: Sparkles },
  { to: '/teacher/devoirs', label: 'Devoirs & Évaluations', icon: ClipboardList },
  { to: '/teacher/tickets', label: 'Tickets', icon: MessageSquare },
])
</script>
