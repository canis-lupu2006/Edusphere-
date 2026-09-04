<template>
  <div>
    <header class="mb-6">
      <h1 class="font-display text-2xl font-semibold">Annonces de l'école</h1>
      <p class="mt-1 text-sm text-[#1a3d32]/55">Informations et communications officielles.</p>
    </header>

    <div v-if="loading" class="py-12 text-center text-[#1a3d32]/40">Chargement…</div>
    <div v-else-if="!announcements.length" class="rounded-2xl bg-white p-10 text-center text-[#1a3d32]/45 shadow-sm">
      Aucune annonce.
    </div>
    <ul v-else class="space-y-3">
      <li
        v-for="a in announcements"
        :key="a.id"
        class="rounded-2xl border border-[#1a5c45]/10 bg-white p-5 shadow-sm"
      >
        <h3 class="font-semibold">{{ a.titre || a.title }}</h3>
        <p class="mt-2 text-sm text-[#1a3d32]/70 whitespace-pre-wrap">{{ a.message || a.contenu }}</p>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import type { Unsubscribe } from 'firebase/firestore'
import type { SchoolAnnouncement } from '@/types/models'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const announcements = ref<SchoolAnnouncement[]>([])
const loading = ref(true)
let unsub: Unsubscribe | null = null

onMounted(() => {
  const ecoleId = auth.profile?.ecoleId
  if (!ecoleId) {
    loading.value = false
    return
  }
  const q = query(collection(db, 'school_announcements'), where('ecoleId', '==', ecoleId))
  unsub = onSnapshot(q, (snap) => {
    announcements.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SchoolAnnouncement))
    loading.value = false
  })
})

onUnmounted(() => unsub?.())
</script>
