<template>
  <div class="chat-container">
    <div class="users-panel">
      <h3>Available Users</h3>
      <div class="users-list">
        <div
          v-for="user in otherUsers"
          :key="user"
          class="user-item"
          :class="{ active: selectedUser === user }"
          @click="selectUser(user)"
        >
          {{ user }}
        </div>
      </div>
    </div>
    <div class="chat-panel">
      <div v-if="selectedUser" class="chat-messages">
        <h3>Chat with {{ selectedUser }}</h3>
        <div class="messages-wrapper" ref="messagesWrapper" @scroll="handleScroll">
          <div class="messages" ref="messagesContainer">
            <div
              v-for="(message, index) in messagesByUser(selectedUser)"
              :key="index"
              class="message"
              :class="{ 'sent': message.sender === currentUser }"
            >
              <div class="message-content">{{ message.content }}</div>
              <div class="message-time">{{ formatTime(message.timestamp) }}</div>
            </div>
          </div>
          <div class="scroll-anchor" ref="scrollAnchor"></div>
        </div>
        <div class="message-input-wrapper">
          <form @submit.prevent="sendMessage" class="message-input">
            <input
              v-model="newMessage"
              placeholder="Type a message..."
              :disabled="isSending"
              :aria-label="isSending ? 'Sending message' : 'Type a message'"
            >
            <button type="submit" :disabled="isSending || !newMessage.trim()">
              {{ isSending ? 'Sending...' : 'Send' }}
            </button>
          </form>
        </div>
      </div>
      <div v-else class="no-chat-selected">
        Select a user to start chatting
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useStore } from 'vuex'

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'Chat',
  setup() {
    const store = useStore()
    const selectedUser = ref(null)
    const newMessage = ref('')
    const isSending = ref(false)
    const messagesContainer = ref(null)
    const messagesWrapper = ref(null)
    const scrollAnchor = ref(null)
    const isScrolledToBottom = ref(true)
    const unreadMessages = ref(0)

    const currentUser = computed(() => store.state.currentUser)
    const otherUsers = computed(() => store.getters.otherUsers)
    const messagesByUser = computed(() => (user) => {
      return store.getters.messagesByUser(user) || []
    })

    const checkIfScrolledToBottom = () => {
      if (messagesWrapper.value) {
        const { scrollTop, scrollHeight, clientHeight } = messagesWrapper.value
        isScrolledToBottom.value = scrollTop + clientHeight >= scrollHeight - 10
      }
    }

    const scrollToBottom = async (force = false) => {
      await nextTick()
      if (scrollAnchor.value && (isScrolledToBottom.value || force)) {
        scrollAnchor.value.scrollIntoView({ behavior: 'smooth' })
        unreadMessages.value = 0
      } else if (!isScrolledToBottom.value) {
        unreadMessages.value++
      }
    }

    const handleScroll = () => {
      checkIfScrolledToBottom()
      if (isScrolledToBottom.value) {
        unreadMessages.value = 0
      }
    }

    const selectUser = async (user) => {
      selectedUser.value = user
      await store.dispatch('fetchChatHistory', user)
      await scrollToBottom(true)
    }

    const sendMessage = async () => {
      const messageContent = newMessage.value.trim()
      if (messageContent && selectedUser.value && !isSending.value) {
        isSending.value = true
        newMessage.value = ''
        
        try {
          await store.dispatch('sendChatMessage', {
            receiver: selectedUser.value,
            content: messageContent,
            timestamp: new Date().toISOString()
          })
          await scrollToBottom(true)
        } catch (error) {
          console.error('Failed to send message:', error)
          alert('Failed to send message. Please try again.')
          newMessage.value = messageContent // Restore message on failure
        } finally {
          isSending.value = false
        }
      }
    }

    const formatTime = (timestamp) => {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      const now = new Date()
      const diff = now - date
      
      // If message is from today, show time only
      if (diff < 24 * 60 * 60 * 1000) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      // If message is older, show date and time
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    // Watch for new messages and scroll to bottom if necessary
    watch(() => messagesByUser.value(selectedUser.value), scrollToBottom)

    onMounted(async () => {
      await store.dispatch('fetchUsers')
      if (messagesWrapper.value) {
        messagesWrapper.value.addEventListener('scroll', handleScroll)
      }
    })

    return {
      selectedUser,
      newMessage,
      currentUser,
      otherUsers,
      messagesByUser,
      selectUser,
      sendMessage,
      formatTime,
      isSending,
      messagesContainer,
      messagesWrapper,
      scrollAnchor,
      handleScroll,
      unreadMessages
    }
  }
}
</script>

