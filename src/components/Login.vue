<template>
    <div class="login">
      <h2>Login</h2>
      <form @submit.prevent="login">
        <input v-model="username" type="text" placeholder="Username" required>
        <input v-model="password" type="password" placeholder="Password" required>
        <button type="submit">Login</button>
      </form>
      <p>Don't have an account? <router-link to="/register">Register</router-link></p>
    </div>
  </template>
  
  <script>
  import { mapActions } from 'vuex'
  
  export default {
    name: 'LoginForm',
    data() {
      return {
        username: '',
        password: ''
      }
    },
    methods: {
      ...mapActions(['loginUser']),
      async login() {
        try {
          await this.loginUser({ username: this.username, password: this.password })
          this.$router.push('/chat')
        } catch (error) {
          console.error('Login failed:', error)
          alert('Login failed. Please try again.')
        }
      }
    }
  }
  </script>
  
  <style scoped>
  .login {
    max-width: 300px;
    margin: 0 auto;
  }
  input {
    width: 100%;
    padding: 10px;
    margin-bottom: 10px;
  }
  button {
    width: 100%;
    padding: 10px;
    background-color: #4CAF50;
    color: white;
    border: none;
    cursor: pointer;
  }
  </style>
  
  