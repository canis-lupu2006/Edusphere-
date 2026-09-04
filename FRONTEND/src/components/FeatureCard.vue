<template>
  <div class="glass-card rounded-xl p-4">
    <div class="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 text-blue-300">
      <component :is="icon" class="h-4 w-4" />
    </div>
    <h3 class="text-sm font-semibold">{{ title }}</h3>
    <p class="mt-1 text-xs leading-relaxed text-white/45">{{ text }}</p>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  icon: Component
  title: string
  text: string
}>()
</script>
