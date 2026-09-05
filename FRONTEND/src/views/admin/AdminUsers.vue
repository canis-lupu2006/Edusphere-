<template>
  <div>
    <header class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
          ADMINISTRATION
        </p>
        <h1 class="page-title">Élèves & Enseignants</h1>
        <p class="page-sub">Créer les comptes et gérer rôles / statuts.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button type="button" class="btn-secondary text-sm" @click="onImport">
          <Upload class="h-4 w-4" />
          Importer
        </button>
        <button
          type="button"
          class="btn-primary text-sm !from-emerald-600 !to-emerald-500"
          @click="openAdd"
        >
          <Plus class="h-4 w-4" />
          Ajouter {{ tab === 'eleve' ? 'élève' : 'enseignant' }}
        </button>
      </div>
    </header>

    <div class="mb-4 flex gap-6 border-b border-slate-200">
      <button
        type="button"
        class="border-b-2 pb-2 text-sm font-medium transition"
        :class="tab === 'eleve' ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-600'"
        @click="tab = 'eleve'"
      >
        Élèves
      </button>
      <button
        type="button"
        class="border-b-2 pb-2 text-sm font-medium transition"
        :class="tab === 'enseignant' ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-600'"
        @click="tab = 'enseignant'"
      >
        Enseignants
      </button>
    </div>

    <div class="mb-6 grid gap-4 sm:grid-cols-3">
      <div class="glass-card flex items-center gap-3 p-4">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
          <Users class="h-4 w-4" />
        </div>
        <div>
          <p class="font-display text-xl font-bold">{{ elevesCount }}</p>
          <p class="text-xs text-slate-500">élèves</p>
        </div>
      </div>
      <div class="glass-card flex items-center gap-3 p-4">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
          <GraduationCap class="h-4 w-4" />
        </div>
        <div>
          <p class="font-display text-xl font-bold">{{ enseignantsCount }}</p>
          <p class="text-xs text-slate-500">enseignants</p>
        </div>
      </div>
      <div class="glass-card flex items-center gap-3 p-4">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
          <UserX class="h-4 w-4" />
        </div>
        <div>
          <p class="font-display text-xl font-bold">{{ inactifsCount }}</p>
          <p class="text-xs text-slate-500">comptes inactifs</p>
        </div>
      </div>
    </div>

    <div class="glass-card mb-4 flex flex-wrap gap-3 p-4">
      <div class="relative min-w-[14rem] flex-1">
        <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          v-model="search"
          class="input-field"
          :placeholder="tab === 'eleve' ? 'Rechercher un élève…' : 'Rechercher un enseignant…'"
        />
      </div>
      <select v-model="filtreClasse" class="input-field !w-auto !pl-4">
        <option value="">Classe (Toutes)</option>
        <option v-for="c in classList" :key="c.id" :value="c.nom">{{ c.nom }}</option>
      </select>
      <select v-model="filtreStatut" class="input-field !w-auto !pl-4">
        <option value="">Statut (Tous)</option>
        <option value="actif">Actif</option>
        <option value="inactif">Inactif</option>
      </select>
    </div>

    <div class="glass-card overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-4 py-3">Nom</th>
            <th class="px-4 py-3">Classe</th>
            <th class="px-4 py-3">Rôle</th>
            <th class="px-4 py-3">Moyenne</th>
            <th class="px-4 py-3">Statut</th>
            <th class="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in filtered" :key="u.uid" class="border-b border-slate-100">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div
                  class="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800"
                >
                  {{ initials(u) }}
                </div>
                <div>
                  <p class="font-medium text-slate-900">{{ displayName(u) }}</p>
                  <p class="text-xs text-slate-400">{{ u.email || '—' }}</p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3 text-slate-600">{{ u.classeNom || '—' }}</td>
            <td class="px-4 py-3">
              <select
                :value="u.role ?? ''"
                class="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                @change="onRoleChange(u, $event)"
              >
                <option value="eleve">Élève</option>
                <option value="enseignant">Enseignant</option>
                <option value="parent">Parent</option>
                <option value="admin">Admin</option>
              </select>
            </td>
            <td class="px-4 py-3 font-medium text-emerald-700">
              {{ u.moyenne != null ? `${u.moyenne} / 20` : '—' }}
            </td>
            <td class="px-4 py-3">
              <select
                :value="u.status || 'actif'"
                class="rounded-full border px-2 py-1 text-xs"
                :class="
                  (u.status || 'actif') === 'actif'
                    ? 'border-emerald-500/30 bg-emerald-100 text-emerald-700'
                    : 'border-slate-200 bg-slate-50 text-slate-500'
                "
                @change="onStatusChange(u, $event)"
              >
                <option value="actif">Actif</option>
                <option value="inactif">Inactif</option>
              </select>
            </td>
            <td class="px-4 py-3">
              <button
                type="button"
                class="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
                title="Modifier le profil"
                @click="editNote(u)"
              >
                <MoreVertical class="h-4 w-4" />
              </button>
            </td>
          </tr>
          <tr v-if="!filtered.length">
            <td colspan="6" class="px-4 py-10 text-center text-slate-400">Aucun utilisateur trouvé.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal enseignant -->
    <div
      v-if="showTeacherForm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      @click.self="showTeacherForm = false"
    >
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 class="font-display text-lg font-semibold text-slate-900">Nouvel enseignant</h2>
        <p class="mt-1 text-sm text-slate-500">Un compte Auth sera créé automatiquement.</p>
        <form class="mt-5 space-y-3" @submit.prevent="submitTeacher">
          <label class="block text-sm">
            <span class="mb-1 block text-xs font-medium text-slate-500">Nom *</span>
            <input v-model="teacherForm.nom" required type="text" class="field" />
          </label>
          <label class="block text-sm">
            <span class="mb-1 block text-xs font-medium text-slate-500">Email *</span>
            <input v-model="teacherForm.email" required type="email" class="field" />
          </label>
          <label class="block text-sm">
            <span class="mb-1 block text-xs font-medium text-slate-500">Classe (optionnel)</span>
            <select v-model="teacherForm.classeId" class="field">
              <option value="">Aucune</option>
              <option v-for="c in classList" :key="c.id" :value="c.id">{{ c.nom }}</option>
            </select>
          </label>
          <p v-if="formError" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{{ formError }}</p>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" class="btn-ghost" @click="showTeacherForm = false">Annuler</button>
            <button type="submit" class="btn-save" :disabled="saving">
              {{ saving ? 'Création…' : 'Créer le compte' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal élève + parent -->
    <div
      v-if="showStudentForm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      @click.self="showStudentForm = false"
    >
      <div class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h2 class="font-display text-lg font-semibold text-slate-900">Nouvel élève</h2>
        <p class="mt-1 text-sm text-slate-500">
          Crée aussi le compte parent lié (emails distincts).
        </p>
        <form class="mt-5 space-y-3" @submit.prevent="submitStudent">
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-emerald-700">Élève</p>
            <div class="space-y-3">
              <label class="block text-sm">
                <span class="mb-1 block text-xs font-medium text-slate-500">Nom *</span>
                <input v-model="studentForm.eleveNom" required type="text" class="field !bg-white" />
              </label>
              <label class="block text-sm">
                <span class="mb-1 block text-xs font-medium text-slate-500">Email *</span>
                <input v-model="studentForm.eleveEmail" required type="email" class="field !bg-white" />
              </label>
              <label class="block text-sm">
                <span class="mb-1 block text-xs font-medium text-slate-500">Classe *</span>
                <select v-model="studentForm.classeId" required class="field !bg-white">
                  <option value="" disabled>Choisir une classe</option>
                  <option v-for="c in classList" :key="c.id" :value="c.id">{{ c.nom }}</option>
                </select>
              </label>
              <p v-if="!classList.length" class="text-xs text-amber-600">
                Aucune classe dans cette école. Créez-en une dans Firestore / seed avant d’ajouter un élève.
              </p>
            </div>
          </div>

          <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-emerald-700">Parent</p>
            <div class="space-y-3">
              <label class="block text-sm">
                <span class="mb-1 block text-xs font-medium text-slate-500">Nom *</span>
                <input v-model="studentForm.parentNom" required type="text" class="field !bg-white" />
              </label>
              <label class="block text-sm">
                <span class="mb-1 block text-xs font-medium text-slate-500">Email *</span>
                <input v-model="studentForm.parentEmail" required type="email" class="field !bg-white" />
              </label>
            </div>
          </div>

          <p v-if="formError" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{{ formError }}</p>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" class="btn-ghost" @click="showStudentForm = false">Annuler</button>
            <button type="submit" class="btn-save" :disabled="saving || !classList.length">
              {{ saving ? 'Création…' : 'Créer élève + parent' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Identifiants -->
    <div
      v-if="creds"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      @click.self="creds = null"
    >
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 class="font-display text-lg font-semibold text-slate-900">Comptes créés</h2>
        <p class="mt-1 text-sm text-slate-500">
          Note ces identifiants maintenant — ils ne seront plus réaffichés.
        </p>
        <div class="mt-4 space-y-3">
          <div
            v-for="(c, i) in creds"
            :key="i"
            class="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm"
          >
            <p class="text-xs font-semibold uppercase tracking-wide text-emerald-700">{{ c.label }}</p>
            <p class="mt-2">
              <span class="text-slate-500">Email</span><br />
              <span class="font-mono font-semibold text-slate-900">{{ c.email }}</span>
            </p>
            <p class="mt-2">
              <span class="text-slate-500">Mot de passe</span><br />
              <span class="font-mono font-semibold text-slate-900">{{ c.password }}</span>
            </p>
          </div>
        </div>
        <button type="button" class="btn-ghost mt-3 w-full" @click="copyCreds">
          {{ copied ? 'Copié !' : 'Tout copier' }}
        </button>
        <button type="button" class="btn-save mt-2 w-full" @click="creds = null">
          J’ai noté les identifiants
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import type { Unsubscribe } from 'firebase/firestore'
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore'
import {
  Users,
  GraduationCap,
  UserX,
  Search,
  Upload,
  Plus,
  MoreVertical,
} from 'lucide-vue-next'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import {
  useCloudFunctions,
  type CreateStudentResult,
  type CreateTeacherResult,
} from '@/composables/useCloudFunctions'
import type { ClassRecord, UserProfile, UserRole } from '@/types/models'

interface CredLine {
  label: string
  email: string
  password: string
}

const auth = useAuthStore()
const { createTeacher, createStudentWithParent } = useCloudFunctions()

const users = ref<UserProfile[]>([])
const classList = ref<ClassRecord[]>([])
const tab = ref<'eleve' | 'enseignant'>('eleve')
const search = ref('')
const filtreClasse = ref('')
const filtreStatut = ref('')
let unsub: Unsubscribe | null = null

const showTeacherForm = ref(false)
const showStudentForm = ref(false)
const saving = ref(false)
const formError = ref('')
const creds = ref<CredLine[] | null>(null)
const copied = ref(false)

const teacherForm = reactive({ nom: '', email: '', classeId: '' })
const studentForm = reactive({
  eleveNom: '',
  eleveEmail: '',
  classeId: '',
  parentNom: '',
  parentEmail: '',
})

const elevesCount = computed(() => users.value.filter((u) => u.role === 'eleve').length)
const enseignantsCount = computed(() => users.value.filter((u) => u.role === 'enseignant').length)
const inactifsCount = computed(
  () => users.value.filter((u) => (u.status || 'actif') === 'inactif').length,
)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return users.value.filter((u) => {
    if (u.role !== tab.value) return false
    if (filtreClasse.value && u.classeNom !== filtreClasse.value) return false
    if (filtreStatut.value && (u.status || 'actif') !== filtreStatut.value) return false
    if (!q) return true
    const hay = `${displayName(u)} ${u.email || ''} ${u.classeNom || ''}`.toLowerCase()
    return hay.includes(q)
  })
})

function displayName(u: UserProfile) {
  return u.displayName || u.nom || u.email || u.uid
}

function initials(u: UserProfile) {
  return displayName(u)
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function openAdd() {
  formError.value = ''
  if (tab.value === 'enseignant') {
    Object.assign(teacherForm, { nom: '', email: '', classeId: '' })
    showTeacherForm.value = true
  } else {
    Object.assign(studentForm, {
      eleveNom: '',
      eleveEmail: '',
      classeId: '',
      parentNom: '',
      parentEmail: '',
    })
    showStudentForm.value = true
  }
}

function mapFnError(e: unknown) {
  const err = e as { message?: string }
  const msg = err.message || 'Échec de la création.'
  if (msg.includes('not-found') || msg.includes('NOT_FOUND') || msg.includes('404')) {
    return 'Cloud Function indisponible. Déploie les functions ou lance l’émulateur.'
  }
  return msg.replace(/^Firebase:\s*/i, '').replace(/\s*\(.*\)\s*$/, '')
}

async function submitTeacher() {
  saving.value = true
  formError.value = ''
  try {
    const result: CreateTeacherResult = await createTeacher({
      nom: teacherForm.nom.trim(),
      email: teacherForm.email.trim(),
      classeId: teacherForm.classeId || undefined,
    })
    showTeacherForm.value = false
    creds.value = [
      { label: 'Enseignant', email: result.email, password: result.tempPassword },
    ]
  } catch (e) {
    formError.value = mapFnError(e)
  } finally {
    saving.value = false
  }
}

async function submitStudent() {
  saving.value = true
  formError.value = ''
  try {
    const result: CreateStudentResult = await createStudentWithParent({
      eleveNom: studentForm.eleveNom.trim(),
      eleveEmail: studentForm.eleveEmail.trim(),
      classeId: studentForm.classeId,
      parentNom: studentForm.parentNom.trim(),
      parentEmail: studentForm.parentEmail.trim(),
    })
    showStudentForm.value = false
    creds.value = [
      {
        label: 'Élève',
        email: result.eleve.email,
        password: result.eleve.tempPassword,
      },
      {
        label: 'Parent',
        email: result.parent.email,
        password: result.parent.tempPassword,
      },
    ]
  } catch (e) {
    formError.value = mapFnError(e)
  } finally {
    saving.value = false
  }
}

async function copyCreds() {
  if (!creds.value) return
  const text = creds.value
    .map((c) => `${c.label}\nEmail: ${c.email}\nMot de passe: ${c.password}`)
    .join('\n\n')
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

onMounted(async () => {
  const ecoleId = auth.profile?.ecoleId

  unsub = onSnapshot(collection(db, 'users'), (snap) => {
    users.value = snap.docs
      .map((d) => {
        const data = d.data()
        return {
          uid: d.id,
          id: d.id,
          role: (data.role as UserRole) ?? null,
          ...data,
        } as UserProfile
      })
      .filter((u) => !ecoleId || !u.ecoleId || u.ecoleId === ecoleId)
  })

  try {
    if (ecoleId) {
      const snap = await getDocs(query(collection(db, 'classes'), where('ecoleId', '==', ecoleId)))
      classList.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ClassRecord))
    } else {
      const snap = await getDocs(collection(db, 'classes'))
      classList.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ClassRecord))
    }
  } catch {
    classList.value = []
  }
})

