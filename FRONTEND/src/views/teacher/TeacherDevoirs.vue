<template>
  <div>
    <header class="mb-6">
      <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-violet-300">
        PROFESSEUR
      </p>
      <h1 class="page-title">Devoirs & Évaluations</h1>
      <p class="page-sub">Créez et suivez les devoirs de vos classes.</p>
    </header>

    <form class="glass-card mb-6 space-y-4 p-5" @submit.prevent="createHomework">
      <h2 class="font-display text-lg font-semibold">Nouveau devoir</h2>
      <div class="grid gap-4 md:grid-cols-2">
        <input v-model="form.titre" required class="input-field !pl-4" placeholder="Titre" />
        <input v-model="form.matiere" required class="input-field !pl-4" placeholder="Matière" />
        <select v-model="form.classeId" required class="input-field !pl-4">
          <option value="" disabled>Classe</option>
          <option v-for="id in classeIds" :key="id" :value="id">{{ id }}</option>
        </select>
        <input
          v-model="form.echeance"
          required
          class="input-field !pl-4"
          placeholder="Échéance (ex. 15/09/2026)"
        />
      </div>
      <button type="submit" class="btn-primary text-sm" :disabled="saving">
        {{ saving ? 'Enregistrement…' : 'Créer le devoir' }}
      </button>
      <p v-if="msg" class="text-sm text-emerald-300">{{ msg }}</p>
    </form>

    <div class="glass-card overflow-hidden">
      <div class="border-b border-white/5 px-5 py-4">
        <h2 class="font-display text-lg font-semibold">Mes devoirs</h2>
      </div>
      <div v-if="loading" class="p-8 text-center text-white/40">Chargement…</div>
      <div v-else-if="!items.length" class="p-8 text-center text-white/40">
        Aucun devoir pour le moment.
      </div>
      <ul v-else class="divide-y divide-white/5">
        <li
          v-for="h in items"
          :key="h.id"
          class="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm"
        >
          <div>
            <p class="font-medium">{{ h.titre }}</p>
            <p class="text-xs text-white/40">
              {{ h.matiere }} · {{ h.classeId }} · échéance {{ h.echeance }}
            </p>
          </div>
          <span
            class="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-xs font-semibold text-blue-300"
          >
            {{ h.status || 'a_faire' }}
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import type { Unsubscribe } from 'firebase/firestore'
import type { Homework } from '@/types/models'
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { nowTimestamp } from '@/utils/scoring'

const auth = useAuthStore()
const items = ref<Homework[]>([])
const loading = ref(true)
const saving = ref(false)
const msg = ref('')
let unsub: Unsubscribe | null = null

const form = reactive({
  titre: '',
  matiere: '',
  classeId: '',
  echeance: '',
})

const classeIds = computed((): string[] => {
  const p = auth.profile
  if (!p) return []
  return p.classeIds || (p.classeId ? [p.classeId] : [])
})

onMounted(() => {
  const uid = auth.user?.uid
  if (!uid) {
    loading.value = false
    return
  }
  if (classeIds.value.length && !form.classeId) form.classeId = classeIds.value[0]

  const q = query(collection(db, 'homework'), where('enseignantId', '==', uid))
  unsub = onSnapshot(q, (snap) => {
    items.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Homework))
    loading.value = false
  })
})

onUnmounted(() => unsub?.())

async function createHomework() {
  if (!auth.user) return
  saving.value = true
  msg.value = ''
  try {
    await addDoc(collection(db, 'homework'), {
      titre: form.titre,
      matiere: form.matiere,
      classeId: form.classeId,
      echeance: form.echeance,
      status: 'a_faire',
      enseignantId: auth.user.uid,
      createdAt: nowTimestamp(),
    })
    form.titre = ''
    form.echeance = ''
    msg.value = 'Devoir créé.'
  } catch {
    msg.value = 'Échec de la création.'
  } finally {
    saving.value = false
  }
}
</script>
