<template>
  <div class="relative min-h-screen overflow-hidden bg-[#0a0f1e]">
    <!-- Motifs scientifiques décoratifs -->
    <div class="pointer-events-none absolute inset-0 opacity-[0.14]" aria-hidden="true">
      <svg class="absolute left-[8%] top-[18%] h-40 w-40 text-blue-400" viewBox="0 0 100 100" fill="none" stroke="currentColor">
        <circle cx="50" cy="50" r="8" />
        <ellipse cx="50" cy="50" rx="28" ry="10" transform="rotate(0 50 50)" />
        <ellipse cx="50" cy="50" rx="28" ry="10" transform="rotate(60 50 50)" />
        <ellipse cx="50" cy="50" rx="28" ry="10" transform="rotate(120 50 50)" />
      </svg>
      <svg class="absolute right-[12%] top-[12%] h-28 w-28 text-violet-400" viewBox="0 0 80 80" fill="none" stroke="currentColor">
        <circle cx="20" cy="40" r="6" /><circle cx="50" cy="20" r="6" /><circle cx="55" cy="55" r="6" />
        <path d="M20 40 L50 20 L55 55 Z" />
      </svg>
      <p class="absolute bottom-[22%] left-[18%] font-display text-4xl text-blue-300/40">E=mc²</p>
      <p class="absolute right-[28%] top-[40%] font-display text-2xl text-violet-300/30">a²+b²=c²</p>
    </div>
    <div class="absolute inset-0 bg-edu-radial" />

    <div class="relative z-10 mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-12 lg:grid-cols-2 lg:gap-16">
      <!-- Branding gauche -->
      <section class="hidden lg:block">
        <div class="mb-8 flex items-center gap-3">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 shadow-glow">
            <Orbit class="h-6 w-6 text-white" />
          </div>
          <span class="font-display text-2xl font-bold">EduSphere</span>
        </div>
        <span
          class="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-blue-400" />
          EduOS · Système d'exploitation éducatif
        </span>
        <h1 class="font-display text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
          L'éducation intelligente, sécurisée et
          <span class="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
            universelle
          </span>.
        </h1>
        <p class="mt-5 max-w-md text-base leading-relaxed text-white/55">
          EduSphere connecte élèves, enseignants, parents et institutions dans un espace
          collaboratif, sécurisé et propulsé par l'IA.
        </p>

        <div class="mt-10 grid grid-cols-2 gap-4">
          <FeatureCard
            v-for="f in features"
            :key="f.title"
            :icon="f.icon"
            :title="f.title"
            :text="f.text"
          />
        </div>
      </section>

      <!-- Formulaire -->
      <section class="mx-auto w-full max-w-md">
        <LoginForm />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Orbit, Shield, Brain, Users, Globe } from 'lucide-vue-next'
import LoginForm from '@/components/LoginForm.vue'
import FeatureCard from '@/components/FeatureCard.vue'

const features = [
  { icon: Shield, title: 'Sécurisé', text: 'Vos données sont chiffrées et protégées.' },
  { icon: Brain, title: 'Intelligent', text: 'IA au service de votre réussite.' },
  { icon: Users, title: 'Collaboratif', text: 'Apprendre et partager sans limites.' },
  { icon: Globe, title: 'Accessible', text: 'Partout, tout le temps, sur tous vos appareils.' },
]
</script>
