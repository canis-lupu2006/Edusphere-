<template>
  <div>
    <header class="mb-6">
      <h1 class="page-title">Mes tickets</h1>
      <p class="page-sub">Tes demandes d'aide envoyées aux enseignants.</p>
    </header>
    <TicketList :tickets="tickets" :loading="loading" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import type { Unsubscribe } from 'firebase/firestore'
import type { Ticket } from '@/types/models'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import TicketList from '@/components/TicketList.vue'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const tickets = ref<Ticket[]>([])
const loading = ref(true)
let unsub: Unsubscribe | null = null

onMounted(() => {
  if (!auth.user) {
    loading.value = false
    return
  }
  const q = query(collection(db, 'tickets'), where('eleveId', '==', auth.user.uid))
  unsub = onSnapshot(q, (snap) => {
    tickets.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Ticket))
    loading.value = false
  })
})

onUnmounted(() => unsub?.())
</script>
