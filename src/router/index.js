import { createRouter, createWebHistory } from 'vue-router'
import LoginForm from '../components/Login.vue'
import RegisterForm from '../components/Register.vue'
import ChatRoom from '../components/Chat.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginForm, name: 'Login' },
  { path: '/register', component: RegisterForm, name: 'Register' },
  { 
    path: '/chat', 
    component: ChatRoom, 
    name: 'Chat',
    meta: { requiresAuth: true } 
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

router.beforeEach((to, from, next) => {
  console.log('Navigating to:', to.path)
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!localStorage.getItem('token')) {
      next({ name: 'Login' })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router

