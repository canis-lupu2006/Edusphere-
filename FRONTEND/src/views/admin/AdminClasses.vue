<template>
  <div>
    <header class="mb-6">
      <h1 class="page-title">Classes</h1>
      <p class="page-sub">Créer des classes et assigner enseignants / élèves.</p>
    </header>

    <form class="glass-card mb-8 space-y-3 p-5" @submit.prevent="createClass">
      <h2 class="font-display font-semibold">Nouvelle classe</h2>
      <input v-model="form.nom" required class="input-field !pl-4" placeholder="Nom (ex: Terminale D)" />
      <input v-model="form.niveau" class="input-field !pl-4" placeholder="Niveau" />
      <button type="submit" class="btn-primary text-sm">Créer</button>
    </form>

    <ul class="space-y-4">
      <li v-for="c in classes" :key="c.id" class="glass-card p-5">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="font-display text-lg font-semibold">{{ c.nom }}</h3>
          <span class="text-xs text-white/40">{{ c.niveau }}</span>
        </div>
        <div class="grid gap-3 md:grid-cols-2">
          <div>
            <label class="mb-1 block text-xs text-white/45">Enseignants (IDs, séparés par virgule)</label>
            <input
              :value="(c.enseignantIds || []).join(',')"
              class="input-field !pl-4 text-xs"
              @change="onFieldChange(c, 'enseignantIds', $event)"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs text-white/45">Élèves (IDs, séparés par virgule)</label>
            <input
              :value="(c.eleveIds || []).join(',')"
              class="input-field !pl-4 text-xs"
              @change="onFieldChange(c, 'eleveIds', $event)"
            />
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { collection, onSnapshot, addDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { nowTimestamp } from '@/utils/scoring'
import type { ClassRecord } from '@/types/models'

const auth = useAuthStore()
const classes = ref<ClassRecord[]>([])
const form = reactive({ nom: '', niveau: '' })

onMounted(() => {
  onSnapshot(collection(db, 'classes'), (snap) => {
    classes.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ClassRecord)
  })
})

async function createClass() {
  await addDoc(collection(db, 'classes'), {
    nom: form.nom,
    niveau: form.niveau,
    ecoleId: auth.profile?.ecoleId || null,
    enseignantIds: [],
    eleveIds: [],
    createdAt: nowTimestamp(),
  })
  form.nom = ''
  form.niveau = ''
}

function onFieldChange(c: ClassRecord, field: 'enseignantIds' | 'eleveIds', event: Event) {
  const target = event.target as HTMLInputElement
  void saveField(c, field, target.value)
}

async function saveField(c: ClassRecord, field: 'enseignantIds' | 'eleveIds', raw: string) {
  const arr = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  await updateDoc(doc(db, 'classes', c.id), { [field]: arr })
}
</script>
