<template>
  <div class="flex h-screen overflow-hidden" :class="rootClass">
    <AppSidebar
      :items="items"
      :space-label="spaceLabel"
      :subtitle="subtitle"
      :accent="accent"
      :logo-icon="logoIcon"
      :aside-class="asideClass"
    />
    <main class="relative min-h-0 flex-1 overflow-y-auto">
      <div
        class="pointer-events-none absolute inset-0 opacity-100"
        :class="bgPattern"
        aria-hidden="true"
      />
      <div class="relative z-10 mx-auto max-w-7xl px-6 py-6 md:px-8">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import AppSidebar from './AppSidebar.vue'
import type { NavItem } from '@/types/models'

withDefaults(
  defineProps<{
    items: NavItem[]
    spaceLabel?: string
    subtitle?: string
    accent?: string
    logoIcon?: Component
    rootClass?: string
    asideClass?: string
    bgPattern?: string
  }>(),
  {
    spaceLabel: '',
    subtitle: '',
    accent: 'blue',
    rootClass: 'bg-[#F5F8FC] text-slate-900',
    asideClass: '',
    bgPattern: 'bg-edu-radial',
  },
)
</script>
