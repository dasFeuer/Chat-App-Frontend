<template>
  <div id="app">
    <h1>Barun's Chat Application</h1>
    <div v-if="isAuthenticated">
      <div class="user-info">
        <span>Logged in as: {{ currentUser }}</span>
        <button @click="handleLogout" class="logout-btn">Logout</button>
      </div>
      <router-view></router-view>
    </div>
    <router-view v-else></router-view>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'App',
  computed: {
    ...mapGetters(['isAuthenticated', 'currentUser'])
  },
  methods: {
    ...mapActions(['logout']),
    handleLogout() {
      this.logout()
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