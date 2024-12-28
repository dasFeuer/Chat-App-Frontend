<template>
  <div id="app">
    <div class="header">
      <svg class="logo" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H6L4 18V4H20V16Z" fill="#2196F3"/>
      </svg>
      <h1 class="title">
        <span class="bps">{</span>BPS<span class="bps">}</span> Barun's Chat Application
      </h1>
    </div>
    <!-- Only show user info on chat routes -->
    <div v-if="showHeader" class="user-info">
      <span>Logged in as: {{ currentUser }}</span>
      <button @click="handleLogout" class="logout-btn">Logout</button>
    </div>
    <router-view></router-view>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'App',
  computed: {
    ...mapGetters(['isAuthenticated', 'currentUser']),
    showHeader() {
      // Only show the header on the chat route
      return this.$route.path === '/chat'
    }
  },
  methods: {
    ...mapActions(['logout']),
    handleLogout() {
      this.logout()
    }
  },
  watch: {
    // Redirect to login if logged out
    isAuthenticated(newValue) {
      if (!newValue && this.$route.path !== '/login' && this.$route.path !== '/register') {
        this.$router.push('/login')
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
  background-color: white;
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.logo {
  margin-right: 10px;
}

.title {
  font-size: 24px;
  color: black;
  border-bottom: 1px solid black;
  padding-bottom: 5px;
}

.bps {
  color: #2196F3;
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
  padding: 8px 16px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.logout-btn:hover {
  background-color: #da190b;
}
</style>