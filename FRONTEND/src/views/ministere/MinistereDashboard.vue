<template>
  <div>
    <header class="mb-6 rounded-2xl bg-gradient-to-r from-emerald-800 to-emerald-700 px-6 py-5 text-white shadow-md">
      <h1 class="font-display text-2xl font-semibold">Bienvenue</h1>
      <p class="mt-1 text-sm text-emerald-100">
        Investir dans l'éducation, c'est construire l'avenir du pays.
      </p>
    </header>

    <div class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <Kpi label="Établissements" :value="stats.ecoles" />
      <Kpi label="Élèves inscrits" :value="stats.eleves" />
      <Kpi label="Enseignants" :value="stats.enseignants" />
      <Kpi label="Taux de maîtrise" :value="`${stats.maitrise}%`" />
      <Kpi label="Tickets ouverts" :value="stats.tickets" />
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <div class="rounded-2xl bg-white p-5 shadow-sm">
        <h2 class="mb-3 font-display text-lg font-semibold text-emerald-900">Tickets en cours</h2>
        <ul v-if="tickets.length" class="space-y-2 text-sm">
          <li
            v-for="t in tickets.slice(0, 6)"
            :key="t.id"
            class="flex justify-between rounded-xl bg-emerald-50/80 px-3 py-2"
          >
            <span class="truncate pr-2">{{ t.message }}</span>
            <span class="shrink-0 rounded-full bg-amber-100 px-2 text-[10px] font-semibold text-amber-800">
              {{ t.status }}
            </span>
          </li>
        </ul>
        <p v-else class="text-sm text-emerald-900/45">Aucun ticket.</p>
      </div>
      <div class="rounded-2xl bg-white p-5 shadow-sm">
        <h2 class="mb-3 font-display text-lg font-semibold text-emerald-900">Répartition des rôles</h2>
        <ul class="space-y-2 text-sm">
          <li class="flex justify-between"><span>Élèves</span><span class="font-semibold">{{ stats.eleves }}</span></li>
          <li class="flex justify-between"><span>Enseignants</span><span class="font-semibold">{{ stats.enseignants }}</span></li>
          <li class="flex justify-between"><span>Parents</span><span class="font-semibold">{{ stats.parents }}</span></li>
          <li class="flex justify-between"><span>Admins</span><span class="font-semibold">{{ stats.admins }}</span></li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref, defineComponent, h, type PropType } from 'vue'
import { collection, getDocs, query, where, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import { db } from '@/firebase'
import type { Ticket } from '@/types/models'

const Kpi = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: [String, Number] as PropType<string | number>, required: true },
  },
  setup(props) {
    return () =>
      h('div', { class: 'rounded-2xl bg-white p-4 shadow-sm' }, [
        h('p', { class: 'text-xs uppercase tracking-wide text-emerald-900/45' }, props.label),
        h(
          'p',
          { class: 'mt-1 font-display text-2xl font-bold text-emerald-900' },
          String(props.value),
        ),
      ])
  },
})

const stats = reactive({
  ecoles: 0,
  eleves: 0,
  enseignants: 0,
  parents: 0,
  admins: 0,
  maitrise: 0,
  tickets: 0,
})
const tickets = ref<Ticket[]>([])
let unsub: Unsubscribe | null = null

onMounted(async () => {
  const schools = await getDocs(collection(db, 'ecoles'))
  stats.ecoles = schools.size

  const users = await getDocs(collection(db, 'users'))
  users.forEach((d) => {
    const r = d.data().role
    if (r === 'eleve') stats.eleves++
    else if (r === 'enseignant') stats.enseignants++
    else if (r === 'parent') stats.parents++
    else if (r === 'admin') stats.admins++
  })

  const attempts = await getDocs(collection(db, 'attempts'))
  const scores = attempts.docs.map((d) => d.data().score || 0)
  stats.maitrise = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0

  unsub = onSnapshot(
    query(collection(db, 'tickets'), where('status', '==', 'ouvert')),
    (snap) => {
      tickets.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Ticket))
      stats.tickets = snap.size
    }
  )
})

onUnmounted(() => unsub?.())
</script>
