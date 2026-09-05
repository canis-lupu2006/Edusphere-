import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithCustomToken,
  signOut,
  type User,
  type AuthError,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase'
import type { UserProfile, UserRole } from '@/types/models'

/** Mapping rôle Firestore → route dashboard */
export const ROLE_ROUTES: Record<UserRole, string> = {
  eleve: '/student',
  enseignant: '/teacher',
  parent: '/parent',
  admin: '/admin',
  ministere: '/ministere',
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const profile = ref<UserProfile | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value)
  const role = computed(() => profile.value?.role ?? null)
  const displayName = computed(
    () =>
      profile.value?.displayName ||
      profile.value?.nom ||
      user.value?.email ||
      'Utilisateur',
  )
  const initials = computed(() => {
    const name = displayName.value
    return name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  })

  let resolveReady: (() => void) | null = null
  let readySettled = false
  const ready = new Promise<void>((resolve) => {
    resolveReady = resolve
  })

  function markReady() {
    if (readySettled) {
      loading.value = false
      return
    }
    readySettled = true
    loading.value = false
    resolveReady?.()
    resolveReady = null
  }

  function init() {
    const bootTimeout = window.setTimeout(() => {
      console.warn('Auth: timeout démarrage')
      markReady()
    }, 2500)

    onAuthStateChanged(auth, (firebaseUser) => {
      window.clearTimeout(bootTimeout)
      user.value = firebaseUser

      // Débloque l'UI immédiatement (évite l'écran "Chargement…" bloqué)
      markReady()

      if (firebaseUser) {
        void fetchProfile(firebaseUser.uid)
      } else {
        profile.value = null
      }
    })
  }

  async function fetchProfile(uid: string) {
    try {
      const snap = await getDoc(doc(db, 'users', uid))
      profile.value = snap.exists()
        ? ({ uid, ...snap.data() } as UserProfile)
        : { uid, role: null }
    } catch (e) {
      console.error('Erreur profil utilisateur:', e)
      profile.value = { uid, role: null }
    }
  }

  async function loginWithEmail(email: string, password: string) {
    error.value = null
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      await fetchProfile(cred.user.uid)
      return profile.value
    } catch (e) {
      error.value = mapAuthError(e)
      throw e
    }
  }

  async function loginWithToken(token: string) {
    error.value = null
    try {
      const cred = await signInWithCustomToken(auth, token)
      await fetchProfile(cred.user.uid)
      return profile.value
    } catch (e) {
      error.value = mapAuthError(e)
      throw e
    }
  }

  async function logout() {
    await signOut(auth)
    profile.value = null
    user.value = null
  }

  function dashboardPath() {
    const r = role.value
    return (r && ROLE_ROUTES[r]) || '/login'
  }

  return {
    user,
    profile,
    loading,
    error,
    isAuthenticated,
    role,
    displayName,
    initials,
    ready,
    init,
    fetchProfile,
    loginWithEmail,
    loginWithToken,
    logout,
    dashboardPath,
  }
})

function mapAuthError(e: unknown): string {
  const err = e as AuthError
  const code = err?.code || ''
  const messages: Record<string, string> = {
    'auth/invalid-email': 'Adresse e-mail invalide.',
    'auth/user-disabled': 'Ce compte est désactivé.',
    'auth/user-not-found': 'Aucun compte trouvé pour cet e-mail.',
    'auth/wrong-password': 'Mot de passe incorrect.',
    'auth/invalid-credential': 'Identifiants incorrects.',
    'auth/invalid-custom-token': 'Token de connexion invalide.',
    'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard.',
  }
  return messages[code] || err?.message || "Erreur d'authentification."
}
