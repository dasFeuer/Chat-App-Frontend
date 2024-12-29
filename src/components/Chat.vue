<template>
  <div class="chat-container">
    <div class="users-panel">
      <h3>Available Users</h3>
      <div class="users-list">
        <div v-for="user in otherUsers" :key="user" class="user-item" :class="{ active: selectedUser === user }"
          @click="selectUser(user)">
          <div class="user-avatar">{{ user.charAt(0).toUpperCase() }}</div>
          <span>{{ user }}</span>
        </div>
      </div>
    </div>
    <div class="chat-panel">
      <div v-if="selectedUser" class="chat-messages">
        <h3>Chat with {{ selectedUser }}</h3>
        <div class="messages-wrapper" ref="messagesWrapper" @scroll="handleScroll">
          <div class="messages" ref="messagesContainer">
            <div v-for="message in sortedMessages" :key="message.id" class="message"
              :class="{ 'sent': message.sender === currentUser, 'received': message.sender !== currentUser }">
              <div class="message-wrapper">
                <div class="message-content">
                  <template v-if="editingMessage && editingMessage.id === message.id">
                    <input v-model="editingMessage.content" @keyup.enter="saveEdit" @keyup.esc="cancelEditing"
                      class="edit-input">
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
        </div>
        <div class="message-input-wrapper">
          <form @submit.prevent="sendMessage" class="message-input">
            <input v-model="newMessage" placeholder="Type a message..." :disabled="isSending"
              :aria-label="isSending ? 'Sending message' : 'Type a message'">
            <button type="submit" :disabled="isSending || !newMessage.trim()">
              <font-awesome-icon :icon="['fas', 'paper-plane']" />
              <span>{{ isSending ? 'Sending...' : 'Send' }}</span>
            </button>
          </form>
        </div>
      </div>
      <div v-else class="no-chat-selected">
        <font-awesome-icon :icon="['fas', 'comments']" />
        <p>Select a user to start chatting</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useStore } from 'vuex'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faEdit, faTrash, faPaperPlane, faComments } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(faEdit, faTrash, faPaperPlane, faComments)

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'Chat',
  components: {
    FontAwesomeIcon,
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
          newMessage.value = messageContent
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
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  background-color: #f0f2f5;
}

.users-panel {
  width: 280px;
  border-right: 1px solid #e0e0e0;
  overflow-y: auto;
  background-color: #fff;
}

.users-panel h3 {
  padding: 20px;
  margin: 0;
  border-bottom: 1px solid #e0e0e0;
  font-size: 1.2em;
  font-weight: 600;
  color: #1a1a1a;
}

.users-list {
  padding: 10px;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin: 5px 0;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.2s, transform 0.2s;
}

.user-item:hover {
  background-color: #f0f2f5;
}

.user-item.active {
  background-color: #e7f3ff;
  color: #1877f2;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #1877f2;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 12px;
}

.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  height: 100%;
}

.chat-messages {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.chat-messages h3 {
  padding: 20px;
  margin: 0;
  border-bottom: 1px solid #e0e0e0;
  font-size: 1.2em;
  font-weight: 600;
  color: #1a1a1a;
  background-color: #fff;
  position: sticky;
  top: 0;
  z-index: 1;
}

.messages-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: calc(100% - 140px);
}

.messages {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: min-content;
  padding-bottom: 20px;
}

