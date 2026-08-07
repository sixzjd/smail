<template>
  <div class="topbar-inner">
    <!-- Left: hamburger + breadcrumb -->
    <div class="topbar-left">
      <button class="hamburger" @click="uiStore.asideShow = !uiStore.asideShow" aria-label="菜单">
        <Icon icon="ci:hamburger" width="22" height="22" />
      </button>
      <span class="breadcrumb">{{ $t(route.meta.title) }}</span>
    </div>

    <!-- Center: search (decorative for now) -->
    <div class="topbar-center">
      <div class="search-bar">
        <Icon icon="ci:search" width="16" height="16" class="search-icon" />
        <input type="text" :placeholder="$t('search') || '搜索邮件'" class="search-input" />
        <span class="search-shortcut">⌘ K</span>
      </div>
    </div>

    <!-- Right: actions -->
    <div class="topbar-right">
      <!-- Dark mode -->
      <button class="icon-btn" @click="openDark($event)" :aria-label="uiStore.dark ? '浅色模式' : '深色模式'">
        <Icon v-if="uiStore.dark" icon="mingcute:sun-fill" width="20" height="20" />
        <Icon v-else icon="solar:moon-linear" width="20" height="20" />
      </button>

      <!-- Notice -->
      <button class="icon-btn" @click="uiStore.showNotice()">
        <Icon icon="streamline-plump:announcement-megaphone" width="20" height="20" />
      </button>

      <!-- User dropdown -->
      <s-dropdown ref="userDropdownRef">
        <template #trigger>
          <div class="user-trigger">
            <div class="user-avatar">{{ formatName(userStore.user.email) }}</div>
            <Icon icon="mingcute:down-small-fill" width="18" height="18" class="user-arrow" />
          </div>
        </template>
        <div class="user-panel">
          <div class="panel-avatar">{{ formatName(userStore.user.email) }}</div>
          <div class="panel-name">{{ userStore.user.name }}</div>
          <div class="panel-email" @click="copyEmail(userStore.user.email)">{{ userStore.user.email }}</div>
          <div class="panel-role"><s-tag>{{ userStore.user.role.name }}</s-tag></div>
          <div class="panel-stats">
            <div class="stat-row">
              <span>{{ $t('sendCount') }}</span>
              <span>{{ $t('accountCount') }}</span>
            </div>
            <div class="stat-row">
              <span v-if="sendCount" class="stat-val">{{ sendCount }}</span>
              <s-tag v-if="!hasPerm('email:send')" type="danger">{{ sendType }}</s-tag>
              <s-tag v-else type="accent">{{ sendType }}</s-tag>
              <span>
                <s-tag v-if="settingStore.settings.manyEmail || settingStore.settings.addEmail" type="default">{{ $t('disabled') }}</s-tag>
                <span v-else-if="accountCount && hasPerm('account:add')" class="stat-val">{{ $t('totalUserAccount', {msg: accountCount}) }}</span>
                <s-tag v-else-if="!accountCount && hasPerm('account:add')" type="info">{{ $t('unlimited') }}</s-tag>
                <s-tag v-else-if="!hasPerm('account:add')" type="default">{{ $t('unauthorized') }}</s-tag>
              </span>
            </div>
          </div>
          <div class="panel-logout">
            <s-button type="primary" block :loading="logoutLoading" @click="clickLogout">{{ $t('logOut') }}</s-button>
          </div>
        </div>
      </s-dropdown>
    </div>
  </div>
</template>

<script setup>
import router from '@/router'
import { logout } from '@/request/login.js'
import { Icon } from '@iconify/vue'
import { useUiStore } from '@/store/ui.js'
import { useUserStore } from '@/store/user.js'
import { useRoute } from 'vue-router'
import { computed, ref } from 'vue'
import { useSettingStore } from '@/store/setting.js'
import { hasPerm } from '@/perm/perm.js'
import { useI18n } from 'vue-i18n'
import { setExtend } from '@/utils/day.js'
import { toast } from '@/components/ui/toast.js'
import SDropdown from '@/components/ui/s-dropdown.vue'
import SButton from '@/components/ui/s-button.vue'
import STag from '@/components/ui/s-tag.vue'

const { t } = useI18n()
const route = useRoute()
const settingStore = useSettingStore()
const userStore = useUserStore()
const uiStore = useUiStore()
const logoutLoading = ref(false)
const userDropdownRef = ref(null)

const accountCount = computed(() => userStore.user.role.accountCount)

const sendType = computed(() => {
  if (settingStore.settings.send === 1) return t('disabled')
  if (!hasPerm('email:send')) return t('unauthorized')
  if (userStore.user.role.sendType === 'ban') return t('sendBanned')
  if (userStore.user.role.sendType === 'internal') return t('sendInternal')
  if (!userStore.user.role.sendCount) return t('unlimited')
  if (userStore.user.role.sendType === 'day') return t('daily')
  if (userStore.user.role.sendType === 'count') return t('total')
})

const sendCount = computed(() => {
  if (!hasPerm('email:send')) return null
  if (userStore.user.role.sendType === 'ban') return null
  if (userStore.user.role.sendType === 'internal') return null
  if (!userStore.user.role.sendCount) return null
  if (settingStore.settings.send === 1) return null
  return userStore.user.sendCount + '/' + userStore.user.role.sendCount
})

