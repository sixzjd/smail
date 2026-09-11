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

// init() 内部会 await websiteConfig() / loginUserInfo() 等网络请求。
// 这些请求已由 axios 的 timeout 兜底（不会永久 pending），这里再用 try/catch 保证
// 即使 init() 抛异常也一定会走到 mount，避免页面永久停在 #loading-first 加载动画上。
// 注意：不能用 Promise.race 提前放行——那样 App 会在配置未就绪时挂载，
// 登录页会把空的 domainList 抓成快照，域名下拉框变成空白。
try {
  await init()
} catch (e) {
  console.error('[init] 初始化异常', e)
}

app.use(router).use(i18n).directive('perm', perm)
app.config.devtools = true

app.mount('#app')

// 挂载成功说明资源齐全，清掉「旧壳子自救」标记，
// 这样下次真的遇到资源缺失时还能再自救一次（见 server/src/index.js 的 assetGone）。
try {
  sessionStorage.removeItem('__smail_asset_heal')
} catch (e) { /* 隐私模式下 sessionStorage 可能不可用，忽略 */ }
