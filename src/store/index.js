import { createStore } from 'vuex'
import axios from 'axios'
import SockJS from 'sockjs-client'
import { Stomp } from '@stomp/stompjs'
import router from '@/router'

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

const sortMessagesById = (messages) => {
  return [...messages].sort((a, b) => a.id - b.id)
}

export default createStore({
  state: {
    currentUser: null,
    token: localStorage.getItem('token') || null,
    users: [],
    messages: {},
    stompClient: null,
    websocketConnected: false,
    selectedUser: null
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
      state.selectedUser = null
      localStorage.removeItem('token')
    },

    setUsers(state, users) {
      state.users = users.filter(user => user !== state.currentUser)
    },

    setSelectedUser(state, username) {
      state.selectedUser = username
    },

    setMessages(state, { username, messages }) {
      const filteredMessages = messages.filter(message => 
        (message.sender === state.currentUser && message.receiver === username) ||
        (message.sender === username && message.receiver === state.currentUser)
      )
      
      state.messages = {
        ...state.messages,
        [username]: sortMessagesById(filteredMessages)
      }
    },

    addMessage(state, message) {
      const chatPartner = message.sender === state.currentUser ? 
        message.receiver : message.sender

      if (!state.messages[chatPartner]) {
        state.messages[chatPartner] = []
      }

      const isDuplicate = state.messages[chatPartner].some(m => m.id === message.id)
      if (!isDuplicate) {
        state.messages[chatPartner].push(message)
        state.messages[chatPartner] = sortMessagesById(state.messages[chatPartner])
      }
    },

    updateMessage(state, updatedMessage) {
      const chatPartner = updatedMessage.sender === state.currentUser ? 
        updatedMessage.receiver : updatedMessage.sender

      if (state.messages[chatPartner]) {
        const messageIndex = state.messages[chatPartner].findIndex(msg => msg.id === updatedMessage.id)
        if (messageIndex !== -1) {
          state.messages[chatPartner].splice(messageIndex, 1, updatedMessage)
          state.messages[chatPartner] = sortMessagesById(state.messages[chatPartner])
        }
      }
    },

    deleteMessage(state, messageToDelete) {
      const chatPartner = messageToDelete.sender === state.currentUser ? 
        messageToDelete.receiver : messageToDelete.sender

      if (state.messages[chatPartner]) {
        state.messages[chatPartner] = state.messages[chatPartner].filter(
          msg => msg.id !== messageToDelete.id
        )
      }
    },

    setStompClient(state, client) {
      state.stompClient = client
      state.websocketConnected = client !== null
    }
  },

  actions: {
    async registerUser({ commit, dispatch }, { username, password, email }) {
      try {
        const response = await api.post('/auth/register', { username, password, email })
        commit('setCurrentUser', response.data.username)
        commit('setToken', response.data.token)
        await dispatch('setupWebSocket')
        await dispatch('loadAllMessages')
        await dispatch('fetchUsers')
        router.push('/chat')
        return response.data
      } catch (error) {
        console.error('Registration failed:', error)
        throw error
      }
    },

    async loginUser({ commit, dispatch }, { username, password }) {
      try {
        const response = await api.post('/auth/login', { username, password })
        commit('setCurrentUser', response.data.username)
        commit('setToken', response.data.token)
        await dispatch('setupWebSocket')
        await dispatch('loadAllMessages')
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
      router.push('/login')
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

    async loadAllMessages({ commit, state }) {
      try {
        const response = await api.get('/chat/history')
        const messagesByUser = {}
        
        response.data.forEach(message => {
          const chatPartner = message.sender === state.currentUser ? 
            message.receiver : message.sender
            
          if (!messagesByUser[chatPartner]) {
            messagesByUser[chatPartner] = []
          }
          messagesByUser[chatPartner].push(message)
        })

        Object.entries(messagesByUser).forEach(([username, messages]) => {
          commit('setMessages', { username, messages })
        })
      } catch (error) {
        console.error('Failed to load messages:', error)
        throw error
      }
    },

    async fetchChatHistory({ commit, state }, receiver) {
      try {
        if (!state.messages[receiver]) {
          const response = await api.get('/chat/history')
          const messages = response.data.filter(message => 
            (message.sender === state.currentUser && message.receiver === receiver) ||
            (message.sender === receiver && message.receiver === state.currentUser)
          )
          commit('setMessages', { username: receiver, messages })
          return messages
        }
        return state.messages[receiver]
      } catch (error) {
        console.error('Failed to fetch chat history:', error)
        throw error
      }
    },

    async sendChatMessage({ state }, { receiver, content }) {
      if (state.stompClient && state.stompClient.connected) {
        const message = {
          sender: state.currentUser,
          receiver: receiver,
          content: content,
          timestamp: new Date().toISOString()
        }
        
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
                switch (receivedMessage.action) {
                  case 'CREATE':
                    commit('addMessage', receivedMessage)
                    break
                  case 'UPDATE':
                    commit('updateMessage', receivedMessage)
                    break
                  case 'DELETE':
                    commit('deleteMessage', receivedMessage)
                    break
                  default:
                    console.warn('Unknown message action:', receivedMessage.action)
                }
              } catch (error) {
                console.error('Error parsing message:', error)
              }
            }
          )
          
          // Load initial data after connection
          dispatch('loadAllMessages')
          dispatch('fetchUsers')
        },
        error => {
          console.error('STOMP error:', error)
          commit('setStompClient', null)
        }
      )

      // Handle reconnection on connection loss
      socket.onclose = () => {
        console.log('WebSocket connection closed. Reconnecting...')
        setTimeout(() => {
          dispatch('setupWebSocket')
        }, 5000) // Retry after 5 seconds
      }
    },

    async updateChatMessage({ state }, { messageId, content }) {
      if (state.stompClient && state.stompClient.connected) {
        const message = {
          id: messageId,
          content: content,
          timestamp: new Date().toISOString()
        }
        
        state.stompClient.publish({
          destination: "/app/chat.update",
          body: JSON.stringify(message)
        })
      } else {
        throw new Error("WebSocket is not connected")
      }
    },

    async deleteChatMessage({ state }, message) {
      if (state.stompClient && state.stompClient.connected) {
        const deleteMessage = {
          id: message.id,
          sender: message.sender,
          receiver: message.receiver
        }
        
        state.stompClient.publish({
          destination: "/app/chat.delete",
          body: JSON.stringify(deleteMessage)
        })
      } else {
        throw new Error("WebSocket is not connected")
      }
    }
  },

  getters: {
    isAuthenticated: state => !!state.token,
    currentUser: state => state.currentUser,
    otherUsers: state => state.users.filter(user => user !== state.currentUser),
    messagesByUser: (state) => (username) => {
      const messages = state.messages[username] || []
      return sortMessagesById(messages.filter(message => 
        (message.sender === state.currentUser && message.receiver === username) ||
        (message.sender === username && message.receiver === state.currentUser)
      ))
    },
    selectedUser: state => state.selectedUser
  }
})