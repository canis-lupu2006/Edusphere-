<template>
  <div>
    <header class="mb-6">
      <h1 class="page-title flex items-center gap-2">
        <Sparkles class="h-7 w-7 text-blue-400" /> Tuteur IA
      </h1>
      <p class="page-sub">
        Contextualisé à ton chapitre en cours. Il privilégie les indices et le raisonnement.
      </p>
    </header>
    <TutorChat />
  </div>
</template>

<script setup lang="ts">
import { Sparkles } from 'lucide-vue-next'
import TutorChat from '@/components/TutorChat.vue'
</script>
