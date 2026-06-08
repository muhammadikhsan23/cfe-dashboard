import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue')
  },
  {
    path: '/',
    component: () => import('../views/LayoutView.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('../views/DashboardView.vue')
      },
      {
        path: 'kanban',
        name: 'Kanban',
        component: () => import('../views/KanbanView.vue')
      },
      {
        path: 'projects',
        name: 'Projects',
        component: () => import('../views/ProjectsView.vue')
      },
      {
        path: 'developers',
        name: 'Developers',
        component: () => import('../views/DevelopersView.vue')
      },
      {
        path: 'workload',
        name: 'Workload',
        component: () => import('../views/WorkloadTimelineView.vue')
      },
      {
        path: 'effectiveness',
        name: 'Effectiveness',
        component: () => import('../views/EffectivenessView.vue')
      },
      {
        path: 'analytics',
        name: 'Analytics',
        component: () => import('../views/AnalyticsView.vue')
      },
      {
        path: 'admin',
        name: 'Admin',
        component: () => import('../views/AdminView.vue'),
        meta: { requiresManager: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Wait for auth to initialize
  if (authStore.loading) {
    await new Promise(resolve => {
      const unwatch = setInterval(() => {
        if (!authStore.loading) {
          clearInterval(unwatch)
          resolve()
        }
      }, 100)
    })
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'Login' })
  }

  // Check if route requires manager role
  if (to.meta.requiresManager && !authStore.isManager) {
    return next({ name: 'Dashboard' })
  }

  next()
})

export default router
