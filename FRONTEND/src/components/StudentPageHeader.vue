<template>
  <header class="mb-6 flex flex-wrap items-start justify-between gap-4">
    <div class="min-w-0 flex-1">
      <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-blue-600">
        ESPACE ÉLÈVE
      </p>
      <h1 class="page-title flex flex-wrap items-center gap-2">
        <slot name="title">{{ title }}</slot>
      </h1>
      <p v-if="subtitle" class="page-sub">{{ subtitle }}</p>
    </div>
    <div class="flex shrink-0 flex-wrap items-center gap-3">
      <slot name="actions" />
      <button
        v-if="showBell"
        type="button"
        class="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition hover:bg-slate-50"
        aria-label="Notifications"
      >
        <Bell class="h-5 w-5" />
        <span
          class="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
        >
          {{ bellCount }}
        </span>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Bell } from 'lucide-vue-next'

withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    showBell?: boolean
    bellCount?: number
  }>(),
  {
    title: '',
    subtitle: '',
    showBell: true,
    bellCount: 2,
  },
)
</script>
