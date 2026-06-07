import { createRouter, createWebHashHistory } from 'vue-router'

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

export default router