<style scoped>
.chat-container {
  display: flex;
  height: 80vh;
  margin-top: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.users-panel {
  width: 250px;
  border-right: 1px solid #ddd;
  overflow-y: auto;
  background-color: #f8f9fa;
}

.users-panel h3 {
  padding: 15px;
  margin: 0;
  border-bottom: 1px solid #ddd;
  background-color: #e9ecef;
  font-size: 1.1em;
}

.users-list {
  padding: 10px;
}

.user-item {
  padding: 12px;
  margin: 5px 0;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.2s, transform 0.2s;
}

.user-item:hover {
  background-color: #e9ecef;
  transform: translateY(-2px);
}

.user-item.active {
  background-color: #007bff;
  color: white;
}

.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #fff;
}

.chat-messages {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-messages h3 {
  padding: 15px;
  margin: 0;
  border-bottom: 1px solid #ddd;
  background-color: #f8f9fa;
  font-size: 1.1em;
}

.messages-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  display: flex;
  flex-direction: column;
}

.messages {
  flex: 1;
}

.message {
  margin: 10px 0;
  max-width: 70%;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.message.sent {
  margin-left: auto;
  text-align: right;
}

.message-content {
  background-color: #f1f1f1;
  padding: 10px 15px;
  border-radius: 18px;
  display: inline-block;
  word-break: break-word;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message.sent .message-content {
  background-color: #007bff;
  color: white;
}

.message-time {
  font-size: 0.75em;
  color: #888;
  margin-top: 4px;
}

.message-input-wrapper {
  border-top: 1px solid #ddd;
  background-color: #fff;
  padding: 15px;
  position: relative;
}

.message-input {
  display: flex;
  gap: 10px;
}

.message-input input {
  flex: 1;
  padding: 12px 15px;
  border: 1px solid #ccc;
  border-radius: 20px;
  font-size: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
  background-color: #f8f9fa;
}

.message-input input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
}

.message-input input:disabled {
  background-color: #e9ecef;
  cursor: not-allowed;
}

.message-input button {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s, transform 0.2s;
  font-weight: bold;
}

.message-input button:hover:not(:disabled) {
  background-color: #0056b3;
  transform: translateY(-2px);
}

.message-input button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.no-chat-selected {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  font-size: 16px;
  background-color: #f8f9fa;
}

.scroll-anchor {
  height: 1px;
  margin-bottom: 15px;
}

/* Scrollbar styling */
.messages-wrapper::-webkit-scrollbar {
  width: 6px;
}

.messages-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.messages-wrapper::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.messages-wrapper::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>




<!-- <template>

  <div class="chat-container">
    <div class="users-panel">
      <h3>Available Users</h3>
      <div class="users-list">
        <div
          v-for="user in otherUsers"
          :key="user"
          class="user-item"
          :class="{ active: selectedUser === user }"
          @click="selectUser(user)"
        >
          {{ user }}
        </div>
      </div>
    </div>
    <div class="chat-panel">
      <div v-if="selectedUser" class="chat-messages">
        <h3>Chat with {{ selectedUser }}</h3>
        <div class="messages" ref="messagesContainer">
          <div
            v-for="(message, index) in messagesByUser(selectedUser)"
            :key="index"
            class="message"
            :class="{ 'sent': message.sender === currentUser }"
          >
            <div class="message-content">{{ message.content }}</div>
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>
        <form @submit.prevent="sendMessage" class="message-input">
          <input
            v-model="newMessage"
            placeholder="Type a message..."
            :disabled="isSending"
          >
          <button type="submit" :disabled="isSending || !newMessage.trim()">
            {{ isSending ? 'Sending...' : 'Send' }}
          </button>
        </form>
      </div>
      <div v-else class="no-chat-selected">
        Select a user to start chatting
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useStore } from 'vuex'

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'Chat',
  setup() {
    const store = useStore()
    const selectedUser = ref(null)
    const newMessage = ref('')
    const isSending = ref(false)
    const messagesContainer = ref(null)

    const currentUser = computed(() => store.state.currentUser)
    const otherUsers = computed(() => store.getters.otherUsers)
    const messagesByUser = computed(() => (user) => {
      return store.getters.messagesByUser(user) || []
    })

    const scrollToBottom = async () => {
      await nextTick()
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    }

    const selectUser = async (user) => {
      selectedUser.value = user
      await store.dispatch('fetchChatHistory', user)
      await scrollToBottom()
    }

    const sendMessage = async () => {
      const messageContent = newMessage.value.trim()
      if (messageContent && selectedUser.value && !isSending.value) {
        isSending.value = true
        newMessage.value = ''
        
        try {
          await store.dispatch('sendChatMessage', {
            receiver: selectedUser.value,
            content: messageContent,
            timestamp: new Date().toISOString()
          })
          await scrollToBottom()
        } catch (error) {
          console.error('Failed to send message:', error)
          alert('Failed to send message. Please try again.')
          newMessage.value = messageContent // Restore message on failure
        } finally {
          isSending.value = false
        }
      }
    }

    const formatTime = (timestamp) => {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      const now = new Date()
      const diff = now - date
      
      // If message is from today, show time only
      if (diff < 24 * 60 * 60 * 1000) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      // If message is older, show date and time
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    // Watch for new messages and scroll to bottom
    watch(() => messagesByUser.value(selectedUser.value), scrollToBottom)

    onMounted(async () => {
      await store.dispatch('fetchUsers')
    })

    return {
      selectedUser,
      newMessage,
      currentUser,
      otherUsers,
      messagesByUser,
      selectUser,
      sendMessage,
      formatTime,
      isSending,
      messagesContainer
    }
  }
}
</script>