.message {
  margin: 4px 0;
  max-width: 70%;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message.sent {
  align-self: flex-end;
}

.message.received {
  align-self: flex-start;
}

.message-content {
  background-color: #f0f2f5;
  padding: 12px 16px;
  border-radius: 18px;
  word-break: break-word;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message.sent .message-content {
  background-color: #1877f2;
  color: white;
}

.message.editing .message-content {
  background-color: #fff;
  border: 1px solid #1877f2;
  color: #1a1a1a;
}

.message-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
  padding: 0 4px;
}

.message:hover .message-actions {
  opacity: 1;
}

.action-btn {
  background-color: #f0f2f5;
  border: none;
  cursor: pointer;
  padding: 6px;
  color: #65676b;
  transition: all 0.2s;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  color: #fff;
  background-color: #1877f2;
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
  background-color: #f0f2f5;
}

.message-input input:focus {
  outline: none;
  border-color: #1877f2;
  box-shadow: 0 0 0 3px rgba(24, 119, 242, 0.2);
}

.message-input input:disabled {
  background-color: #e9ecef;
  cursor: not-allowed;
}

.message-input button {
  padding: 12px 24px;
  background-color: #1877f2;
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.2s, transform 0.2s;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
}

.message-input button:hover:not(:disabled) {
  background-color: #166fe5;
  transform: translateY(-2px);
}

.message-input button:disabled {
  background-color: #e4e6eb;
  color: #bcc0c4;
  cursor: not-allowed;
}

.no-chat-selected {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #65676b;
  font-size: 18px;
  background-color: #f0f2f5;
}

.no-chat-selected svg {
  font-size: 48px;
  margin-bottom: 16px;
  color: #1877f2;
}

.edit-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #1877f2;
  background-color: #fff;
  font-size: inherit;
  color: #1a1a1a;
  outline: none;
  border-radius: 18px;
}

.messages-wrapper::-webkit-scrollbar {
  width: 6px;
}

.messages-wrapper::-webkit-scrollbar-track {
  background: #f0f2f5;
}

.messages-wrapper::-webkit-scrollbar-thumb {
  background: #bcc0c4;
  border-radius: 3px;
}

.messages-wrapper::-webkit-scrollbar-thumb:hover {
  background: #65676b;
}

@media (max-width: 768px) {
  .chat-container {
    flex-direction: column;
    height: 100vh;
    margin-top: 0;
  }

  .users-panel {
    width: 100%;
    height: 30vh;
    border-right: none;
    border-bottom: 1px solid #e0e0e0;
  }

  .chat-panel {
    height: 70vh;
  }

  .message {
    max-width: 85%;
  }

  .message-actions {
    opacity: 1;
    padding: 0 2px;
  }

  .message-input button span {
    display: none;
  }

  .message-input button {
    padding: 12px;
  }

  .user-item {
    padding: 8px;
  }

  .user-avatar {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }

  .messages-wrapper {
    padding: 10px;
  }

  .message-input-wrapper {
    padding: 10px;
  }

  .message-input {
    gap: 8px;
  }

  .message-input input {
    padding: 10px 16px;
    font-size: 14px;
  }
}

@media (max-width: 768px) {
  .chat-container {
    flex-direction: column;
    height: 100vh;
    margin-top: 0;
  }

  .users-panel {
    width: 100%;
    height: 30vh;
    border-right: none;
    border-bottom: 1px solid #e0e0e0;
    overflow-y: auto;
  }

  .chat-panel {
    height: 70vh;
    overflow: hidden;
  }

  .messages-wrapper {
    height: calc(100% - 130px);
    padding: 10px;
  }

  .message-content {
    background-color: #3a3b3c;
    color: #e4e6eb;
  }

  .message.sent .message-content {
    background-color: #1877f2;
    color: white;
  }

  .action-btn {
    background-color: #3a3b3c;
    color: #e4e6eb;
  }

  .action-btn:hover {
    background-color: #1877f2;
  }

  .message-input input {
    background-color: #3a3b3c;
    color: #e4e6eb;
    border-color: #3a3b3c;
  }

  .message-input input:focus {
    border-color: #1877f2;
  }

  .no-chat-selected {
    background-color: #18191a;
    color: #b0b3b8;
  }

  .users-panel h3,
  .chat-messages h3 {
    color: #e4e6eb;
    border-bottom-color: #3a3b3c;
  }

  .user-item:hover {
    background-color: #3a3b3c;
  }

  .user-item.active {
    background-color: rgba(24, 119, 242, 0.2);
  }

  .edit-input {
    background-color: #3a3b3c;
    color: #e4e6eb;
  }
}
</style>