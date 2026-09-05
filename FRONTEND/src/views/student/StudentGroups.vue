<template>
  <div>
    <StudentPageHeader
      title="Groupes d'entraide"
      subtitle="Crée un groupe, rejoins avec un code, et discute avec tes camarades."
    >
      <template #actions>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
          @click="showJoin = true"
        >
          Rejoindre
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-glow"
          :disabled="creating"
          @click="showCreate = true"
        >
          <Plus class="h-4 w-4" />
          Créer un groupe
        </button>
      </template>
    </StudentPageHeader>

    <div class="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <div class="space-y-4">
        <section class="glass-card p-5">
          <h2 class="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
            <Users class="h-5 w-5 text-blue-600" />
            Tes groupes
          </h2>
          <div v-if="loading" class="py-8 text-center text-sm text-slate-400">Chargement…</div>
          <ul v-else-if="myGroups.length" class="space-y-3">
            <li
              v-for="g in myGroups"
              :key="g.id"
              class="cursor-pointer rounded-xl border p-4 transition"
              :class="
                selectedId === g.id
                  ? 'border-blue-400 bg-blue-50/50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              "
              @click="openGroup(g.id)"
            >
              <div class="flex items-start gap-3">
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                  :class="subjectTheme(g.matiere).bg + ' ' + subjectTheme(g.matiere).text"
                >
                  {{ subjectTheme(g.matiere).glyph }}
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="font-semibold">{{ g.titre || g.nom || 'Groupe' }}</h3>
                  <p class="mt-0.5 text-xs text-slate-500">
                    {{ g.matiere || 'Matière' }} • {{ memberCount(g) }} membres
                  </p>
                  <p v-if="g.inviteCode" class="mt-1 font-mono text-[11px] text-blue-600">
                    Code : {{ g.inviteCode }}
                  </p>
                </div>
              </div>
            </li>
          </ul>
          <p v-else class="text-sm text-slate-400">Tu n'es membre d'aucun groupe pour le moment.</p>
        </section>

        <section class="glass-card border-blue-200 p-5">
          <h2 class="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
            <Sparkles class="h-5 w-5 text-blue-600" />
            Proposé par l'IA
          </h2>
          <div v-if="aiProposal" class="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
            <h3 class="font-semibold">{{ aiProposal.titre || aiProposal.nom || 'Groupe temporaire' }}</h3>
            <p class="mt-2 text-sm text-slate-500">
              {{
                aiProposal.description ||
                'Des camarades peuvent t’aider sur cette notion.'
              }}
            </p>
            <div class="mt-4 flex flex-wrap gap-2">
              <button type="button" class="btn-secondary flex-1 text-sm" :disabled="acting" @click="refuseProposal">
                Refuser
              </button>
              <button type="button" class="btn-primary flex-1 text-sm" :disabled="acting" @click="acceptProposal">
                Accepter
              </button>
            </div>
          </div>
          <p v-else class="text-sm text-slate-400">Aucune proposition IA en attente.</p>
        </section>
      </div>

      <!-- Chat -->
      <section class="glass-card flex h-[min(70vh,640px)] flex-col overflow-hidden">
        <div v-if="!selected" class="flex flex-1 flex-col items-center justify-center p-6 text-center text-slate-400">
          <Users class="mb-3 h-10 w-10 opacity-40" />
          <p class="text-sm">Sélectionne un groupe pour discuter avec tes camarades.</p>
        </div>
        <template v-else>
          <header class="border-b border-slate-100 px-4 py-3">
            <h2 class="font-semibold text-slate-900">{{ selected.titre || selected.nom }}</h2>
            <p class="text-xs text-slate-500">
              {{ memberCount(selected) }} membres
              <button
                v-if="selected.inviteCode"
                type="button"
                class="ml-2 text-blue-600 hover:underline"
                @click="copyCode"
              >
                Copier le code
              </button>
            </p>
          </header>
          <div ref="chatBox" class="flex-1 space-y-3 overflow-y-auto p-4">
            <div v-if="!messages.length" class="py-8 text-center text-sm text-slate-400">
              Aucun message. Dis bonjour au groupe !
            </div>
            <div
              v-for="m in messages"
              :key="m.id"
              class="flex"
              :class="m.fromId === auth.user?.uid ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[80%] rounded-2xl px-3.5 py-2 text-sm"
                :class="
                  m.fromId === auth.user?.uid
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-200 bg-slate-50 text-slate-800'
                "
              >
                <p
                  v-if="m.fromId !== auth.user?.uid"
                  class="mb-0.5 text-[10px] font-semibold opacity-70"
                >
                  {{ m.fromNom || 'Camarade' }}
                </p>
                {{ m.text }}
              </div>
            </div>
          </div>
          <form class="flex gap-2 border-t border-slate-100 p-3" @submit.prevent="sendMessage">
            <input
              v-model="draft"
              class="input-field flex-1 !pl-4"
              placeholder="Écrire un message…"
              :disabled="sending"
            />
            <button type="submit" class="btn-primary shrink-0" :disabled="sending || !draft.trim()">
              <Send class="h-4 w-4" />
            </button>
          </form>
        </template>
      </section>
    </div>

    <!-- Modal créer -->
    <div
      v-if="showCreate"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="showCreate = false"
    >
      <div class="glass-card w-full max-w-md p-6">
        <h3 class="font-display text-lg font-semibold">Créer un groupe</h3>
        <div class="mt-4 space-y-3">
          <input v-model="createForm.nom" class="input-field !pl-4" placeholder="Nom du groupe" />
          <input v-model="createForm.matiere" class="input-field !pl-4" placeholder="Matière" />
          <input v-model="createForm.description" class="input-field !pl-4" placeholder="Description (optionnel)" />
        </div>
        <div class="mt-5 flex justify-end gap-2">
          <button type="button" class="btn-secondary text-sm" @click="showCreate = false">Annuler</button>
          <button type="button" class="btn-primary text-sm" :disabled="creating" @click="createGroup">
            {{ creating ? 'Création…' : 'Créer' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal rejoindre -->
    <div
      v-if="showJoin"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="showJoin = false"
    >
      <div class="glass-card w-full max-w-md p-6">
        <h3 class="font-display text-lg font-semibold">Rejoindre un groupe</h3>
        <p class="mt-1 text-sm text-slate-500">Entre le code à 6 caractères partagé par un camarade.</p>
        <input
          v-model="joinCode"
          class="input-field mt-4 !pl-4 font-mono uppercase tracking-widest"
          maxlength="8"
          placeholder="ABC123"
        />
        <p v-if="joinError" class="mt-2 text-sm text-red-600">{{ joinError }}</p>
        <div class="mt-5 flex justify-end gap-2">
          <button type="button" class="btn-secondary text-sm" @click="showJoin = false">Annuler</button>
          <button type="button" class="btn-primary text-sm" :disabled="joining" @click="joinGroup">
            {{ joining ? '…' : 'Rejoindre' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import type { Unsubscribe } from 'firebase/firestore'
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { Plus, Users, Sparkles, Send } from 'lucide-vue-next'
import type { Group, GroupMessage } from '@/types/models'
import StudentPageHeader from '@/components/StudentPageHeader.vue'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { subjectTheme } from '@/utils/subjectTheme'
import { randomInviteCode } from '@/composables/useExerciseAnalysis'

const auth = useAuthStore()
const myGroups = ref<Group[]>([])
const proposals = ref<Group[]>([])
const messages = ref<GroupMessage[]>([])
const loading = ref(true)
const creating = ref(false)
const acting = ref(false)
const joining = ref(false)
const sending = ref(false)
const selectedId = ref<string | null>(null)
const draft = ref('')
const showCreate = ref(false)
const showJoin = ref(false)
const joinCode = ref('')
const joinError = ref('')
const chatBox = ref<HTMLElement | null>(null)
const createForm = reactive({ nom: '', matiere: '', description: '' })
let unsubs: Unsubscribe[] = []
let unsubMsg: Unsubscribe | null = null

const aiProposal = computed(() => proposals.value[0] || null)
const selected = computed(() => myGroups.value.find((g) => g.id === selectedId.value) || null)

function memberCount(g: Group) {
  return g.membresCount ?? g.memberIds?.length ?? 0
}

function openGroup(id: string) {
  selectedId.value = id
}

watch(selectedId, (id) => {
  unsubMsg?.()
  messages.value = []
  if (!id) return
  const mq = query(collection(db, 'groups', id, 'messages'), orderBy('createdAt', 'asc'), limit(200))
  unsubMsg = onSnapshot(
    mq,
    async (snap) => {
      messages.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as GroupMessage))
      await nextTick()
      if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight
    },
    async () => {
      // fallback sans index
      try {
        const snap = await getDocs(collection(db, 'groups', id, 'messages'))
        messages.value = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as GroupMessage))
          .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
      } catch {
        messages.value = []
      }
    },
  )
})

