import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

// Import the FontAwesome core
import { library } from '@fortawesome/fontawesome-svg-core'

// Import the FontAwesome component
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

// Import specific icons
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons'

// Add the imported icons to the library
library.add(faEdit, faTrash)

const app = createApp(App)

// Register Font Awesome component globally
app.component('font-awesome-icon', FontAwesomeIcon)

app.use(router)
app.use(store)
app.mount('#app')

console.log('Vue app initialized with Font Awesome')
