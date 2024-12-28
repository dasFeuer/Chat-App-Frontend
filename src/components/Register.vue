<template>
  <div class="register-container">
    <div class="form-container">
      <h2>Create an account</h2>
      <form @submit.prevent="handleSubmit">
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
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
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
        <button 
          type="submit" 
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="spinner"></span>
          {{ isLoading ? 'Registering...' : 'Register' }}
        </button>
      </form>
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
      <p class="login-link">
        Already have an account?
        <router-link to="/login">Log in</router-link>
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
  name: 'Register',
  setup() {
    const store = useStore()
    const router = useRouter()

    const username = ref('')
    const email = ref('')
    const password = ref('')
    const isLoading = ref(false)
    const errorMessage = ref('')
    const showPassword = ref(false)

    const handleSubmit = async () => {
      isLoading.value = true
      errorMessage.value = ''

      try {
        const userData = {
          username: username.value,
          email: email.value,
          password: password.value
        }

        await store.dispatch('registerUser', userData)
        router.push('/login')
      } catch (error) {
        console.error('Registration failed:', error)
        errorMessage.value = 'Registration failed. Please try again.'
      } finally {
        isLoading.value = false
      }
    }

    return {
      username,
      email,
      password,
      isLoading,
      errorMessage,
      showPassword,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.register-container {
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
  position: relative;
}

label {
  display: block;
  margin-bottom: 5px;
  color: #555;
  font-size: 14px;
  font-weight: 500;
}

input[type="text"],
input[type="email"],
input[type="password"] {
  width: 100%;
  padding: 10px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s ease;
}

input[type="text"]:focus,
input[type="email"]:focus,
input[type="password"]:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
}

.checkbox-group input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.checkbox-group label {
  margin-bottom: 0;
  font-size: 14px;
  color: #4a5568;
  cursor: pointer;
}

button {
  width: 100%;
  padding: 12px;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

button:hover:not(:disabled) {
  background-color: #5a67d8;
  transform: translateY(-1px);
}

button:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
  transform: none;
}

.error-message {
  color: #e53e3e;
  text-align: center;
  margin-top: 15px;
  padding: 10px;
  background-color: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 6px;
  font-size: 14px;
}

.login-link {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #4a5568;
}

.login-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.login-link a:hover {
  text-decoration: underline;
}

.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 480px) {
  .form-container {
    padding: 20px;
  }

  h2 {
    font-size: 20px;
  }

  .register-container {
    padding: 10px;
  }
}
</style>