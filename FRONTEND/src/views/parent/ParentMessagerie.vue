<template>
  <div>
    <header class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="font-display text-2xl font-semibold text-[#1a3d32] md:text-3xl">Messagerie</h1>
        <p class="mt-1 text-sm text-[#1a3d32]/55">
          Échanges avec l'équipe pédagogique et l'établissement.
        </p>
        <p class="mt-2 flex items-center gap-1.5 text-xs text-[#1a3d32]/50">
          <Heart class="h-3.5 w-3.5 text-[#E98A76]" />
          Les échanges restent centrés sur le suivi pédagogique de votre enfant.
        </p>
      </div>
      <ChildSelector />
    </header>

    <div class="grid gap-5 lg:grid-cols-2">
      <section class="rounded-2xl border border-[#1a5c45]/10 bg-white p-5 shadow-sm md:p-6">
        <div class="mb-4 flex items-start gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-600">
            <GraduationCap class="h-5 w-5" />
          </div>
          <div>
            <h2 class="font-display text-lg font-semibold">Enseignants</h2>
            <p class="text-xs text-[#1a3d32]/50">Messages de l'équipe pédagogique</p>
          </div>
        </div>

        <ul v-if="enseignantMessages.length" class="space-y-3">
          <li
            v-for="m in enseignantMessages"
            :key="m.id"
            class="cursor-pointer rounded-2xl border border-[#1a5c45]/08 bg-[#F7F3EB]/60 px-4 py-3 transition hover:bg-[#F7F3EB]"
            @click="markRead(m)"
          >
            <div class="mb-2 flex items-start justify-between gap-2">
              <div class="flex min-w-0 items-center gap-2.5">
                <div
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ebe4d6] text-[10px] font-bold text-[#1a3d32]"
                >
                  {{ initials(m.fromNom) }}
                </div>
                <p class="truncate text-sm font-medium text-[#1a3d32]">
                  {{ m.fromNom || 'Enseignant' }}
                  <span v-if="m.sujet" class="font-normal text-[#1a3d32]/55"> — {{ m.sujet }}</span>
                </p>
              </div>
              <span
                class="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                :class="m.lu ? 'bg-[#E98A76]/15 text-[#c45c4a]' : 'bg-[#E98A76] text-white'"
              >
                {{ m.lu ? 'Lu' : 'Non lu' }}
              </span>
            </div>
            <p class="text-sm text-[#1a3d32]/70">{{ m.preview || '—' }}</p>
          </li>
        </ul>
        <p v-else class="py-8 text-center text-sm text-[#1a3d32]/45">
          Aucun message enseignant.
        </p>
      </section>

      <section class="rounded-2xl border border-[#1a5c45]/10 bg-white p-5 shadow-sm md:p-6">
        <div class="mb-4 flex items-start gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a5c45]/12 text-[#1a5c45]">
            <Building2 class="h-5 w-5" />
          </div>
          <div>
            <h2 class="font-display text-lg font-semibold">Administration</h2>
            <p class="text-xs text-[#1a3d32]/50">Informations de l'établissement</p>
          </div>
        </div>

        <ul v-if="adminMessages.length" class="space-y-3">
          <li
            v-for="m in adminMessages"
            :key="m.id"
            class="cursor-pointer rounded-2xl border border-[#1a5c45]/08 bg-[#F7F3EB]/60 px-4 py-3 transition hover:bg-[#F7F3EB]"
            @click="markRead(m)"
          >
            <div class="mb-2 flex items-start justify-between gap-2">
              <div class="flex min-w-0 items-center gap-2.5">
                <div
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1a5c45]/12 text-[#1a5c45]"
                >
                  <Bell class="h-4 w-4" />
                </div>
                <p class="truncate text-sm font-medium text-[#1a3d32]">
                  {{ m.fromNom || m.sujet || 'Administration' }}
                </p>
              </div>
              <span
                class="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                :class="m.lu ? 'bg-[#E98A76]/15 text-[#c45c4a]' : 'bg-[#E98A76] text-white'"
              >
                {{ m.lu ? 'Lu' : 'Non lu' }}
              </span>
            </div>
            <p class="text-sm text-[#1a3d32]/70">{{ m.preview || m.sujet || '—' }}</p>
          </li>
        </ul>
        <p v-else class="py-8 text-center text-sm text-[#1a3d32]/45">
          Aucun message administration.
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Heart, GraduationCap, Building2, Bell } from 'lucide-vue-next'
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import type { MessageThread } from '@/types/models'
import ChildSelector from './ChildSelector.vue'

const auth = useAuthStore()
const messages = ref<MessageThread[]>([])
let unsub: Unsubscribe | null = null

const enseignantMessages = computed(() =>
  messages.value.filter((m) => (m.type || 'enseignant') === 'enseignant'),
)
const adminMessages = computed(() =>
  messages.value.filter((m) => m.type === 'administration'),
)

function initials(name?: string) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

async function markRead(m: MessageThread) {
  if (m.lu) return
  try {
    await updateDoc(doc(db, 'messages', m.id), { lu: true })
  } catch (e) {
    console.error('Impossible de marquer le message comme lu:', e)
  }
}

onMounted(() => {
  const uid = auth.user?.uid
  if (!uid) return
  unsub = onSnapshot(
    query(collection(db, 'messages'), where('toId', '==', uid)),
    (snap) => {
      messages.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as MessageThread))
    },
  )
})

onUnmounted(() => unsub?.())
</script>