async function copyEmail(email) {
  try {
    await navigator.clipboard.writeText(email)
    toast(t('copySuccessMsg'), 'success')
  } catch (err) {
    toast(t('copyFailMsg'), 'error')
  }
}

function openDark(e) {
  const nextIsDark = !uiStore.dark
  const root = document.documentElement

  if (!document.startViewTransition) {
    switchDark(nextIsDark, root)
    return
  }

  const x = e.clientX, y = e.clientY
  const maxX = Math.max(x, window.innerWidth - x)
  const maxY = Math.max(y, window.innerHeight - y)
  const endRadius = Math.hypot(maxX, maxY)

  root.setAttribute('data-theme-to', nextIsDark ? 'dark' : 'light')
  root.style.setProperty('--vt-x', `${x}px`)
  root.style.setProperty('--vt-y', `${y}px`)
  root.style.setProperty('--vt-end-radius', `${endRadius + 10}px`)

  const transition = document.startViewTransition(() => switchDark(nextIsDark, root))
  transition.finished.finally(() => root.removeAttribute('data-theme-to'))
}

function switchDark(nextIsDark, root) {
  root.setAttribute('class', nextIsDark ? 'dark' : '')
  const metaTag = document.getElementById('theme-color-meta')
  const isMobile = !window.matchMedia('(pointer: fine) and (hover: hover)').matches
  metaTag?.setAttribute('content', nextIsDark ? (isMobile ? '#1a1614' : '#231e1a') : (isMobile ? '#eee5d8' : '#fbf6ee'))
  uiStore.dark = nextIsDark
}

function clickLogout() {
  logoutLoading.value = true
  logout().then(() => {
    localStorage.removeItem('token')
    router.replace('/login')
  }).finally(() => { logoutLoading.value = false })
}

function formatName(email) {
  return email[0]?.toUpperCase() || ''
}
</script>

<style scoped>
.topbar-inner {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  height: 100%;
  padding: 0 20px;
  gap: 16px;
}

.topbar-left {
  display: flex; align-items: center; gap: 12px;
}

.hamburger {
  display: none;
  align-items: center; justify-content: center;
  width: 36px; height: 36px;
  border-radius: var(--s-radius);
  color: var(--s-muted);
  transition: all var(--s-ease);
}
.hamburger:hover { background: var(--s-soft); color: var(--s-ink); }

@media (max-width: 1024px) {
  .hamburger { display: flex; }
}

.breadcrumb {
  font-family: var(--s-font-display);
  font-weight: 700; font-size: 16px;
  color: var(--s-ink);
}

.topbar-center { display: flex; justify-content: center; }
.search-bar {
  display: flex; align-items: center; gap: 8px;
  background: var(--s-soft);
  border-radius: var(--s-radius);
  padding: 8px 14px;
  max-width: 360px; width: 100%;
}
.search-icon { color: var(--s-muted); flex-shrink: 0; }
.search-input {
  flex: 1; border: none; outline: none; background: transparent;
  color: var(--s-ink); font-size: 14px;
}
.search-input::placeholder { color: var(--s-muted); }
.search-shortcut {
  font-size: 11px; color: var(--s-muted);
  background: var(--s-line-light);
  padding: 2px 6px; border-radius: 4px;
  font-weight: 600;
}

@media (max-width: 800px) {
  .topbar-center { display: none; }
}

.topbar-right {
  display: flex; align-items: center; gap: 8px;
}

.icon-btn {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--s-radius);
  color: var(--s-muted);
  transition: all var(--s-ease);
}
.icon-btn:hover { background: var(--s-soft); color: var(--s-ink); }

.user-trigger {
  display: flex; align-items: center; gap: 4px;
  cursor: pointer; padding: 4px;
  border-radius: var(--s-radius);
  transition: all var(--s-ease);
}
.user-trigger:hover { background: var(--s-soft); }
.user-avatar {
  width: 32px; height: 32px;
  background: var(--s-accent-soft);
  color: var(--s-accent);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--s-font-display);
  font-weight: 700; font-size: 14px;
}
.user-arrow { color: var(--s-muted); }

/* User panel */
.user-panel {
  width: 260px;
  display: flex; flex-direction: column; align-items: center;
  padding: 4px 0;
}
.panel-avatar {
  width: 44px; height: 44px;
  background: var(--s-accent-soft);
  color: var(--s-accent);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--s-font-display);
  font-weight: 800; font-size: 20px;
  margin-top: 8px;
}
.panel-name {
  font-weight: 700; font-size: 15px;
  margin-top: 10px;
  color: var(--s-ink);
  max-width: 220px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.panel-email {
  font-size: 13px; color: var(--s-muted);
  margin-top: 2px; cursor: pointer;
  max-width: 220px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.panel-email:hover { color: var(--s-accent); }
.panel-role { margin-top: 8px; }
.panel-stats {
  width: 100%;
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 12px;
  padding: 0 16px;
}
.stat-row {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  font-size: 12px; color: var(--s-muted);
}
.stat-val { font-weight: 600; color: var(--s-ink); }
.panel-logout {
  width: 100%;
  padding: 12px 16px 4px;
  margin-top: 8px;
}
</style>