onUnmounted(() => unsub?.())

function onRoleChange(u: UserProfile, event: Event) {
  const target = event.target as HTMLSelectElement
  void updateDoc(doc(db, 'users', u.uid), { role: target.value as UserRole })
}

function onStatusChange(u: UserProfile, event: Event) {
  const target = event.target as HTMLSelectElement
  void updateDoc(doc(db, 'users', u.uid), { status: target.value })
}

function onImport() {
  window.alert('Import CSV non disponible dans cette version.')
}

function editNote(u: UserProfile) {
  const nom = window.prompt('Nom affiché', displayName(u))
  if (nom == null) return
  void updateDoc(doc(db, 'users', u.uid), { displayName: nom.trim() || displayName(u) })
}
</script>

<style scoped>
.field {
  width: 100%;
  border-radius: 0.75rem;
  border: 1px solid rgb(226 232 240);
  background: #f8fafc;
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  color: #0f172a;
  outline: none;
}
.field:focus {
  border-color: rgb(16 185 129 / 0.5);
  box-shadow: 0 0 0 2px rgb(16 185 129 / 0.15);
}
.btn-ghost {
  border-radius: 0.75rem;
  border: 1px solid rgb(226 232 240);
  background: white;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(71 85 105);
}
.btn-ghost:hover {
  background: #f8fafc;
}
.btn-save {
  border-radius: 0.75rem;
  background: #0f766e;
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
}
.btn-save:hover {
  background: #115e59;
}
.btn-save:disabled {
  opacity: 0.5;
}
</style>
