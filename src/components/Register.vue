<template>
    <div class="register">
      <h2>Register</h2>
      <form @submit.prevent="register">
        <input v-model="username" type="text" placeholder="Username" required>
        <input v-model="password" type="password" placeholder="Password" required>
        <button type="submit">Register</button>
      </form>
      <p>Already have an account? <router-link to="/login">Login</router-link></p>
    </div>
  </template>
  
  <script>
  import { mapActions } from 'vuex'
  
  export default {
    name: 'RegisterForm',
    data() {
      return {
        username: '',
        password: ''
      }
    },
    methods: {
      ...mapActions(['registerUser']),
      async register() {
        try {
          await this.registerUser({ username: this.username, password: this.password })
          this.$router.push('/chat')
        } catch (error) {
          console.error('Registration failed:', error)
          alert('Registration failed. Please try again.')
        }
      }
    }
  }
  </script>
  
  <style scoped>
  .register {
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
  
  