<template>
  <div>
    <header class="mb-6">
      <h1 class="font-display text-2xl font-semibold text-emerald-900">Établissements</h1>
      <p class="mt-1 text-sm text-emerald-900/50">Liste des écoles connectées à EduSphere.</p>
    </header>

    <div v-if="loading" class="py-12 text-center text-emerald-900/40">Chargement…</div>
    <div v-else-if="!schools.length" class="rounded-2xl bg-white p-10 text-center text-emerald-900/45 shadow-sm">
      Aucun établissement.
    </div>
    <ul v-else class="grid gap-3 sm:grid-cols-2">
      <li
        v-for="s in schools"
        :key="s.id"
        class="rounded-2xl bg-white p-5 shadow-sm"
      >
        <h3 class="font-semibold text-emerald-900">{{ s.nom || s.name }}</h3>
        <p class="mt-1 text-sm text-emerald-900/55">{{ s.region || s.ville || '—' }}</p>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { School } from '@/types/models'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'

const schools = ref<School[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const snap = await getDocs(collection(db, 'ecoles'))
    schools.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as School))
  } finally {
    loading.value = false
  }
})
</script>
