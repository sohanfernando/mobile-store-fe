import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { vReveal } from './directives/reveal'

const app = createApp(App)
app.directive('reveal', vReveal)
app.use(router).mount('#app')
