<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <i class="pi pi-chart-line"></i>
        </div>
        <span class="logo-text">CFE</span>
      </div>
      
      <nav class="sidebar-nav">
        <router-link to="/" class="nav-item" :class="{ active: $route.path === '/' }">
          <i class="pi pi-home"></i>
          <span>Dashboard</span>
        </router-link>
        <router-link to="/kanban" class="nav-item" :class="{ active: $route.path === '/kanban' }">
          <i class="pi pi-th-large"></i>
          <span>Kanban Board</span>
        </router-link>
        <router-link to="/projects" class="nav-item" :class="{ active: $route.path === '/projects' }">
          <i class="pi pi-objects-column"></i>
          <span>Projects</span>
        </router-link>
        <router-link to="/developers" class="nav-item" :class="{ active: $route.path === '/developers' }">
          <i class="pi pi-users"></i>
          <span>Developers</span>
        </router-link>
        <router-link to="/workload" class="nav-item" :class="{ active: $route.path === '/workload' }">
          <i class="pi pi-calendar"></i>
          <span>Workload</span>
        </router-link>
        <router-link to="/effectiveness" class="nav-item" :class="{ active: $route.path === '/effectiveness' }">
          <i class="pi pi-star"></i>
          <span>Effectiveness</span>
        </router-link>
        <router-link to="/analytics" class="nav-item" :class="{ active: $route.path === '/analytics' }">
          <i class="pi pi-chart-bar"></i>
          <span>Analytics</span>
        </router-link>
        <router-link v-if="authStore.isManager" to="/admin" class="nav-item admin-link" :class="{ active: $route.path === '/admin' }">
          <i class="pi pi-cog"></i>
          <span>Admin</span>
        </router-link>
      </nav>
      
      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">{{ authStore.userName?.[0] || 'U' }}</div>
          <div class="user-details">
            <span class="user-name">{{ authStore.userName }}</span>
            <span class="user-role">{{ roleLabel }}</span>
          </div>
        </div>
        <button class="logout-btn" @click="handleLogout">
          <i class="pi pi-sign-out"></i>
        </button>
      </div>
    </aside>
    
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const roleLabel = computed(() => {
  const roles = {
    manager: 'Manager',
    web: 'Web Developer',
    mobile: 'Mobile Developer',
    shopify: 'Shopify Developer'
  }
  return roles[authStore.userRole] || authStore.userRole
})

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 260px;
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  color: white;
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  z-index: 100;
}

.sidebar-header {
  padding: 24px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.sidebar-header .logo {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
}

.sidebar-nav {
  flex: 1;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  transition: all 0.2s;
  font-size: 14px;
}

.nav-item:hover {
  background: rgba(255,255,255,0.1);
  color: white;
}

.nav-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.nav-item i {
  font-size: 18px;
}

.admin-link {
  margin-top: auto;
}

.sidebar-footer {
  padding: 16px 12px;
  border-top: 1px solid rgba(255,255,255,0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
}

.user-role {
  font-size: 11px;
  color: rgba(255,255,255,0.5);
}

.logout-btn {
  background: rgba(255,255,255,0.1);
  border: none;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.logout-btn:hover {
  background: rgba(239,68,68,0.5);
}

.main-content {
  flex: 1;
  margin-left: 260px;
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}
</style>