<template>
  <div class="stat-card">
    <div class="mb-3 flex items-start justify-between">
      <div
        class="flex h-9 w-9 items-center justify-center rounded-lg"
        :class="iconBg"
      >
        <component :is="icon" class="h-4 w-4" :class="iconColor" />
      </div>
      <slot name="badge" />
    </div>
    <p class="text-xs uppercase tracking-wide text-white/45">{{ label }}</p>
    <p class="mt-1 font-display text-2xl font-bold">{{ value }}</p>
    <p v-if="hint" class="mt-1 text-xs text-white/40">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

withDefaults(
  defineProps<{
    label?: string
    value?: string | number
    hint?: string
    icon: Component
    iconBg?: string
    iconColor?: string
  }>(),
  {
    iconBg: 'bg-blue-500/15',
    iconColor: 'text-blue-300',
  },
)
</script>
