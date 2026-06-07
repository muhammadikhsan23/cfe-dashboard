<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="logo">
          <i class="pi pi-chart-line"></i>
        </div>
        <h1>CFE Dashboard</h1>
        <p>Customer Facing Engineering</p>
      </div>
      
      <div class="login-form">
        <div class="input-group">
          <label for="pin">Enter PIN Code</label>
          <InputText
            id="pin"
            v-model="pin"
            type="password"
            placeholder="Enter 4-digit PIN"
            maxlength="4"
            @keyup.enter="handleLogin"
          />
        </div>
        
        <Button
          label="Login"
          icon="pi pi-sign-in"
          :loading="loading"
          @click="handleLogin"
          class="login-btn"
        />
        
        <div class="pin-hints">
          <p class="hint-title">Demo PINs:</p>
          <div class="pin-list">
            <span class="pin-item" @click="pin = '1234'">👔 Manager: 1234</span>
            <span class="pin-item" @click="pin = '5678'">🌐 Web Dev: 5678</span>
            <span class="pin-item" @click="pin = '9012'">📱 Mobile Dev: 9012</span>
            <span class="pin-item" @click="pin = '3456'">🛒 Shopify Dev: 3456</span>
          </div>
        </div>
        
        <p v-if="error" class="error-msg">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const pin = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  if (pin.value.length !== 4) {
    error.value = 'Please enter a 4-digit PIN'
    return
  }
  
  loading.value = true
  error.value = ''
  
  const result = await authStore.login(pin.value)
  
  if (result.success) {
    router.push('/')
  } else {
    error.value = result.error
  }
  
  loading.value = false
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 24px;
  padding: 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  font-size: 28px;
  color: white;
}

h1 {
  font-size: 24px;
  color: #1f2937;
  margin-bottom: 4px;
}

.login-header p {
  color: #6b7280;
  font-size: 14px;
}

.input-group {
  margin-bottom: 24px;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
}

.input-group input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 18px;
  text-align: center;
  letter-spacing: 8px;
  transition: border-color 0.2s;
}

.input-group input:focus {
  outline: none;
  border-color: #667eea;
}

.login-btn {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  color: white;
  cursor: pointer;
}

.pin-hints {
  margin-top: 24px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
}

.hint-title {
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.pin-list {
  display: grid;
  gap: 6px;
}

.pin-item {
  font-size: 13px;
  color: #6b7280;
  cursor: pointer;
  padding: 4px 0;
}

.pin-item:hover {
  color: #667eea;
}

.error-msg {
  color: #ef4444;
  font-size: 14px;
  margin-top: 12px;
  text-align: center;
}
</style>