<template>
  <div>
    <div v-if="loading" class="py-10 text-center text-slate-400">Chargement…</div>
    <div v-else-if="!tickets.length" class="glass-card py-10 text-center text-slate-400">
      Aucun ticket pour le moment.
    </div>
    <ul v-else class="space-y-3">
      <li
        v-for="t in tickets"
        :key="t.id"
        class="glass-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="min-w-0">
          <div class="mb-1 flex flex-wrap items-center gap-2">
            <span
              class="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
              :class="statusClass(t.status)"
            >
              {{ t.status || 'ouvert' }}
            </span>
            <span v-if="t.courseTitre || t.courseId" class="text-xs text-slate-400">
              {{ t.courseTitre || t.courseId }}
            </span>
          </div>
          <p class="font-medium">{{ t.eleveNom || t.eleveId || 'Élève' }}</p>
          <p class="mt-1 text-sm text-slate-500">{{ t.message }}</p>
        </div>
        <div class="flex shrink-0 gap-2">
          <slot name="actions" :ticket="t">
            <button
              v-if="resolvable && t.status !== 'resolu'"
              type="button"
              class="btn-secondary text-sm"
              @click="$emit('resolve', t)"
            >
              Marquer résolu
            </button>
          </slot>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { Ticket, TicketStatus } from '@/types/models'

withDefaults(
  defineProps<{
    tickets?: Ticket[]
    loading?: boolean
    resolvable?: boolean
  }>(),
  {
    tickets: () => [],
    loading: false,
    resolvable: false,
  },
)

defineEmits<{
  resolve: [ticket: Ticket]
}>()

function statusClass(status?: TicketStatus) {
  if (status === 'resolu') return 'bg-emerald-100 text-emerald-700'
  if (status === 'en_cours') return 'bg-amber-100 text-amber-700'
  return 'bg-blue-100 text-blue-700'
}
</script>
