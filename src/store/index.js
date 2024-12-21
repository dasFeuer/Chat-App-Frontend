// import { createStore } from 'vuex'
// import axios from 'axios'
// import SockJS from 'sockjs-client'
// import { Stomp } from '@stomp/stompjs'

// const API_URL = 'http://localhost:8080'

// const api = axios.create({
//   baseURL: API_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   }
// })

// // Request interceptor with detailed logging
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('token')
//     if (token) {
//       console.log('Adding token to request')
//       config.headers['Authorization'] = `Bearer ${token}`
//     } else {
//       console.warn('No token available for request')
//     }
//     return config
//   },
//   (error) => {
//     console.error('Request interceptor error:', error)
//     return Promise.reject(error)
//   }
// )

// export default createStore({
//   state: {
//     currentUser: null,
//     token: localStorage.getItem('token') || null,
//     users: [],
//     messages: {},
//     stompClient: null,
//     websocketConnected: false
//   },
//   mutations: {
//     setCurrentUser(state, user) {
//       console.log('Setting current user:', user)
//       state.currentUser = user
//     },
//     setToken(state, token) {
//       console.log('Setting token')
//       state.token = token
//       localStorage.setItem('token', token)
//     },
//     clearAuth(state) {
//       console.log('Clearing authentication')
//       state.currentUser = null
//       state.token = null
//       state.users = []
//       state.messages = {}
//       localStorage.removeItem('token')
//     },
//     setUsers(state, users) {
//       console.log('Setting users:', users)
//       state.users = users.filter(user => user !== state.currentUser)
//       console.log('Filtered users:', state.users)
//     },
//     setMessages(state, { username, messages }) {
//       console.log('Setting messages for:', username)
//       state.messages = {
//         ...state.messages,
//         [username]: messages
//       }
//     },
//     addMessage(state, message) {
//       console.log('Adding new message:', message)
//       const chatPartner = message.sender === state.currentUser ? message.receiver : message.sender
//       if (!state.messages[chatPartner]) {
//         state.messages[chatPartner] = []
//       }
//       state.messages[chatPartner].push(message)
//     },
//     setStompClient(state, client) {
//       state.stompClient = client
//       state.websocketConnected = client !== null
//     }
//   },
//   actions: {
//     async registerUser({ commit, dispatch }, { username, password }) {
//       try {
//         console.log('Attempting registration for:', username)
//         const response = await api.post('/auth/register', { username, password })
//         commit('setCurrentUser', response.data.username)
//         commit('setToken', response.data.token)
//         await dispatch('setupWebSocket')
//         await dispatch('fetchUsers')
//         return response.data
//       } catch (error) {
//         console.error('Registration failed:', error)
//         throw error
//       }
//     },
//     async loginUser({ commit, dispatch }, { username, password }) {
//       try {
//         console.log('Attempting login for:', username)
//         const response = await api.post('/auth/login', { username, password })
//         commit('setCurrentUser', response.data.username)
//         commit('setToken', response.data.token)
//         await dispatch('setupWebSocket')
//         await dispatch('fetchUsers')
//         return response.data
//       } catch (error) {
//         console.error('Login failed:', error)
//         throw error
//       }
//     },
//     logout({ commit, state }) {
//       console.log('Logging out')
//       if (state.stompClient) {
//         state.stompClient.deactivate()
//       }
//       commit('clearAuth')
//       commit('setStompClient', null)
//     },
//     async fetchUsers({ commit }) {
//       try {
//         console.log('Fetching users')
//         const response = await api.get('/auth/all-user')
//         console.log('Received users:', response.data)
//         if (Array.isArray(response.data)) {
//           commit('setUsers', response.data)
//           return response.data
//         } else {
//           console.error('Invalid users data format:', response.data)
//           return []
//         }
//       } catch (error) {
//         console.error('Failed to fetch users:', error)
//         if (error.response) {
//           console.error('Error response:', error.response.data)
//         }
//         return []
//       }
//     },
//     async fetchChatHistory({ commit }, receiver) {
//       try {
//         console.log('Fetching chat history for:', receiver)
//         const response = await api.get('/chat/history')
//         const messages = response.data.filter(
//           message => message.sender === receiver || message.receiver === receiver
//         )
//         commit('setMessages', { username: receiver, messages })
//         return messages
//       } catch (error) {
//         console.error('Failed to fetch chat history:', error)
//         throw error
//       }
//     },
//     async sendChatMessage({ state, commit }, { receiver, content }) {
//       if (state.stompClient && state.stompClient.connected) {
//         console.log(`Sending message to ${receiver}:`, content)
//         const message = {
//           sender: state.currentUser,
//           receiver: receiver,
//           content: content
//         }
//         state.stompClient.publish({
//           destination: "/app/chat.send",
//           body: JSON.stringify(message)
//         })
//         commit('addMessage', message)
//       } else {
//         console.error("WebSocket is not connected")
//         throw new Error("WebSocket is not connected")
//       }
//     },
//     setupWebSocket({ commit, state, dispatch }) {
//       console.log('Setting up WebSocket connection...')
//       const socket = new SockJS(`${API_URL}/ws`)
//       const stompClient = Stomp.over(socket)

//       // Enable STOMP debug logging
//       stompClient.debug = function(str) {
//         console.log('STOMP: ', str)
//       }

//       const headers = {
//         Authorization: `Bearer ${state.token}`
//       }

//       stompClient.connect(headers, 
//         frame => {
//           console.log('WebSocket connected:', frame)
//           commit('setStompClient', stompClient)
          
