<template>
  <div id="app">
    <h1>Chat Application</h1>
    <div v-if="isAuthenticated">
      <div class="user-info">
        <span>Logged in as: {{ currentUser }}</span>
        <button @click="logout" class="logout-btn">Logout</button>
      </div>
      <Chat />
    </div>
    <div v-else class="login-container">
      <h2>Login</h2>
      <form @submit.prevent="login" class="login-form">
        <input v-model="username" type="text" placeholder="Username" required>
        <input v-model="password" type="password" placeholder="Password" required>
        <button type="submit">Login</button>
      </form>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import Chat from './components/Chat.vue'

export default {
  name: 'App',
  components: {
    Chat
  },
  data() {
    return {
      username: '',
      password: ''
    }
  },
  computed: {
    ...mapGetters(['isAuthenticated', 'currentUser'])
  },
  methods: {
    ...mapActions(['loginUser', 'logout']),
    async login() {
      try {
        await this.loginUser({ username: this.username, password: this.password })
        this.username = ''
        this.password = ''
      } catch (error) {
        console.error('Login failed:', error)
        alert('Login failed. Please try again.')
      }
    }
  }
}
</script>

<style scoped>
#app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.login-container {
  max-width: 400px;
  margin: 0 auto;
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

button:hover {
  background-color: #45a049;
}

.user-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #f5f5f5;
  margin-bottom: 20px;
}

.logout-btn {
  background-color: #f44336;
}

.logout-btn:hover {
  background-color: #da190b;
}
</style>