onMounted(() => {
  const uid = auth.user?.uid
  if (!uid) {
    loading.value = false
    return
  }

  unsubs.push(
    onSnapshot(
      query(collection(db, 'groups'), where('memberIds', 'array-contains', uid)),
      (snap) => {
        myGroups.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Group))
        loading.value = false
        if (!selectedId.value && myGroups.value.length) selectedId.value = myGroups.value[0].id
      },
      () => {
        loading.value = false
      },
    ),
  )

  try {
    unsubs.push(
      onSnapshot(
        query(
          collection(db, 'groups'),
          where('proposeIA', '==', true),
          where('status', '==', 'pending'),
        ),
        (snap) => {
          proposals.value = snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as Group))
            .filter((g) => !(g.memberIds || []).includes(uid))
        },
      ),
    )
  } catch {
    /* ignore */
  }
})

onUnmounted(() => {
  unsubs.forEach((u) => u())
  unsubMsg?.()
})

async function createGroup() {
  const uid = auth.user?.uid
  if (!uid || creating.value) return
  if (!createForm.nom.trim()) return
  creating.value = true
  try {
    const code = randomInviteCode()
    const ref = await addDoc(collection(db, 'groups'), {
      titre: createForm.nom.trim(),
      nom: createForm.nom.trim(),
      matiere: createForm.matiere.trim(),
      description: createForm.description.trim(),
      memberIds: [uid],
      membresCount: 1,
      inviteCode: code,
      proposeIA: false,
      status: 'actif',
      createdAt: serverTimestamp(),
      createdBy: uid,
    })
    showCreate.value = false
    createForm.nom = ''
    createForm.matiere = ''
    createForm.description = ''
    selectedId.value = ref.id
    window.alert(`Groupe créé. Code à partager : ${code}`)
  } catch (e) {
    console.error(e)
    window.alert("Impossible de créer le groupe.")
  } finally {
    creating.value = false
  }
}