//           // Subscribe to user's message queue
//           const subscription = stompClient.subscribe(
//             `/user/${state.currentUser}/queue/messages`,
//             message => {
//               console.log('Received message:', message.body)
//               try {
//                 const receivedMessage = JSON.parse(message.body)
//                 commit('addMessage', receivedMessage)
//               } catch (error) {
//                 console.error('Error parsing message:', error)
//               }
//             }
//           )
          
//           console.log('Subscribed to:', subscription)
//           dispatch('fetchUsers')
//         },
//         error => {
//           console.error('STOMP error:', error)
//           commit('setStompClient', null)
//         }
//       )
//     }
//   },
//   getters: {
//     isAuthenticated: state => !!state.token,
//     currentUser: state => state.currentUser,
//     otherUsers: state => {
//       console.log('Getting other users from:', state.users)
//       return state.users.filter(user => user !== state.currentUser)
//     },
//     messagesByUser: state => username => state.messages[username] || []
//   }
// })

import { createStore } from 'vuex'
import axios from 'axios'
import SockJS from 'sockjs-client'
import { Stomp } from '@stomp/stompjs'

const API_URL = 'http://localhost:8080'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('Request interceptor error:', error)
    return Promise.reject(error)
  }
)

export default createStore({
  state: {
    currentUser: null,
    token: localStorage.getItem('token') || null,
    users: [],
    messages: {},
    stompClient: null,
    websocketConnected: false,
    messageIds: new Set()
  },
  mutations: {
    setCurrentUser(state, user) {
      state.currentUser = user
    },
    setToken(state, token) {
      state.token = token
      localStorage.setItem('token', token)
    },
    clearAuth(state) {
      state.currentUser = null
      state.token = null
      state.users = []
      state.messages = {}
      state.messageIds.clear()
      localStorage.removeItem('token')
    },
    setUsers(state, users) {
      state.users = users.filter(user => user !== state.currentUser)
    },
    setMessages(state, { username, messages }) {
      const existingIds = new Set()
      messages.forEach(msg => {
        const messageId = `${msg.sender}-${msg.receiver}-${msg.content}-${msg.timestamp}`
        existingIds.add(messageId)
      })
      state.messageIds = existingIds
      
      state.messages = {
        ...state.messages,
        [username]: messages
      }
    },
    addMessage(state, message) {
      const chatPartner = message.sender === state.currentUser ? message.receiver : message.sender
      const messageId = `${message.sender}-${message.receiver}-${message.content}-${message.timestamp || Date.now()}`
      
      if (state.messageIds.has(messageId)) {
        return
      }
      
      state.messageIds.add(messageId)
      
      if (!state.messages[chatPartner]) {
        state.messages[chatPartner] = []
      }
      
      state.messages[chatPartner].push({
        ...message,
        timestamp: message.timestamp || new Date().toISOString()
      })
    },
    setStompClient(state, client) {
      state.stompClient = client
      state.websocketConnected = client !== null
    }
  },
  actions: {
    async loginUser({ commit, dispatch }, { username, password }) {
      try {
        const response = await api.post('/auth/login', { username, password })
        commit('setCurrentUser', response.data.username)
        commit('setToken', response.data.token)
        await dispatch('setupWebSocket')
        await dispatch('fetchUsers')
        return response.data
      } catch (error) {
        console.error('Login failed:', error)
        throw error
      }
    },
    logout({ commit, state }) {
      if (state.stompClient) {
        state.stompClient.deactivate()
      }
      commit('clearAuth')
      commit('setStompClient', null)
    },
    async fetchUsers({ commit }) {
      try {
        const response = await api.get('/auth/all-user')
        if (Array.isArray(response.data)) {
          commit('setUsers', response.data)
          return response.data
        }
        return []
      } catch (error) {
        console.error('Failed to fetch users:', error)
        return []
      }
    },
    async fetchChatHistory({ commit }, receiver) {
      try {
        const response = await api.get('/chat/history')
        const messages = response.data.filter(
          message => message.sender === receiver || message.receiver === receiver
        )
        commit('setMessages', { username: receiver, messages })
        return messages
      } catch (error) {
        console.error('Failed to fetch chat history:', error)
        throw error
      }
    },
    async sendChatMessage({ state, commit }, { receiver, content }) {
      if (state.stompClient && state.stompClient.connected) {
        const message = {
          sender: state.currentUser,
          receiver: receiver,
          content: content,
          timestamp: new Date().toISOString()
        }
        
        commit('addMessage', message)
        
        state.stompClient.publish({
          destination: "/app/chat.send",
          body: JSON.stringify(message)
        })
      } else {
        throw new Error("WebSocket is not connected")
      }
    },
    setupWebSocket({ commit, state, dispatch }) {
      const socket = new SockJS(`${API_URL}/ws`)
      const stompClient = Stomp.over(socket)

      const headers = {
        Authorization: `Bearer ${state.token}`
      }

      stompClient.connect(headers, 
        () => {
          commit('setStompClient', stompClient)
          
          stompClient.subscribe(
            `/user/${state.currentUser}/queue/messages`,
            message => {
              try {
                const receivedMessage = JSON.parse(message.body)
                if (receivedMessage.sender !== state.currentUser) {
                  commit('addMessage', receivedMessage)
                }
              } catch (error) {
                console.error('Error parsing message:', error)
              }
            }
          )
          
          dispatch('fetchUsers')
        },
        error => {
          console.error('STOMP error:', error)
          commit('setStompClient', null)
        }
      )
    }
  },
  getters: {
    isAuthenticated: state => !!state.token,
    currentUser: state => state.currentUser,
    otherUsers: state => state.users.filter(user => user !== state.currentUser),
    messagesByUser: state => username => state.messages[username] || []
  }
})