<style scoped>
.chat-container {
  display: flex;
  height: 70vh;
  margin-top: 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.users-panel {
  width: 250px;
  border-right: 1px solid #ddd;
  overflow-y: auto;
}

.users-panel h3 {
  padding: 15px;
  margin: 0;
  border-bottom: 1px solid #ddd;
}

.users-list {
  padding: 10px;
}

.user-item {
  padding: 10px;
  margin: 5px 0;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.user-item:hover {
  background-color: #f5f5f5;
}

.user-item.active {
  background-color: #e3f2fd;
}

.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-messages {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-messages h3 {
  padding: 15px;
  margin: 0;
  border-bottom: 1px solid #ddd;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  scroll-behavior: smooth;
}

.message {
  margin: 10px 0;
  max-width: 70%;
}

.message.sent {
  margin-left: auto;
  text-align: right;
}

.message-content {
  background-color: #f1f1f1;
  padding: 10px 15px;
  border-radius: 15px;
  display: inline-block;
  word-break: break-word;
}

.message.sent .message-content {
  background-color: #e3f2fd;
}

.message-time {
  font-size: 0.8em;
  color: #666;
  margin-top: 4px;
}

.message-input {
  display: flex;
  padding: 15px;
  gap: 10px;
  border-top: 1px solid #ddd;
  background-color: #fff;
}

.message-input input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.message-input input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.message-input button {
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.message-input button:hover:not(:disabled) {
  background-color: #45a049;
}

.message-input button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.no-chat-selected {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  font-size: 16px;
}
</style> -->