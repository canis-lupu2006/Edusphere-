import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore, ROLE_ROUTES } from '@/stores/auth'
import type { UserRole } from '@/types/models'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/login' },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/auto-login',
    name: 'auto-login',
    component: () => import('@/views/AutoLoginView.vue'),
    meta: { public: true },
  },

  // ── Élève ──────────────────────────────────────────────
  {
    path: '/student',
    component: () => import('@/views/student/StudentLayout.vue'),
    meta: { requiresAuth: true, roles: ['eleve'] satisfies UserRole[] },
    children: [
      { path: '', name: 'student', component: () => import('@/views/student/StudentDashboard.vue') },
      { path: 'cours', name: 'student-courses', component: () => import('@/views/student/StudentCourses.vue') },
      { path: 'cours/:id', name: 'student-course', component: () => import('@/views/student/StudentCourseDetail.vue') },
      { path: 'exercices', name: 'student-exercises', component: () => import('@/views/student/StudentExercises.vue') },
      { path: 'exercices/:id', name: 'student-exercise', component: () => import('@/components/ExerciseView.vue') },
      { path: 'tuteur', name: 'student-tutor', component: () => import('@/views/student/StudentTutor.vue') },
      { path: 'progression', name: 'student-progress', component: () => import('@/views/student/StudentProgress.vue') },
      { path: 'groupes', name: 'student-groups', component: () => import('@/views/student/StudentGroups.vue') },
      { path: 'tickets', name: 'student-tickets', component: () => import('@/views/student/StudentTickets.vue') },
      { path: 'epreuves', name: 'student-exam-bank', component: () => import('@/views/student/StudentExamBank.vue') },
    ],
  },

  // ── Professeur (maquettes) ─────────────────────────────
  {
    path: '/teacher',
    component: () => import('@/views/teacher/TeacherLayout.vue'),
    meta: { requiresAuth: true, roles: ['enseignant'] satisfies UserRole[] },
    children: [
      { path: '', name: 'teacher', component: () => import('@/views/teacher/TeacherDashboard.vue') },
      { path: 'cours', name: 'teacher-courses', component: () => import('@/views/teacher/TeacherCourses.vue') },
      { path: 'comprehension', name: 'teacher-comprehension', component: () => import('@/views/teacher/TeacherComprehension.vue') },
      { path: 'programme', name: 'teacher-programme', component: () => import('@/views/teacher/TeacherProgramme.vue') },
      { path: 'contenus', name: 'teacher-contenus', component: () => import('@/views/teacher/TeacherContenus.vue') },
      { path: 'devoirs', name: 'teacher-devoirs', component: () => import('@/views/teacher/TeacherDevoirs.vue') },
      { path: 'tickets', name: 'teacher-tickets', component: () => import('@/views/teacher/TeacherTickets.vue') },
    ],
  },

  // ── Parent (maquettes) ─────────────────────────────────
  {
    path: '/parent',
    component: () => import('@/views/parent/ParentLayout.vue'),
    meta: { requiresAuth: true, roles: ['parent'] satisfies UserRole[] },
    children: [
      { path: '', name: 'parent', component: () => import('@/views/parent/ParentDashboard.vue') },
      { path: 'evolution', name: 'parent-evolution', component: () => import('@/views/parent/ParentEvolution.vue') },
      { path: 'devoirs', name: 'parent-devoirs', component: () => import('@/views/parent/ParentDevoirs.vue') },
      { path: 'messagerie', name: 'parent-messagerie', component: () => import('@/views/parent/ParentMessagerie.vue') },
    ],
  },

  // ── Administration (maquettes) ─────────────────────────
  {
    path: '/admin',
    component: () => import('@/views/admin/AdminLayout.vue'),
    meta: { requiresAuth: true, roles: ['admin'] satisfies UserRole[] },
    children: [
      { path: '', name: 'admin', component: () => import('@/views/admin/AdminDashboard.vue') },
      { path: 'users', name: 'admin-users', component: () => import('@/views/admin/AdminUsers.vue') },
      { path: 'emploi-du-temps', name: 'admin-schedule', component: () => import('@/views/admin/AdminSchedule.vue') },
      { path: 'statistiques', name: 'admin-stats', component: () => import('@/views/admin/AdminStats.vue') },
      { path: 'supervision', name: 'admin-supervision', component: () => import('@/views/admin/AdminSupervision.vue') },
    ],
  },

  // ── Ministère (maquettes) ──────────────────────────────
  {
    path: '/ministere',
    component: () => import('@/views/ministere/MinistereLayout.vue'),
    meta: { requiresAuth: true, roles: ['ministere'] satisfies UserRole[] },
    children: [
      { path: '', name: 'ministere', component: () => import('@/views/ministere/MinistereDashboard.vue') },
      { path: 'etablissements', name: 'ministere-schools', component: () => import('@/views/ministere/MinistereSchools.vue') },
      { path: 'effectifs', name: 'ministere-effectifs', component: () => import('@/views/ministere/MinistereEffectifs.vue') },
      { path: 'statistiques', name: 'ministere-stats', component: () => import('@/views/ministere/MinistereStats.vue') },
      { path: 'indicateurs', name: 'ministere-indicateurs', component: () => import('@/views/ministere/MinistereIndicateurs.vue') },
      { path: 'notions', name: 'ministere-notions', component: () => import('@/views/ministere/MinistereNotions.vue') },
      { path: 'programmes', name: 'ministere-programmes', component: () => import('@/views/ministere/MinistereProgrammes.vue') },
      { path: 'supervision', name: 'ministere-supervision', component: () => import('@/views/ministere/MinistereSupervision.vue') },
      { path: 'tickets', name: 'ministere-tickets', component: () => import('@/views/ministere/MinistereTickets.vue') },
      { path: 'rapports', name: 'ministere-rapports', component: () => import('@/views/ministere/MinistereRapports.vue') },
      { path: 'parametres', name: 'ministere-parametres', component: () => import('@/views/ministere/MinistereParametres.vue') },
    ],
  },

  { path: '/:pathMatch(.*)*', redirect: '/login' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  await authStore.ready

  if (authStore.isAuthenticated && authStore.role === null && authStore.user) {
    await Promise.race([
      authStore.fetchProfile(authStore.user.uid),
      new Promise((r) => setTimeout(r, 2000)),
    ])
  }

  if (to.meta.public) return true

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (to.meta.requiresAuth && !authStore.role) {
    return { path: '/login', query: { error: 'no-role' } }
  }

  const allowed = to.matched.find((r) => r.meta.roles)?.meta.roles as UserRole[] | undefined
  if (allowed && authStore.role && !allowed.includes(authStore.role)) {
    return ROLE_ROUTES[authStore.role] || '/login'
  }

  return true
})

export default router
