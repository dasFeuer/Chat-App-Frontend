<template>
  <div>
    <h2>WebSocket Test</h2>
    <p>Status: {{ status }}</p>
    <button @click="connect" :disabled="isConnected">Connect</button>
    <button @click="disconnect" :disabled="!isConnected">Disconnect</button>
    <button @click="sendTestMessage" :disabled="!isConnected">Send Test Message</button>
    <div>
      <h3>Received Messages:</h3>
      <ul>
        <li v-for="(message, index) in receivedMessages" :key="index">{{ message }}</li>
      </ul>
    </div>
  </div>
</template>

<script>
import SockJS from 'sockjs-client'
import { Stomp } from '@stomp/stompjs'

export default {
  name: 'WebSocketTest',
  data() {
    return {
      status: 'Disconnected',
      stompClient: null,
      receivedMessages: []
    }
  },
  computed: {
    isConnected() {
      return this.status === 'Connected'
    }
  },
  methods: {
    connect() {
      const socket = new SockJS('http://localhost:8080/ws')
      this.stompClient = Stomp.over(socket)

      const headers = {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }

      this.stompClient.connect(
        headers,
        frame => {
          this.status = 'Connected'
          console.log('Connected: ' + frame)
          this.stompClient.subscribe('/user/queue/messages', message => {
            console.log('Received: ' + message.body)
            this.receivedMessages.push(message.body)
          })
        },
        error => {
          console.log('STOMP error ' + error)
          this.status = 'Error: ' + error
        }
      )
    },
    disconnect() {
      if (this.stompClient !== null) {
        this.stompClient.disconnect()
      }
      this.status = 'Disconnected'
    },
    sendTestMessage() {
      if (this.stompClient && this.stompClient.connected) {
        const message = {
          sender: 'TestUser',
          receiver: 'TestReceiver',
          content: 'Test message'
        }
        this.stompClient.send("/app/chat.send", {}, JSON.stringify(message))
        console.log('Test message sent')
      } else {
        console.log('Not connected')
      }
    }
  }
}
</script>
