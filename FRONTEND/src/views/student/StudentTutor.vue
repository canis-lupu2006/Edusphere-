<template>
  <div>
    <StudentPageHeader
      subtitle="Contextualisé à ton chapitre en cours. Il privilégie les indices et le raisonnement plutôt que la réponse directe."
    >
      <template #title>
        Tuteur IA
        <Sparkles class="h-6 w-6 text-blue-600" />
      </template>
    </StudentPageHeader>

    <div class="grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside class="glass-card p-4">
        <h2 class="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Clock class="h-4 w-4 text-blue-600" />
          Historiques
        </h2>
        <ul class="space-y-2">
          <li v-for="s in sessions" :key="s.id">
            <button
              type="button"
              class="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50/50"
              :class="selectedId === s.id ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-200' : ''"
              @click="selectedId = s.id"
            >
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                :class="s.iconClass"
              >
                {{ s.icon }}
              </div>
              <span class="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{{ s.titre }}</span>
              <ChevronRight class="h-4 w-4 shrink-0 text-slate-400" />
            </button>
          </li>
        </ul>
        <p v-if="!sessions.length" class="text-xs text-slate-400">Aucune session pour l'instant.</p>
      </aside>

      <TutorChat />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore'
import { Sparkles, Clock, ChevronRight } from 'lucide-vue-next'
import TutorChat from '@/components/TutorChat.vue'
import StudentPageHeader from '@/components/StudentPageHeader.vue'
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
    iconClass: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'seed-2',
    titre: 'Probabilités conditionnelles',
    icon: 'P',
    iconClass: 'bg-indigo-100 text-indigo-700',
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
          iconClass: i % 2 === 0 ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700',
        }
      })
    } else {
      sessions.value = seeded
    }
  } catch {
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
              iconClass: i % 2 === 0 ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700',
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
