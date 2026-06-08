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
          <label for="email">Email</label>
          <InputText
            id="email"
            v-model="email"
            type="email"
            placeholder="Enter your email"
            @keyup.enter="handleLogin"
          />
        </div>

        <div class="input-group">
          <label for="password">Password</label>
          <Password
            id="password"
            v-model="password"
            placeholder="Enter your password"
            :feedback="false"
            :toggleMask="true"
            @keyup.enter="handleLogin"
            class="password-input"
          />
        </div>
        
        <Button
          label="Login"
          icon="pi pi-sign-in"
          :loading="loading"
          @click="handleLogin"
          class="login-btn"
        />
        
        <div class="signup-link">
          <p>Don't have an account? <a href="#" @click.prevent="showSignup = true">Sign up</a></p>
        </div>
        
        <p v-if="error" class="error-msg">{{ error }}</p>
      </div>
    </div>

    <!-- Signup Modal -->
    <Dialog v-model:visible="showSignup" header="Create Account" :style="{ width: '420px' }">
      <div class="signup-form">
        <div class="input-group">
          <label for="signup-name">Name</label>
          <InputText id="signup-name" v-model="signupForm.name" placeholder="Full name" />
        </div>
        <div class="input-group">
          <label for="signup-email">Email</label>
          <InputText id="signup-email" v-model="signupForm.email" type="email" placeholder="Email address" />
        </div>
        <div class="input-group">
          <label for="signup-password">Password</label>
          <Password id="signup-password" v-model="signupForm.password" :feedback="true" :toggleMask="true" />
        </div>
        <div class="input-group">
          <label for="signup-role">Role</label>
          <Dropdown id="signup-role" v-model="signupForm.role" :options="roleOptions" optionLabel="label" optionValue="value" placeholder="Select your role" class="role-dropdown" />
        </div>
        <Button label="Create Account" icon="pi pi-user-plus" @click="handleSignup" :loading="loading" class="signup-btn" />
        <p v-if="signupError" class="error-msg">{{ signupError }}</p>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { auth, db } from '../lib/supabase'

const router = useRouter()
const authStore = useAuthStore()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const showSignup = ref(false)
const signupForm = ref({ name: '', email: '', password: '', role: 'web' })
const signupError = ref('')

const roleOptions = [
  { label: 'Web Developer', value: 'web' },
  { label: 'Mobile Developer', value: 'mobile' },
  { label: 'Shopify Developer', value: 'shopify' },
  { label: 'Manager', value: 'manager' }
]

async function handleLogin() {
  if (!email.value || !password.value) {
    error.value = 'Please enter email and password'
    return
  }
  
  loading.value = true
  error.value = ''
  
  const result = await authStore.login(email.value, password.value)
  
  if (result.success) {
    router.push('/')
  } else {
    error.value = result.error
  }
  
  loading.value = false
}

async function handleSignup() {
  if (!signupForm.value.name || !signupForm.value.email || !signupForm.value.password) {
    signupError.value = 'All fields are required'
    return
  }
  if (signupForm.value.password.length < 6) {
    signupError.value = 'Password must be at least 6 characters'
    return
  }

  loading.value = true
  signupError.value = ''

  const { data, error: authError } = await auth.signUp(
    signupForm.value.email,
    signupForm.value.password,
    signupForm.value.name,
    signupForm.value.role
  )

  if (authError) {
    signupError.value = authError.message
  } else if (data?.user) {
    // Create user profile in users table
    await db.create('users', {
      id: data.user.id,
      name: signupForm.value.name,
      role: signupForm.value.role
    })
    showSignup.value = false
    error.value = 'Account created! Please check your email to verify, then login.'
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
  margin-bottom: 16px;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
}

.input-group input,
.input-group .p-inputtext {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 15px;
  transition: border-color 0.2s;
}

.input-group :deep(.p-password) {
  width: 100%;
}

.input-group :deep(.p-password-input) {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 15px;
  transition: border-color 0.2s;
}

.password-input {
  width: 100%;
}

.input-group :deep(input:focus) {
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
  margin-top: 8px;
}

.signup-link {
  text-align: center;
  margin-top: 16px;
}

.signup-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.signup-link a:hover {
  text-decoration: underline;
}

.signup-form .input-group {
  margin-bottom: 12px;
}

.signup-btn {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  color: white;
  cursor: pointer;
  margin-top: 16px;
}

.role-dropdown {
  width: 100%;
}

.error-msg {
  color: #ef4444;
  font-size: 14px;
  margin-top: 12px;
  text-align: center;
}
</style>