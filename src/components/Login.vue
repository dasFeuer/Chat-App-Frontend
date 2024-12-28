<template>
  <div class="login-container">
    <div class="form-container">
      <h2>Log in to your account</h2>
      <form @submit.prevent="login">
        <div class="form-group">
          <label for="username">Username</label>
          <input
            id="username"
            v-model="username"
            type="text"
            required
          >
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            required
          >
        </div>
        <div class="form-group checkbox-group">
          <input
            id="showPassword"
            type="checkbox"
            v-model="showPassword"
          >
          <label for="showPassword">Show password</label>
        </div>
        <button type="submit" :disabled="isLoading">
          <span v-if="isLoading" class="spinner"></span>
          {{ isLoading ? 'Logging in...' : 'Log in' }}
        </button>
      </form>
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
      <p class="register-link">
        Don't have an account?
        <router-link to="/register">Register</router-link>
      </p>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'Login',
  setup() {
    const store = useStore()
    const router = useRouter()

    const username = ref('')
    const password = ref('')
    const isLoading = ref(false)
    const errorMessage = ref('')
    const showPassword = ref(false)

    const login = async () => {
      isLoading.value = true
      errorMessage.value = ''
      try {
        await store.dispatch('loginUser', {
          username: username.value,
          password: password.value
        })
        router.push('/chat')
      } catch (error) {
        console.error('Login failed:', error)
        errorMessage.value = 'Invalid username or password. Please try again.'
      } finally {
        isLoading.value = false
      }
    }

    return {
      username,
      password,
      isLoading,
      errorMessage,
      login,
      showPassword
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.form-container {
  background-color: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 24px;
  font-size: 24px;
  font-weight: bold;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 5px;
  color: #555;
  font-size: 14px;
}

input[type="text"],
input[type="password"] {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

input[type="text"]:focus,
input[type="password"]:focus {
  outline: none;
  border-color: #4a5568;
  box-shadow: 0 0 0 3px rgba(74, 85, 104, 0.2);
}

.checkbox-group {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.checkbox-group input[type="checkbox"] {
  margin-right: 8px;
}

.checkbox-group label {
  margin-bottom: 0;
  font-size: 14px;
  color: #4a5568;
}

button {
  width: 100%;
  padding: 10px;
  background-color: #4a5568;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #2d3748;
}

button:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
}

.error-message {
  color: #e53e3e;
  text-align: center;
  margin-top: 10px;
  padding: 10px;
  background-color: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 4px;
}

.register-link {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #555;
}

.register-link a {
  color: #4a5568;
  text-decoration: none;
  font-weight: bold;
}

.register-link a:hover {
  text-decoration: underline;
}

.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
  margin-right: 10px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
