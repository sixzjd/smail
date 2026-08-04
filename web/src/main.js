import {createApp} from 'vue';
import App from './App.vue';
import router from './router';
import './style.css';
import { init } from '@/init/init.js';
import { createPinia } from 'pinia';
import piniaPersistedState from 'pinia-plugin-persistedstate';
import 'element-plus/theme-chalk/dark/css-vars.css';
import 'nprogress/nprogress.css';
import perm from "@/perm/perm.js";
const pinia = createPinia().use(piniaPersistedState)
import i18n from "@/i18n/index.js";
const app = createApp(App).use(pinia)

// Apply dark mode on initial load
import { useUiStore } from '@/store/ui.js';
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
app.use(router).use(i18n).directive('perm',perm)
app.config.devtools = true;

app.mount('#app');
