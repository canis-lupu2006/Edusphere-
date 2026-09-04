<template>
  <div>
    <header class="mb-6">
      <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#166534]/70">
        Ministère
      </p>
      <h1 class="font-display text-2xl font-semibold text-emerald-950">Rapports</h1>
      <p class="mt-1 text-sm text-emerald-900/55">
        Export JSON des statistiques et journaux de type rapport
      </p>
    </header>

    <section class="mb-6 rounded-2xl bg-white p-5 shadow-sm">
      <h2 class="mb-3 font-display text-lg font-semibold text-emerald-950">Exporter</h2>
      <p class="mb-4 text-sm text-emerald-900/55">
        Télécharge un instantané JSON (écoles, effectifs, maîtrise, tickets).
      </p>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-[#166534] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
        :disabled="exporting"
        @click="exportStats"
      >
        <Download class="h-4 w-4" />
        {{ exporting ? 'Préparation…' : 'Exporter les statistiques (JSON)' }}
      </button>
      <p v-if="exportMsg" class="mt-3 text-sm text-[#166534]">{{ exportMsg }}</p>
    </section>

    <section class="rounded-2xl bg-white p-5 shadow-sm">
      <h2 class="mb-3 font-display text-lg font-semibold text-emerald-950">
        Activité récente (rapports)
      </h2>
      <div v-if="loading" class="py-8 text-center text-sm text-emerald-900/40">Chargement…</div>
      <ul v-else-if="rapports.length" class="space-y-2 text-sm">
        <li
          v-for="log in rapports"
          :key="log.id"
          class="rounded-xl border border-emerald-900/5 bg-emerald-50/50 px-4 py-3"
        >
          <p class="font-medium text-emerald-950">{{ log.message || 'Rapport' }}</p>
          <p class="mt-0.5 text-xs text-emerald-900/45">
            {{ log.type }} · {{ formatDate(log.createdAt) }}
          </p>
        </li>
      </ul>
      <p v-else class="text-sm text-emerald-900/45">
        Aucun activity_logs de type « rapport ».
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Download } from 'lucide-vue-next'
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '@/firebase'
import type { ActivityLog, School } from '@/types/models'

const loading = ref(true)
const exporting = ref(false)
const exportMsg = ref('')
const rapports = ref<ActivityLog[]>([])

function formatDate(value: unknown) {
  if (!value) return ''
  const ts = value as Timestamp
  if (typeof ts?.toDate === 'function') {
    return ts.toDate().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
  }
  return String(value)
}

async function exportStats() {
  exporting.value = true
  exportMsg.value = ''
  try {
    const [schoolsSnap, usersSnap, progressSnap, ticketsSnap] = await Promise.all([
      getDocs(collection(db, 'ecoles')),
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'progress')),
      getDocs(collection(db, 'tickets')),
    ])

    let eleves = 0
    let enseignants = 0
    usersSnap.forEach((d) => {
      const r = d.data().role
      if (r === 'eleve') eleves++
      else if (r === 'enseignant') enseignants++
    })

    const maitriseVals = progressSnap.docs.map((d) => {
      const data = d.data()
      return Number(data.maitrise ?? data.percent ?? 0)
    })
    const avgMaitrise = maitriseVals.length
      ? Math.round(maitriseVals.reduce((a, b) => a + b, 0) / maitriseVals.length)
      : 0

    const schools = schoolsSnap.docs.map((d) => {
      const data = d.data() as School
      return {
        id: d.id,
        nom: data.nom || data.name,
        region: data.region,
        ville: data.ville,
        elevesCount: data.elevesCount,
        maitrise: data.maitrise,
      }
    })

    const payload = {
      exportedAt: new Date().toISOString(),
      source: 'EduSphere Ministère',
      summary: {
        ecoles: schoolsSnap.size,
        eleves,
        enseignants,
        avgMaitrise,
        tickets: ticketsSnap.size,
        ticketsResolus: ticketsSnap.docs.filter((d) => d.data().status === 'resolu').length,
      },
      schools,
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `edusphere-stats-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    exportMsg.value = 'Fichier téléchargé.'
  } catch {
    exportMsg.value = "Échec de l'export."
  } finally {
    exporting.value = false
  }
}

onMounted(async () => {
  try {
    try {
      const q = query(
        collection(db, 'activity_logs'),
        where('type', '==', 'rapport'),
        orderBy('createdAt', 'desc'),
        limit(20),
      )
      const snap = await getDocs(q)
      rapports.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ActivityLog))
    } catch {
      const snap = await getDocs(query(collection(db, 'activity_logs'), limit(40)))
      rapports.value = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as ActivityLog))
        .filter((l) => String(l.type || '').toLowerCase().includes('rapport'))
    }
  } finally {
    loading.value = false
  }
})
</script>