async function joinGroup() {
  const uid = auth.user?.uid
  if (!uid) return
  const code = joinCode.value.trim().toUpperCase()
  if (code.length < 4) {
    joinError.value = 'Code trop court.'
    return
  }
  joining.value = true
  joinError.value = ''
  try {
    const snap = await getDocs(
      query(collection(db, 'groups'), where('inviteCode', '==', code), limit(1)),
    )
    if (snap.empty) {
      joinError.value = 'Aucun groupe avec ce code.'
      return
    }
    const g = snap.docs[0]
    const data = g.data() as Group
    if ((data.memberIds || []).includes(uid)) {
      selectedId.value = g.id
      showJoin.value = false
      return
    }
    await updateDoc(doc(db, 'groups', g.id), {
      memberIds: arrayUnion(uid),
      membresCount: (data.memberIds?.length || 0) + 1,
      status: 'actif',
    })
    selectedId.value = g.id
    showJoin.value = false
    joinCode.value = ''
  } catch (e) {
    console.error(e)
    joinError.value = 'Impossible de rejoindre (règles ou réseau).'
  } finally {
    joining.value = false
  }
}

async function sendMessage() {
  const uid = auth.user?.uid
  const gid = selectedId.value
  const text = draft.value.trim()
  if (!uid || !gid || !text || sending.value) return
  sending.value = true
  try {
    await addDoc(collection(db, 'groups', gid, 'messages'), {
      fromId: uid,
      fromNom: auth.displayName || 'Élève',
      text,
      createdAt: serverTimestamp(),
    })
    draft.value = ''
  } catch (e) {
    console.error(e)
    window.alert("Impossible d'envoyer le message.")
  } finally {
    sending.value = false
  }
}

function copyCode() {
  const code = selected.value?.inviteCode
  if (!code) return
  void navigator.clipboard.writeText(code)
  window.alert(`Code copié : ${code}`)
}

async function acceptProposal() {
  const uid = auth.user?.uid
  const g = aiProposal.value
  if (!uid || !g || acting.value) return
  acting.value = true
  try {
    await updateDoc(doc(db, 'groups', g.id), {
      memberIds: arrayUnion(uid),
      status: 'actif',
      membresCount: memberCount(g) + 1,
    })
  } finally {
    acting.value = false
  }
}

async function refuseProposal() {
  const g = aiProposal.value
  if (!g || acting.value) return
  acting.value = true
  try {
    await updateDoc(doc(db, 'groups', g.id), { status: 'refuse' })
  } finally {
    acting.value = false
  }
}
</script>
