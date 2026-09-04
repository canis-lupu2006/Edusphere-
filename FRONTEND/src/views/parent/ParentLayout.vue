<template>
  <div class="flex min-h-screen bg-[#F7F3EB] text-[#1a3d32]">
    <aside class="flex h-screen w-60 shrink-0 flex-col border-r border-[#1a5c45]/10 bg-[#faf7f1]">
      <div class="flex items-center gap-3 px-5 py-5">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a5c45] text-white">
          <BookOpen class="h-5 w-5" />
        </div>
        <div>
          <p class="font-display text-lg font-semibold leading-none">EduSphere</p>
          <span
            class="mt-1.5 inline-block rounded-full bg-[#1a5c45] px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white"
          >
            Espace parent
          </span>
        </div>
      </div>

      <nav class="mt-2 flex-1 space-y-1 px-3">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#1a3d32]/70 transition hover:bg-[#1a5c45]/8"
          :class="{ 'bg-[#ebe4d6] font-medium text-[#1a3d32]': isActive(item) }"
        >
          <component :is="item.icon" class="h-4 w-4 shrink-0" />
          <span class="flex-1">{{ item.label }}</span>
          <span
            v-if="item.badge"
            class="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E98A76] px-1.5 text-[10px] font-bold text-white"
          >
            {{ item.badge }}
          </span>
        </RouterLink>
      </nav>

      <div class="border-t border-[#1a5c45]/10 p-4">
        <div class="mb-3 flex items-center gap-3 rounded-2xl bg-white/70 px-3 py-2.5">
          <div
            class="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a5c45]/15 text-sm font-bold text-[#1a5c45]"
          >
            {{ auth.initials }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">{{ auth.displayName }}</p>
            <p class="text-xs text-[#1a3d32]/50">Parent</p>
          </div>
        </div>
        <button
          type="button"
          class="flex items-center gap-2 text-sm text-[#c45c4a] transition hover:text-red-700"
          @click="logout"
        >
          <LogOut class="h-4 w-4" />
          Déconnexion
        </button>
      </div>
    </aside>

    <main class="flex-1 overflow-y-auto px-6 py-6 md:px-8">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, provide, ref, type Ref } from 'vue'
import { useRoute, useRouter, RouterLink, RouterView } from 'vue-router'
import {
  Home,
  TrendingUp,
  Calendar,
  MessageCircle,
  BookOpen,
  LogOut,
} from 'lucide-vue-next'
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import type { NavItem, UserProfile } from '@/types/models'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const enfants = ref<UserProfile[]>([])
const selectedChildId = ref('')
const unreadCount = ref(0)

const selectedChild = computed(() =>
  enfants.value.find((e) => e.uid === selectedChildId.value || e.id === selectedChildId.value) ?? null,
)

provide('enfants', enfants)
provide('selectedChildId', selectedChildId)
provide('selectedChild', selectedChild as Ref<UserProfile | null>)
provide('setSelectedChild', (id: string) => {
  selectedChildId.value = id
})

const navItems = computed<NavItem[]>(() => [
  { to: '/parent', label: 'Tableau de bord', icon: Home, exact: true },
  { to: '/parent/evolution', label: 'Evolution', icon: TrendingUp },
  { to: '/parent/devoirs', label: 'Devoirs & échéances', icon: Calendar },
  {
    to: '/parent/messagerie',
    label: 'Messagerie',
    icon: MessageCircle,
    badge: unreadCount.value > 0 ? unreadCount.value : undefined,
  },
])

function isActive(item: NavItem) {
  if (item.exact) return route.path === item.to
  return route.path === item.to || route.path.startsWith(item.to + '/')
}

async function logout() {
  await auth.logout()
  router.push('/login')
}

let unsubMessages: Unsubscribe | null = null

onMounted(async () => {
  const ids = auth.profile?.enfantIds || []
  const loaded: UserProfile[] = []
  for (const id of ids) {
    try {
      const snap = await getDoc(doc(db, 'users', id))
      if (snap.exists()) {
        loaded.push({ uid: snap.id, id: snap.id, role: null, ...snap.data() } as UserProfile)
      } else {
        loaded.push({ uid: id, id, role: null })
      }
    } catch {
      loaded.push({ uid: id, id, role: null })
    }
  }
  enfants.value = loaded
  if (!selectedChildId.value && loaded[0]) {
    selectedChildId.value = loaded[0].uid
  }

  const uid = auth.user?.uid
  if (!uid) return
  unsubMessages = onSnapshot(
    query(collection(db, 'messages'), where('toId', '==', uid)),
    (snap) => {
      unreadCount.value = snap.docs.filter((d) => d.data().lu === false).length
    },
    () => {
      unreadCount.value = 0
    },
  )
})

onUnmounted(() => {
  unsubMessages?.()
})
</script>
