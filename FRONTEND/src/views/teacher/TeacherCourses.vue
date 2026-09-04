<template>
  <div>
    <header class="mb-6">
      <h1 class="page-title">Gestion des cours</h1>
      <p class="page-sub">Créez des cours et ajoutez des ressources.</p>
    </header>

    <form class="glass-card mb-8 space-y-4 p-5" @submit.prevent="createCourse">
      <h2 class="font-display text-lg font-semibold">Nouveau cours</h2>
      <div class="grid gap-4 md:grid-cols-2">
        <input v-model="form.titre" required class="input-field !pl-4" placeholder="Titre" />
        <input v-model="form.matiere" required class="input-field !pl-4" placeholder="Matière" />
        <select v-model="form.classeId" required class="input-field !pl-4 md:col-span-2">
          <option value="" disabled>Classe</option>
          <option v-for="id in classeIds" :key="id" :value="id">{{ id }}</option>
        </select>
        <textarea
          v-model="form.description"
          rows="3"
          class="input-field !pl-4 md:col-span-2"
          placeholder="Description"
        />
        <input v-model="form.resourceUrl" class="input-field !pl-4" placeholder="URL ressource (optionnel)" />
        <label class="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-white/20 px-4 py-3 text-sm text-white/50">
          <Upload class="h-4 w-4" />
          <span>{{ file ? file.name : 'Upload PDF / image' }}</span>
          <input type="file" class="hidden" accept=".pdf,image/*" @change="onFile" />
        </label>
      </div>
      <button type="submit" class="btn-primary text-sm" :disabled="saving">
        {{ saving ? 'Enregistrement…' : 'Créer le cours' }}
      </button>
      <p v-if="msg" class="text-sm text-emerald-300">{{ msg }}</p>
    </form>

    <h2 class="mb-3 font-display text-lg font-semibold">Mes cours</h2>
    <div v-if="loading" class="py-8 text-center text-white/40">Chargement…</div>
    <ul v-else class="space-y-2">
      <li
        v-for="c in courses"
        :key="c.id"
        class="glass-card flex items-center justify-between p-4 text-sm"
      >
        <div>
          <p class="font-medium">{{ c.titre }}</p>
          <p class="text-xs text-white/40">{{ c.matiere }} · {{ c.classeId }}</p>
        </div>
        <span class="text-white/35">{{ (c.ressources || []).length }} ressource(s)</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import type { Unsubscribe } from 'firebase/firestore'
import type { Course } from '@/types/models'
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { Upload } from 'lucide-vue-next'
import { db, storage } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { nowTimestamp } from '@/utils/scoring'

const auth = useAuthStore()
const courses = ref<Course[]>([])
const loading = ref(true)
const saving = ref(false)
const msg = ref('')
const file = ref<File | null>(null)
let unsub: Unsubscribe | null = null

const form = reactive({
  titre: '',
  matiere: '',
  description: '',
  classeId: '',
  resourceUrl: '',
})

const classeIds = computed((): string[] => {
  const p = auth.profile
  if (!p) return []
  return p.classeIds || (p.classeId ? [p.classeId] : [])
})

onMounted(() => {
  const q = query(collection(db, 'courses'), where('enseignantId', '==', auth.user!.uid))
  unsub = onSnapshot(q, (snap) => {
    courses.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Course))
    loading.value = false
  })
  if (classeIds.value.length && !form.classeId) form.classeId = classeIds.value[0]
})

onUnmounted(() => unsub?.())

function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  file.value = input.files?.[0] || null
}

async function createCourse() {
  if (!auth.user) return
  saving.value = true
  msg.value = ''
  try {
    const ressources: { titre: string; url: string }[] = []
    if (form.resourceUrl) {
      ressources.push({ titre: 'Lien', url: form.resourceUrl })
    }
    if (file.value) {
      const path = `courses/${auth.user.uid}/${Date.now()}_${file.value.name}`
      const sRef = storageRef(storage, path)
      await uploadBytes(sRef, file.value)
      const url = await getDownloadURL(sRef)
      ressources.push({ titre: file.value.name, url })
    }

    await addDoc(collection(db, 'courses'), {
      titre: form.titre,
      matiere: form.matiere,
      description: form.description,
      classeId: form.classeId,
      enseignantId: auth.user.uid,
      enseignantNom: auth.displayName,
      ressources,
      createdAt: nowTimestamp(),
    })

    form.titre = ''
    form.matiere = ''
    form.description = ''
    form.resourceUrl = ''
    file.value = null
    msg.value = 'Cours créé avec succès.'
  } catch (e) {
    console.error(e)
    msg.value = 'Erreur lors de la création.'
  } finally {
    saving.value = false
  }
}
</script>
