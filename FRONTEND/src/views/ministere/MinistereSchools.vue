<template>
  <div>
    <header class="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#166534]/70">
          Ministère
        </p>
        <h1 class="font-display text-2xl font-semibold text-emerald-950">Établissements</h1>
        <p class="mt-1 text-sm text-emerald-900/55">
          {{ filtered.length }} établissement(s) · données Firestore
        </p>
      </div>
      <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
        <div class="relative w-full sm:w-64">
          <Search
            class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-800/40"
          />
          <input
            v-model="filter"
            type="search"
            placeholder="Filtrer par nom, région, ville…"
            class="w-full rounded-xl border border-emerald-900/10 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#166534]/40 focus:ring-2 focus:ring-[#166534]/15"
          />
        </div>
        <button
          type="button"
          class="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#166534] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
          @click="openForm"
        >
          <Plus class="h-4 w-4" />
          Ajouter un établissement
        </button>
      </div>
    </header>

    <div v-if="loading" class="py-12 text-center text-emerald-900/40">Chargement…</div>
    <div
      v-else-if="!filtered.length"
      class="rounded-2xl bg-white p-10 text-center text-emerald-900/45 shadow-sm"
    >
      Aucun établissement trouvé.
    </div>
    <div v-else class="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[40rem] text-left text-sm">
          <thead class="bg-emerald-50/80 text-xs uppercase text-emerald-900/50">
            <tr>
              <th class="px-4 py-3 font-medium">Établissement</th>
              <th class="px-4 py-3 font-medium">Région</th>
              <th class="px-4 py-3 font-medium">Ville</th>
              <th class="px-4 py-3 font-medium">Type</th>
              <th class="px-4 py-3 font-medium">Élèves</th>
              <th class="px-4 py-3 font-medium">Maîtrise</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="s in filtered"
              :key="s.id"
              class="border-t border-emerald-900/5 hover:bg-emerald-50/40"
            >
              <td class="px-4 py-3 font-medium text-emerald-950">{{ s.nom || s.name || '—' }}</td>
              <td class="px-4 py-3 text-emerald-900/65">{{ s.region || '—' }}</td>
              <td class="px-4 py-3 text-emerald-900/65">{{ s.ville || '—' }}</td>
              <td class="px-4 py-3 text-emerald-900/65">{{ s.type || '—' }}</td>
              <td class="px-4 py-3 tabular-nums">{{ s.elevesCount ?? '—' }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <div class="h-1.5 w-20 overflow-hidden rounded-full bg-emerald-100">
                    <div
                      class="h-full rounded-full"
                      :class="barColor(s.maitrise)"
                      :style="{ width: `${Math.min(100, s.maitrise ?? 0)}%` }"
                    />
                  </div>
                  <span class="tabular-nums font-semibold text-[#166534]">
                    {{ s.maitrise ?? 0 }}%
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal ajout -->
    <div
      v-if="showForm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/40 p-4"
      @click.self="closeForm"
    >
      <div class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h2 class="font-display text-lg font-semibold text-emerald-950">
          Nouvel établissement
        </h2>
        <p class="mt-1 text-sm text-emerald-900/50">
          L’établissement et le compte admin seront créés ensemble.
        </p>

        <form class="mt-5 space-y-3" @submit.prevent="submit">
          <label class="block text-sm">
            <span class="mb-1 block text-xs font-medium text-emerald-900/60">Nom *</span>
            <input v-model="form.nom" required type="text" placeholder="Lycée…" class="field" />
          </label>
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="block text-sm">
              <span class="mb-1 block text-xs font-medium text-emerald-900/60">Région *</span>
              <select v-model="form.region" required class="field">
                <option value="" disabled>Choisir</option>
                <option v-for="r in REGIONS" :key="r" :value="r">{{ r }}</option>
              </select>
            </label>
            <label class="block text-sm">
              <span class="mb-1 block text-xs font-medium text-emerald-900/60">Ville *</span>
              <input v-model="form.ville" required type="text" class="field" />
            </label>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="block text-sm">
              <span class="mb-1 block text-xs font-medium text-emerald-900/60">Type *</span>
              <select v-model="form.type" required class="field">
                <option value="" disabled>Choisir</option>
                <option v-for="t in TYPES" :key="t" :value="t">{{ t }}</option>
              </select>
            </label>
            <label class="block text-sm">
              <span class="mb-1 block text-xs font-medium text-emerald-900/60">Niveau</span>
              <select v-model="form.niveau" class="field">
                <option value="Secondaire">Secondaire</option>
                <option value="Primaire">Primaire</option>
                <option value="Technique">Technique</option>
              </select>
            </label>
          </div>
          <div class="grid gap-3 sm:grid-cols-3">
            <label class="block text-sm">
              <span class="mb-1 block text-xs font-medium text-emerald-900/60">Élèves</span>
              <input v-model.number="form.elevesCount" type="number" min="0" class="field" />
            </label>
            <label class="block text-sm">
              <span class="mb-1 block text-xs font-medium text-emerald-900/60">Enseignants</span>
              <input v-model.number="form.enseignantsCount" type="number" min="0" class="field" />
            </label>
            <label class="block text-sm">
              <span class="mb-1 block text-xs font-medium text-emerald-900/60">Maîtrise %</span>
              <input v-model.number="form.maitrise" type="number" min="0" max="100" class="field" />
            </label>
          </div>

          <div class="rounded-xl border border-emerald-900/10 bg-[#f4f7f5] p-3">
            <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-[#166534]">
              Compte administrateur
            </p>
            <div class="space-y-3">
              <label class="block text-sm">
                <span class="mb-1 block text-xs font-medium text-emerald-900/60">Nom admin *</span>
                <input
                  v-model="form.adminNom"
                  required
                  type="text"
                  placeholder="Ex. Sarah Adjowa"
                  class="field !bg-white"
                />
              </label>
              <label class="block text-sm">
                <span class="mb-1 block text-xs font-medium text-emerald-900/60">Email admin *</span>
                <input
                  v-model="form.adminEmail"
                  required
                  type="email"
                  placeholder="admin@lycee.edu.tg"
                  class="field !bg-white"
                />
              </label>
            </div>
          </div>

          <p v-if="formError" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {{ formError }}
          </p>

          <div class="flex justify-end gap-2 pt-2">
            <button type="button" class="btn-ghost" @click="closeForm">Annuler</button>
            <button
              type="submit"
              class="rounded-xl bg-[#166534] px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
              :disabled="saving"
            >
              {{ saving ? 'Création…' : 'Créer école + admin' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Identifiants générés -->
    <div
      v-if="createdCreds"
      class="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/40 p-4"
      @click.self="createdCreds = null"
    >
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 class="font-display text-lg font-semibold text-emerald-950">
          Établissement créé
        </h2>
        <p class="mt-1 text-sm text-emerald-900/55">
          Transmets ces identifiants à l’administrateur de
          <strong class="text-emerald-950">{{ createdCreds.ecoleNom }}</strong>.
          Ils ne seront plus réaffichés.
        </p>
        <div class="mt-4 space-y-2 rounded-xl border border-emerald-900/10 bg-[#f4f7f5] p-4 text-sm">
          <p>
            <span class="text-emerald-900/50">Email</span><br />
            <span class="font-mono font-semibold text-emerald-950">{{ createdCreds.adminEmail }}</span>
          </p>
          <p>
            <span class="text-emerald-900/50">Mot de passe temporaire</span><br />
            <span class="font-mono font-semibold text-emerald-950">{{ createdCreds.tempPassword }}</span>
          </p>
        </div>
        <button
          type="button"
          class="mt-3 w-full rounded-xl border border-emerald-900/15 bg-white py-2.5 text-sm font-medium text-[#166534] hover:bg-emerald-50"
          @click="copyCreds"
        >
          {{ copied ? 'Copié !' : 'Copier email + mot de passe' }}
        </button>
        <button
          type="button"
          class="mt-3 w-full rounded-xl bg-[#166534] py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
          @click="createdCreds = null"
        >
          J’ai noté les identifiants
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, reactive, ref, type Ref } from 'vue'
import { Plus, Search } from 'lucide-vue-next'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'
import { useCloudFunctions, type CreateSchoolResult } from '@/composables/useCloudFunctions'
import type { School } from '@/types/models'

const REGIONS = ['Maritime', 'Plateaux', 'Centrale', 'Kara', 'Savanes']
const TYPES = ['Lycée', 'Collège', 'CEG', 'Lycée technique', 'École primaire']

const { createSchoolWithAdmin } = useCloudFunctions()

const schools = ref<School[]>([])
const loading = ref(true)
const localFilter = ref('')
const ministereSearch = inject<Ref<string>>('ministereSearch', ref(''))
const showForm = ref(false)
const saving = ref(false)
const formError = ref('')
const createdCreds = ref<CreateSchoolResult | null>(null)
const copied = ref(false)

const form = reactive({
  nom: '',
  region: '',
  ville: '',
  type: '',
  niveau: 'Secondaire',
  elevesCount: 0,
  enseignantsCount: 0,
  maitrise: 0,
  adminNom: '',
  adminEmail: '',
})

const filter = computed({
  get: () => localFilter.value || ministereSearch.value,
  set: (v: string) => {
    localFilter.value = v
  },
})

const filtered = computed(() => {
  const q = filter.value.trim().toLowerCase()
  if (!q) return schools.value
  return schools.value.filter((s) => {
    const hay = [s.nom, s.name, s.region, s.ville, s.type].filter(Boolean).join(' ').toLowerCase()
    return hay.includes(q)
  })
})

function barColor(m?: number) {
  const v = m ?? 0
  if (v >= 70) return 'bg-[#166534]'
  if (v >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}

function openForm() {
  formError.value = ''
  Object.assign(form, {
    nom: '',
    region: '',
    ville: '',
    type: '',
    niveau: 'Secondaire',
    elevesCount: 0,
    enseignantsCount: 0,
    maitrise: 0,
    adminNom: '',
    adminEmail: '',
  })
  showForm.value = true
}

function closeForm() {
  showForm.value = false
}

async function copyCreds() {
  if (!createdCreds.value) return
  const text = `Email: ${createdCreds.value.adminEmail}\nMot de passe: ${createdCreds.value.tempPassword}`
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    /* ignore */
  }
}

async function submit() {
  saving.value = true
  formError.value = ''
  try {
    const result = await createSchoolWithAdmin({
      nom: form.nom.trim(),
      region: form.region,
      ville: form.ville.trim(),
      type: form.type,
      niveau: form.niveau,
      elevesCount: Number(form.elevesCount) || 0,
      enseignantsCount: Number(form.enseignantsCount) || 0,
      maitrise: Math.min(100, Math.max(0, Number(form.maitrise) || 0)),
      adminNom: form.adminNom.trim(),
      adminEmail: form.adminEmail.trim(),
    })
    schools.value = [
      {
        id: result.ecoleId,
        nom: result.ecoleNom,
        name: result.ecoleNom,
        region: form.region,
        ville: form.ville.trim(),
        type: form.type,
        niveau: form.niveau,
        elevesCount: Number(form.elevesCount) || 0,
        enseignantsCount: Number(form.enseignantsCount) || 0,
        maitrise: Number(form.maitrise) || 0,
      },
      ...schools.value,
    ].sort((a, b) => (b.maitrise ?? 0) - (a.maitrise ?? 0))
    closeForm()
    createdCreds.value = result
  } catch (e: unknown) {
    const err = e as { message?: string; code?: string }
    const msg = err.message || 'Impossible de créer l’établissement.'
    if (msg.includes('not-found') || msg.includes('NOT_FOUND') || msg.includes('404')) {
      formError.value =
        'Cloud Function indisponible. Déploie les functions (plan Blaze) ou lance l’émulateur.'
    } else {
      formError.value = msg.replace(/^Firebase:\s*/i, '').replace(/\s*\(.*\)\s*$/, '')
    }
  } finally {
    saving.value = false
  }
}

async function load() {
  loading.value = true
  try {
    const snap = await getDocs(collection(db, 'ecoles'))
    schools.value = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as School))
      .sort((a, b) => (b.maitrise ?? 0) - (a.maitrise ?? 0))
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.field {
  width: 100%;
  border-radius: 0.75rem;
  border: 1px solid rgba(6, 78, 59, 0.1);
  background: #f4f7f5;
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  color: #022c22;
  outline: none;
}
.field:focus {
  border-color: rgba(22, 101, 52, 0.4);
  box-shadow: 0 0 0 2px rgba(22, 101, 52, 0.15);
}
.btn-ghost {
  border-radius: 0.75rem;
  border: 1px solid rgba(6, 78, 59, 0.1);
  background: white;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(6, 78, 59, 0.7);
}
.btn-ghost:hover {
  background: #ecfdf5;
}
</style>
