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
              v-for="message in sortedMessages"
              :key="message.id"
              class="message"
              :class="{ 'sent': message.sender === currentUser, 'received': message.sender !== currentUser }"
            >
              <div class="message-content">
                <template v-if="editingMessage && editingMessage.id === message.id">
                  <input
                    v-model="editingMessage.content"
                    @keyup.enter="saveEdit"
                    @keyup.esc="cancelEditing"
                    class="edit-input"
                  >
                </template>
                <template v-else>
                  {{ message.content }}
                </template>
              </div>
              <div v-if="message.sender === currentUser" class="message-actions">
                <button @click="startEditing(message)" class="action-btn edit-btn" title="Edit">
                  <font-awesome-icon :icon="['fas', 'edit']" />
                </button>
                <button @click="confirmDelete(message)" class="action-btn delete-btn" title="Delete">
                  <font-awesome-icon :icon="['fas', 'trash']" />
                </button>
              </div>
            </div>
          </div>
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
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'Chat',
  components: {
    FontAwesomeIcon
  },
  setup() {
    const store = useStore()
    const selectedUser = ref(null)
    const newMessage = ref('')
    const isSending = ref(false)
    const messagesContainer = ref(null)
    const messagesWrapper = ref(null)
    const isScrolledToBottom = ref(true)
    const editingMessage = ref(null)

    const currentUser = computed(() => store.state.currentUser)
    const otherUsers = computed(() => store.getters.otherUsers)
    const messagesByUser = computed(() => store.getters.messagesByUser)

    const sortedMessages = computed(() => {
      return messagesByUser.value(selectedUser.value) || [];
    });

    const checkIfScrolledToBottom = () => {
      if (messagesWrapper.value) {
        const { scrollTop, scrollHeight, clientHeight } = messagesWrapper.value
        isScrolledToBottom.value = scrollTop + clientHeight >= scrollHeight - 10
      }
    }

    const scrollToBottom = async (force = false) => {
      await nextTick();
      if (messagesWrapper.value && (isScrolledToBottom.value || force)) {
        messagesWrapper.value.scrollTop = messagesWrapper.value.scrollHeight;
      }
    };

    const handleScroll = () => {
      checkIfScrolledToBottom()
    }

    const selectUser = async (user) => {
      selectedUser.value = user;
      await store.dispatch('fetchChatHistory', user);
      await nextTick();
      scrollToBottom(true);
    };

    const sendMessage = async () => {
      const messageContent = newMessage.value.trim()
      if (messageContent && selectedUser.value && !isSending.value) {
        isSending.value = true
        newMessage.value = ''
        
        try {
          await store.dispatch('sendChatMessage', {
            receiver: selectedUser.value,
            content: messageContent
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

    const startEditing = (message) => {
      editingMessage.value = { ...message }
      nextTick(() => {
        const input = document.querySelector('.edit-input')
        if (input) {
          input.focus()
        }
      })
    }

    const cancelEditing = () => {
      editingMessage.value = null
    }

    const saveEdit = async () => {
      if (editingMessage.value) {
        try {
          await store.dispatch('updateChatMessage', {
            messageId: editingMessage.value.id,
            content: editingMessage.value.content
          })
          editingMessage.value = null
        } catch (error) {
          console.error('Failed to update message:', error)
          alert('Failed to update message. Please try again.')
        }
      }
    }

    const confirmDelete = (message) => {
      if (confirm('Are you sure you want to delete this message?')) {
        deleteMessage(message)
      }
    }

    const deleteMessage = async (message) => {
      try {
        await store.dispatch('deleteChatMessage', message)
      } catch (error) {
        console.error('Failed to delete message:', error)
        alert('Failed to delete message. Please try again.')
      }
    }

    watch(sortedMessages, async (newMessages, oldMessages) => {
      if (newMessages.length > (oldMessages?.length || 0)) {
        await nextTick()
        scrollToBottom(true)
      }
    })

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
      sortedMessages,
      selectUser,
      sendMessage,
      isSending,
      messagesContainer,
      messagesWrapper,
      handleScroll,
      editingMessage,
      startEditing,
      cancelEditing,
      saveEdit,
      confirmDelete,
      deleteMessage
    }
  }
}
</script>

<style scoped>
.chat-container {
  display: flex;
  height: 80vh;
  margin-top: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.users-panel {
  width: 250px;
  border-right: 1px solid #e0e0e0;
  overflow-y: auto;
  background-color: #f8f9fa;
}

.users-panel h3 {
  padding: 15px;
  margin: 0;
  border-bottom: 1px solid #e0e0e0;
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
  background-color: #f8f9fa;
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
  border-bottom: 1px solid #e0e0e0;
  background-color: #f8f9fa;
  font-size: 1.1em;
}

.messages-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 20px;
}

.messages {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 100%;
}

.message {
  margin: 4px 0;
  max-width: 70%;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.message.sent {
  align-self: flex-end;
}

.message.received {
  align-self: flex-start;
}

.message-content {
  background-color: #fff;
  padding: 12px 16px;
  border-radius: 18px;
  display: inline-block;
  word-break: break-word;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.message.sent .message-content {
  background-color: #007bff;
  color: white;
}

.message.editing .message-content {
  background-color: #e9ecef;
  border: 1px solid #007bff;
  color: #495057;
}

.message-time {
  font-size: 0.75em;
  color: #888;
  margin-top: 4px;
  text-align: right;
}

.message-input-wrapper {
  border-top: 1px solid #e0e0e0;
  background-color: #fff;
  padding: 20px;
  position: relative;
}

.message-input {
  display: flex;
  gap: 10px;
}

.message-input input {
  flex: 1;
  padding: 12px 20px;
  border: 1px solid #ced4da;
  border-radius: 25px;
  font-size: 16px;
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
  padding: 12px 24px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 16px;
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

.message-actions {
  display: none;
  justify-content: flex-end;
  margin-top: 4px;
}

.message:hover .message-actions {
  display: flex;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  color: #6c757d;
  transition: color 0.2s, background-color 0.2s;
  margin-left: 5px;
  border-radius: 4px;
}

.action-btn:hover {
  color: #fff;
  background-color: #007bff;
}

.edit-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #007bff;
  background-color: #fff;
  font-size: inherit;
  color: #495057;
  outline: none;
  border-radius: 18px;
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

