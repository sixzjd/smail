import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/editorial.css'
import './style.css'
import { init } from '@/init/init.js'
import { createPinia } from 'pinia'
import piniaPersistedState from 'pinia-plugin-persistedstate'
import 'nprogress/nprogress.css'
import perm from '@/perm/perm.js'
import i18n from '@/i18n/index.js'

const app = createApp(App)
const pinia = createPinia().use(piniaPersistedState)
app.use(pinia)

// Globally register all s-* UI components
const uiComponents = import.meta.glob('./components/ui/s-*.vue', { eager: true })
for (const [path, mod] of Object.entries(uiComponents)) {
  const name = path.split('/').pop().replace('.vue', '')
  app.component(name, mod.default)
}

// Apply dark mode on initial load
import { useUiStore } from '@/store/ui.js'
const uiStore = useUiStore()
if (uiStore.dark) {
  document.documentElement.setAttribute('class', 'dark')
}
// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem('pinia-persisted-ui')) {
    document.documentElement.setAttribute('class', e.matches ? 'dark' : '')
    uiStore.dark = e.matches
  }
})

await init()

app.use(router).use(i18n).directive('perm', perm)
app.config.devtools = true

app.mount('#app')
