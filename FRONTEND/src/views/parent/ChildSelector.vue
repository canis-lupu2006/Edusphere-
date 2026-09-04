<template>
  <div v-if="enfants.length" data-child-selector class="relative">
    <button
      type="button"
      class="flex items-center gap-3 rounded-full border border-[#1a5c45]/15 bg-white py-1.5 pl-1.5 pr-3 shadow-sm transition hover:border-[#1a5c45]/30"
      @click.stop="open = !open"
    >
      <div
        class="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a5c45]/15 text-xs font-bold text-[#1a5c45]"
      >
        {{ initials }}
      </div>
      <div class="text-left">
        <p class="text-sm font-medium leading-tight text-[#1a3d32]">{{ name }}</p>
        <p v-if="classe" class="text-[11px] text-[#1a3d32]/50">{{ classe }}</p>
      </div>
      <ChevronDown class="h-4 w-4 text-[#1a3d32]/40" />
    </button>

    <div
      v-if="open && enfants.length > 1"
      class="absolute right-0 z-20 mt-2 min-w-[200px] overflow-hidden rounded-2xl border border-[#1a5c45]/10 bg-white py-1 shadow-lg"
    >
      <button
        v-for="e in enfants"
        :key="e.uid"
        type="button"
        class="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-[#F7F3EB]"
        :class="{ 'bg-[#ebe4d6]': e.uid === selectedChildId }"
        @click="select(e.uid)"
      >
        <div
          class="flex h-7 w-7 items-center justify-center rounded-full bg-[#1a5c45]/12 text-[10px] font-bold text-[#1a5c45]"
        >
          {{ childInitials(e) }}
        </div>
        <div>
          <p class="font-medium">{{ e.displayName || e.nom || e.uid }}</p>
          <p v-if="e.classeNom" class="text-[11px] text-[#1a3d32]/50">{{ e.classeNom }}</p>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref, type Ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import type { UserProfile } from '@/types/models'

const enfants = inject<Ref<UserProfile[]>>('enfants', ref([]))
const selectedChildId = inject<Ref<string>>('selectedChildId', ref(''))
const selectedChild = inject<Ref<UserProfile | null>>('selectedChild', ref(null))
const setSelectedChild = inject<(id: string) => void>('setSelectedChild', () => {})

const open = ref(false)

const name = computed(
  () => selectedChild.value?.displayName || selectedChild.value?.nom || 'Enfant',
)
const classe = computed(() => selectedChild.value?.classeNom || '')
const initials = computed(() => childInitials(selectedChild.value))

function childInitials(e: UserProfile | null | undefined) {
  const n = e?.displayName || e?.nom || '?'
  return n
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function select(id: string) {
  setSelectedChild(id)
  open.value = false
}

function onDocClick(ev: MouseEvent) {
  const t = ev.target as HTMLElement
  if (!t.closest?.('[data-child-selector]')) open.value = false
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
})
onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
})
</script>
