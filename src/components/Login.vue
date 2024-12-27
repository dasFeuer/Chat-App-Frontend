<template>
  <div class="login-container">
    <h2>Login</h2>
    <form @submit.prevent="login" class="login-form">
      <input v-model="username" type="text" placeholder="Username" required>
      <input v-model="password" type="password" placeholder="Password" required>
      <button type="submit" :disabled="isLoading">
        {{ isLoading ? 'Logging in...' : 'Login' }}
      </button>
    </form>
    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    <p class="register-link">Don't have an account? <router-link to="/register">Register</router-link></p>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'

export default {
  name: 'LoginForm',
  data() {
    return {
      username: '',
      password: '',
      isLoading: false,
      errorMessage: ''
    }
  },
  computed: {
    ...mapGetters(['isAuthenticated'])
  },
  methods: {
    ...mapActions(['loginUser']),
    async login() {
      this.isLoading = true
      this.errorMessage = ''
      try {
        await this.loginUser({ username: this.username, password: this.password })
        this.$router.push('/chat')
      } catch (error) {
        console.error('Login failed:', error)
        this.errorMessage = 'Login failed. Please try again.'
      } finally {
        this.isLoading = false
      }
    }
  },
  created() {
    if (this.isAuthenticated) {
      this.$router.push('/chat')
    }
  }
}
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
}

input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover:not(:disabled) {
  background-color: #45a049;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.register-link {
  margin-top: 15px;
  text-align: center;
}

.register-link a {
  color: #4CAF50;
  text-decoration: none;
}

.register-link a:hover {
  text-decoration: underline;
}

.error-message {
  color: #d32f2f;
  margin-top: 10px;
  text-align: center;
}
</style>