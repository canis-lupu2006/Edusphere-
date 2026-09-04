<template>
  <div>
    <header class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="font-display text-2xl font-semibold text-[#1a3d32] md:text-3xl">
          Evolution par matière
        </h1>
        <p class="mt-1 text-sm text-[#1a3d32]/55">
          Suivez les progrès de votre enfant dans chaque matière au fil du temps.
        </p>
      </div>
      <ChildSelector />
    </header>

    <section class="rounded-2xl border border-[#1a5c45]/10 bg-white p-5 shadow-sm md:p-6">
      <div class="mb-5 flex items-center gap-2">
        <TrendingUp class="h-4 w-4 text-[#1a5c45]" />
        <h2 class="font-display text-lg font-semibold">Progression par matière</h2>
      </div>

      <ul v-if="rows.length" class="space-y-4">
        <li
          v-for="row in rows"
          :key="row.id"
          class="flex flex-wrap items-center gap-3 rounded-2xl border border-[#1a5c45]/08 px-4 py-3 md:gap-4"
        >
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            :style="{ background: row.tint, color: row.color }"
          >
            {{ row.letter }}
          </div>
          <div class="min-w-[7rem] shrink-0">
            <p class="text-sm font-medium text-[#1a3d32]">{{ row.matiere }}</p>
          </div>
          <div class="min-w-[140px] flex-1">
            <div class="h-2.5 overflow-hidden rounded-full" :style="{ background: row.tint }">
              <div
                class="h-full rounded-full transition-all"
                :style="{ width: `${row.percent}%`, background: row.color }"
              />
            </div>
          </div>
          <span class="w-12 text-right text-sm font-semibold text-[#1a3d32]">{{ row.percent }}%</span>
          <span
            class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            :class="row.trendClass"
          >
            <component :is="row.trendIcon" class="h-3 w-3" />
            {{ row.trendLabel }}
          </span>
        </li>
      </ul>
      <p v-else class="py-10 text-center text-sm text-[#1a3d32]/45">
        Aucune progression enregistrée pour cet enfant.
      </p>

      <div
        class="mt-6 flex flex-wrap items-center gap-3 rounded-2xl bg-[#F7F3EB] px-4 py-4"
      >
        <div class="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-violet-600">
          <Heart class="h-4 w-4" />
        </div>
        <div>
          <p class="font-display text-sm font-semibold text-[#1a3d32]">Nous avançons ensemble.</p>
          <p class="text-xs text-[#1a3d32]/55">
            Ces indicateurs vous aident à suivre la progression globale, sans surcharge de détails.
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onUnmounted, ref, watch, type Ref, type Component } from 'vue'
import { TrendingUp, TrendingDown, Minus, Heart } from 'lucide-vue-next'
import { collection, onSnapshot, query, where, type Unsubscribe } from 'firebase/firestore'
import { db } from '@/firebase'
import type { ProgressRecord, UserProfile } from '@/types/models'
import ChildSelector from './ChildSelector.vue'

const selectedChild = inject<Ref<UserProfile | null>>('selectedChild', ref(null))
const progress = ref<ProgressRecord[]>([])
let unsub: Unsubscribe | null = null

const palette = [
  { color: '#1a5c45', tint: 'rgba(26,92,69,0.12)' },
  { color: '#E98A76', tint: 'rgba(233,138,118,0.15)' },
  { color: '#5b8a6e', tint: 'rgba(91,138,110,0.15)' },
  { color: '#7c6bb0', tint: 'rgba(124,107,176,0.15)' },
  { color: '#c9a227', tint: 'rgba(201,162,39,0.18)' },
]

const rows = computed(() =>
  progress.value.map((p, i) => {
    const percent = Math.round(Number(p.percent ?? p.maitrise) || 0)
    const prev = Number(p.previousPercent)
    const delta = Number.isFinite(prev) ? percent - prev : 0
    const matiere = p.matiere || p.courseTitre || 'Matière'
    const theme = palette[i % palette.length]
    let trendIcon: Component = Minus
    let trendClass = 'bg-[#ebe4d6] text-[#1a3d32]/60'
    let trendLabel = '0% vs. mois dernier'
    if (delta > 0) {
      trendIcon = TrendingUp
      trendClass = 'bg-[#1a5c45]/12 text-[#1a5c45]'
      trendLabel = `+${delta}% vs. mois dernier`
    } else if (delta < 0) {
      trendIcon = TrendingDown
      trendClass = 'bg-[#E98A76]/15 text-[#c45c4a]'
      trendLabel = `${delta}% vs. mois dernier`
    }
    return {
      id: p.id,
      matiere,
      letter: matiere.charAt(0).toUpperCase(),
      percent,
      color: theme.color,
      tint: theme.tint,
      trendIcon,
      trendClass,
      trendLabel,
    }
  }),
)

watch(
  () => selectedChild.value?.uid,
  (id) => {
    unsub?.()
    unsub = null
    progress.value = []
    if (!id) return
    unsub = onSnapshot(query(collection(db, 'progress'), where('eleveId', '==', id)), (snap) => {
      progress.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ProgressRecord))
    })
  },
  { immediate: true },
)

onUnmounted(() => unsub?.())
</script>
