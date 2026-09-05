<template>
  <div>
    <StudentPageHeader
      title="Groupes d'entraide"
      subtitle="Rejoins un groupe permanent ou accepte une proposition d'aide de l'IA."
    >
      <template #actions>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-glow"
          :disabled="creating"
          @click="createGroup"
        >
          <Plus class="h-4 w-4" />
          Créer un groupe
        </button>
      </template>
    </StudentPageHeader>

    <div class="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <!-- Tes groupes -->
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
            class="relative rounded-xl border border-slate-200 bg-white p-4"
          >
            <button
              type="button"
              class="absolute right-3 top-3 rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-900/60"
              aria-label="Options"
            >
              <MoreVertical class="h-4 w-4" />
            </button>
            <div class="flex items-start gap-3">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                :class="subjectTheme(g.matiere).bg + ' ' + subjectTheme(g.matiere).text"
              >
                {{ subjectTheme(g.matiere).glyph }}
              </div>
              <div class="min-w-0 flex-1 pr-6">
                <h3 class="font-semibold">{{ g.titre || g.nom || 'Groupe' }}</h3>
                <p class="mt-0.5 text-xs text-slate-500">
                  {{ g.matiere || 'Matière' }} • {{ memberCount(g) }} membres
                </p>
                <p class="mt-2 text-sm text-slate-500">
                  {{ g.description || 'Groupe d\'entraide.' }}
                </p>
                <button
                  type="button"
                  class="mt-3 inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Voir le groupe &gt;
                </button>
              </div>
            </div>
          </li>
        </ul>
        <p v-else class="text-sm text-slate-400">Tu n'es membre d'aucun groupe pour le moment.</p>
      </section>

      <!-- Proposé par l'IA -->
      <section class="glass-card border-blue-200 p-5">
        <h2 class="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-slate-900">
          <Sparkles class="h-5 w-5 text-blue-600" />
          Proposé par l'IA
        </h2>
        <div v-if="aiProposal" class="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
          <div class="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <TrendingUp class="h-4 w-4" />
          </div>
          <h3 class="font-semibold">
            {{ aiProposal.titre || aiProposal.nom || 'Groupe temporaire' }}
          </h3>
          <p class="mt-2 text-sm text-slate-500">
            {{
              aiProposal.description ||
              '2 camarades ayant une bonne maîtrise de cette notion peuvent t\'aider à progresser.'
            }}
          </p>
          <div class="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              class="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium transition hover:bg-slate-100"
              :disabled="acting"
              @click="refuseProposal"
            >
              <X class="h-4 w-4" />
              Refuser
            </button>
            <button
              type="button"
              class="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-3 py-2.5 text-sm font-semibold text-white shadow-glow"
              :disabled="acting"
              @click="acceptProposal"
            >
              <Check class="h-4 w-4" />
              Accepter
            </button>
          </div>
          <p class="mt-4 flex items-start gap-2 text-xs text-slate-400">
            <Info class="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Le groupe est temporaire et sera désactivé automatiquement dans
            {{ aiProposal.expiresInDays ?? 7 }} jours.
          </p>
        </div>
        <p v-else class="text-sm text-slate-400">Aucune proposition IA en attente.</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { Unsubscribe } from 'firebase/firestore'
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  arrayUnion,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore'
import {
  Plus,
  Users,
  Sparkles,
  MoreVertical,
  TrendingUp,
  X,
  Check,
  Info,
} from 'lucide-vue-next'
import type { Group } from '@/types/models'
import StudentPageHeader from '@/components/StudentPageHeader.vue'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { subjectTheme } from '@/utils/subjectTheme'

const auth = useAuthStore()
const myGroups = ref<Group[]>([])
const proposals = ref<Group[]>([])
const loading = ref(true)
const creating = ref(false)
const acting = ref(false)
let unsubs: Unsubscribe[] = []

const aiProposal = computed(() => proposals.value[0] || null)

function memberCount(g: Group) {
  return g.membresCount ?? g.memberIds?.length ?? 0
}

onMounted(() => {
  const uid = auth.user?.uid
  if (!uid) {
    loading.value = false
    return
  }

  const mq = query(collection(db, 'groups'), where('memberIds', 'array-contains', uid))
  unsubs.push(
    onSnapshot(
      mq,
      (snap) => {
        myGroups.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Group))
        loading.value = false
      },
      () => {
        loading.value = false
      },
    ),
  )

  // Propositions IA
  const loadProposals = async () => {
    try {
      const pq = query(
        collection(db, 'groups'),
        where('proposeIA', '==', true),
        where('status', '==', 'pending'),
      )
      unsubs.push(
        onSnapshot(pq, (snap) => {
          proposals.value = snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as Group))
            .filter((g) => !(g.memberIds || []).includes(uid))
        }),
      )
    } catch {
      try {
        const snap = await getDocs(collection(db, 'groups'))
        proposals.value = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Group))
          .filter(
            (g) =>
              g.proposeIA === true &&
              (g.status === 'pending' || !g.status) &&
              !(g.memberIds || []).includes(uid),
          )
      } catch {
        proposals.value = []
      }
    }
  }
  void loadProposals()
})

onUnmounted(() => unsubs.forEach((u) => u()))

async function createGroup() {
  const uid = auth.user?.uid
  if (!uid || creating.value) return
  const nom = window.prompt('Nom du groupe ?')
  if (!nom?.trim()) return
  const matiere = window.prompt('Matière ?') || ''
  const description = window.prompt('Description (optionnel) ?') || ''
  creating.value = true
  try {
    await addDoc(collection(db, 'groups'), {
      titre: nom.trim(),
      nom: nom.trim(),
      matiere: matiere.trim(),
      description: description.trim(),
      memberIds: [uid],
      membresCount: 1,
      proposeIA: false,
      status: 'actif',
      createdAt: serverTimestamp(),
      createdBy: uid,
    })
  } catch (e) {
    console.error(e)
    window.alert("Impossible de créer le groupe.")
  } finally {
    creating.value = false
  }
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
  } catch (e) {
    console.error(e)
    window.alert("Impossible d'accepter la proposition.")
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
  } catch (e) {
    console.error(e)
    window.alert('Impossible de refuser.')
  } finally {
    acting.value = false
  }
}
</script>
