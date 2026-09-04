import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore, ROLE_ROUTES } from '@/stores/auth'
import type { UserRole } from '@/types/models'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login',
  },
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
      { path: 'tickets', name: 'student-tickets', component: () => import('@/views/student/StudentTickets.vue') },
    ],
  },

  {
    path: '/teacher',
    component: () => import('@/views/teacher/TeacherLayout.vue'),
    meta: { requiresAuth: true, roles: ['enseignant'] satisfies UserRole[] },
    children: [
      { path: '', name: 'teacher', component: () => import('@/views/teacher/TeacherDashboard.vue') },
      { path: 'tickets', name: 'teacher-tickets', component: () => import('@/views/teacher/TeacherTickets.vue') },
      { path: 'cours', name: 'teacher-courses', component: () => import('@/views/teacher/TeacherCourses.vue') },
      { path: 'exercices', name: 'teacher-exercises', component: () => import('@/views/teacher/TeacherExercises.vue') },
      { path: 'progression', name: 'teacher-progress', component: () => import('@/views/teacher/TeacherProgress.vue') },
    ],
  },

  {
    path: '/parent',
    component: () => import('@/views/parent/ParentLayout.vue'),
    meta: { requiresAuth: true, roles: ['parent'] satisfies UserRole[] },
    children: [
      { path: '', name: 'parent', component: () => import('@/views/parent/ParentDashboard.vue') },
      { path: 'annonces', name: 'parent-announcements', component: () => import('@/views/parent/ParentAnnouncements.vue') },
    ],
  },

  {
    path: '/admin',
    component: () => import('@/views/admin/AdminLayout.vue'),
    meta: { requiresAuth: true, roles: ['admin'] satisfies UserRole[] },
    children: [
      { path: '', name: 'admin', component: () => import('@/views/admin/AdminDashboard.vue') },
      { path: 'users', name: 'admin-users', component: () => import('@/views/admin/AdminUsers.vue') },
      { path: 'classes', name: 'admin-classes', component: () => import('@/views/admin/AdminClasses.vue') },
    ],
  },

  {
    path: '/ministere',
    component: () => import('@/views/ministere/MinistereLayout.vue'),
    meta: { requiresAuth: true, roles: ['ministere'] satisfies UserRole[] },
    children: [
      { path: '', name: 'ministere', component: () => import('@/views/ministere/MinistereDashboard.vue') },
      { path: 'etablissements', name: 'ministere-schools', component: () => import('@/views/ministere/MinistereSchools.vue') },
      { path: 'statistiques', name: 'ministere-stats', component: () => import('@/views/ministere/MinistereStats.vue') },
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

  if (to.meta.public) {
    if (to.name === 'login' && authStore.isAuthenticated && authStore.role) {
      return authStore.dashboardPath()
    }
    return true
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  const allowed = to.matched.find((r) => r.meta.roles)?.meta.roles
  if (allowed && authStore.role && !allowed.includes(authStore.role)) {
    return ROLE_ROUTES[authStore.role] || '/login'
  }

  return true
})

export default router
