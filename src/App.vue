<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { useDataStore } from './stores/data'

const authStore = useAuthStore()
const dataStore = useDataStore()

onMounted(async () => {
  await authStore.init()
  if (authStore.isAuthenticated) {
    dataStore.loadAll()
    dataStore.setupRealtimeSync()
  }
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #f5f7fa;
}

:root {
  --primary-color: #3B82F6;
  --success-color: #10B981;
  --warning-color: #F59E0B;
  --danger-color: #EF4444;
  --info-color: #06B6D4;
}

.text-success { color: var(--success-color); }
.text-warning { color: var(--warning-color); }
.text-danger { color: var(--danger-color); }
.text-info { color: var(--info-color); }
.text-primary { color: var(--primary-color); }

.bg-success { background-color: var(--success-color); }
.bg-warning { background-color: var(--warning-color); }
.bg-danger { background-color: var(--danger-color); }
.bg-info { background-color: var(--info-color); }
.bg-primary { background-color: var(--primary-color); }

.kanban-column {
  min-height: 400px;
  background: #f1f5f9;
  border-radius: 12px;
  padding: 16px;
}

.kanban-card {
  background: white;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  cursor: grab;
  transition: transform 0.2s, box-shadow 0.2s;
}

.kanban-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.stat-card .icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.developer-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.developer-card:hover {
  transform: translateY(-2px);
}

.progress-bar-custom {
  height: 8px;
  border-radius: 4px;
  background: #e5e7eb;
  overflow: hidden;
}

.progress-bar-custom .fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.project-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border-left: 4px solid;
}

.project-card.on-track { border-left-color: var(--success-color); }
.project-card.at-risk { border-left-color: var(--warning-color); }
.project-card.blocked { border-left-color: var(--danger-color); }
.project-card.completed { border-left-color: var(--info-color); }

.size-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 12px;
}

.size-S { background: #dcfce7; color: #166534; }
.size-M { background: #dbeafe; color: #1e40af; }
.size-L { background: #fef3c7; color: #92400e; }
.size-XL { background: #fee2e2; color: #991b1b; }

.priority-urgent { color: #EF4444; }
.priority-high { color: #F97316; }
.priority-medium { color: #3B82F6; }
.priority-low { color: #6B7280; }

.effectiveness-rating {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
}

.rating-top { background: linear-gradient(135deg, #10B981, #059669); color: white; }
.rating-strong { background: linear-gradient(135deg, #34D399, #10B981); color: white; }
.rating-solid { background: linear-gradient(135deg, #FBBF24, #F59E0B); color: white; }
.rating-needs-improvement { background: linear-gradient(135deg, #FB923C, #F97316); color: white; }
.rating-underperformer { background: linear-gradient(135deg, #F87171, #EF4444); color: white; }
</style>