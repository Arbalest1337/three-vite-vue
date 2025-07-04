import { createApp } from 'vue'
import '@/style/index.scss'
import App from './App.vue'
import router from '@/router'
import { vuetify } from '../plugins/vuetify'

createApp(App).use(router).use(vuetify).mount('#app')
