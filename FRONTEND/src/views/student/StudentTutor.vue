<template>
  <div>
    <header class="mb-6 flex items-start justify-between gap-4">
      <div>
        <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-blue-400">
          ESPACE ÉLÈVE
        </p>
        <h1 class="page-title flex items-center gap-2">
          Tuteur IA
          <Sparkles class="h-6 w-6 text-blue-400" />
        </h1>
        <p class="page-sub">
          Contextualisé à ton chapitre en cours. Il privilégie les indices et le raisonnement plutôt
          que la réponse directe.
        </p>
      </div>
      <button
        type="button"
        class="relative rounded-xl border border-white/10 bg-white/5 p-2.5 text-white/70 transition hover:bg-white/10"
        aria-label="Notifications"
      >
        <Bell class="h-5 w-5" />
        <span
          class="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
        >
          2
        </span>
      </button>
    </header>

    <div class="grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside class="glass-card p-4">
        <h2 class="mb-4 flex items-center gap-2 text-sm font-semibold text-white/80">
          <Clock class="h-4 w-4 text-blue-300" />
          Historiques
        </h2>
        <ul class="space-y-2">
          <li v-for="s in sessions" :key="s.id">
            <button
              type="button"
              class="flex w-full items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-3 text-left transition hover:border-white/15 hover:bg-white/[0.06]"
              :class="selectedId === s.id ? 'border-blue-500/40 bg-blue-500/10' : ''"
              @click="selectedId = s.id"
            >
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                :class="s.iconClass"
              >
                {{ s.icon }}
              </div>
              <span class="min-w-0 flex-1 truncate text-sm font-medium">{{ s.titre }}</span>
              <ChevronRight class="h-4 w-4 shrink-0 text-white/30" />
            </button>
          </li>
        </ul>
        <p v-if="!sessions.length" class="text-xs text-white/40">Aucune session pour l'instant.</p>
      </aside>

      <TutorChat />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore'
import { Bell, Sparkles, Clock, ChevronRight } from 'lucide-vue-next'
import TutorChat from '@/components/TutorChat.vue'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import type { TutorSession } from '@/types/models'

interface SessionItem {
  id: string
  titre: string
  icon: string
  iconClass: string
}

const auth = useAuthStore()
const sessions = ref<SessionItem[]>([])
const selectedId = ref('')

const seeded: SessionItem[] = [
  {
    id: 'seed-1',
    titre: 'Fonctions et dérivées',
    icon: "f'",
    iconClass: 'bg-violet-500/20 text-violet-300',
  },
  {
    id: 'seed-2',
    titre: 'Probabilités conditionnelles',
    icon: 'P',
    iconClass: 'bg-blue-500/20 text-blue-300',
  },
]

onMounted(async () => {
  const uid = auth.user?.uid
  if (!uid) {
    sessions.value = seeded
    selectedId.value = seeded[0]?.id || ''
    return
  }

  try {
    const q = query(
      collection(db, 'tutor_sessions'),
      where('eleveId', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(10),
    )
    const snap = await getDocs(q)
    if (snap.size) {
      sessions.value = snap.docs.map((d, i) => {
        const data = { id: d.id, ...d.data() } as TutorSession
        return {
          id: data.id,
          titre: data.titre || data.notion || data.matiere || 'Session',
          icon: data.icon || (i % 2 === 0 ? "f'" : 'P'),
          iconClass:
            i % 2 === 0
              ? 'bg-violet-500/20 text-violet-300'
              : 'bg-blue-500/20 text-blue-300',
        }
      })
    } else {
      sessions.value = seeded
    }
  } catch {
    // Fallback sans orderBy / collection absente
    try {
      const q2 = query(collection(db, 'tutor_sessions'), where('eleveId', '==', uid), limit(10))
      const snap = await getDocs(q2)
      sessions.value = snap.size
        ? snap.docs.map((d, i) => {
            const data = { id: d.id, ...d.data() } as TutorSession
            return {
              id: data.id,
              titre: data.titre || data.notion || 'Session',
              icon: data.icon || (i % 2 === 0 ? "f'" : 'P'),
              iconClass:
                i % 2 === 0
                  ? 'bg-violet-500/20 text-violet-300'
                  : 'bg-blue-500/20 text-blue-300',
            }
          })
        : seeded
    } catch {
      sessions.value = seeded
    }
  }
  selectedId.value = sessions.value[0]?.id || ''
})
</script>
