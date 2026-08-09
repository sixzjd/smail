<template>
  <div class="sidebar-inner" ref="sidebarRef">
    <!-- Brand -->
    <div class="brand">
      <img class="brand-mark" src="/smail-icon.png" alt="smail">
      <div class="brand-name"><span>s</span>mail</div>
    </div>

    <!-- Compose -->
    <div class="compose-wrap">
      <button class="compose-btn" @click="openSend">
        <span class="compose-plus">＋</span>
        <span>{{ $t('compose') || '写邮件' }}</span>
      </button>
    </div>

    <!-- Nav -->
    <nav class="nav-scroll">
      <div class="nav-group">
        <div class="nav-label">{{ $t('mailbox') || '邮箱' }}</div>
        <a class="nav-item" :class="{ active: route.meta.name === 'email' }" @click="router.push({ name: 'email' })">
          <Icon icon="hugeicons:mailbox-01" width="18" height="18" />
          <span>{{ $t('inbox') }}</span>
        </a>
        <a class="nav-item" :class="{ active: route.meta.name === 'star' }" @click="router.push({ name: 'star' })">
          <Icon icon="solar:star-line-duotone" width="18" height="18" />
          <span>{{ $t('starred') }}</span>
        </a>
        <a class="nav-item" :class="{ active: route.meta.name === 'draft' }" @click="router.push({ name: 'draft' })" v-perm="'email:send'">
          <Icon icon="ep:document" width="18" height="18" />
          <span>{{ $t('drafts') }}</span>
        </a>
        <a class="nav-item" :class="{ active: route.meta.name === 'send' }" @click="router.push({ name: 'send' })" v-perm="'email:send'">
          <Icon icon="cil:send" width="18" height="18" />
          <span>{{ $t('sent') }}</span>
        </a>
      </div>

      <!-- Settings -->
      <div class="nav-group">
        <a class="nav-item" :class="{ active: route.meta.name === 'setting' }" @click="router.push({ name: 'setting' })">
          <Icon icon="fluent:settings-48-regular" width="18" height="18" />
          <span>{{ $t('settings') }}</span>
        </a>
      </div>

      <!-- Admin -->
      <div class="nav-group" v-perm="['all-email:query','user:query','role:query','setting:query','analysis:query','reg-key:query']">
        <div class="nav-label admin-label">
          <span class="admin-badge">ADMIN</span>
          {{ $t('manage') || '管理' }}
        </div>
        <a class="nav-item" :class="{ active: route.meta.name === 'analysis' }" @click="router.push({ name: 'analysis' })" v-perm="'analysis:query'">
          <Icon icon="fluent:data-pie-20-regular" width="18" height="18" />
          <span>{{ $t('analytics') }}</span>
        </a>
        <a class="nav-item" :class="{ active: route.meta.name === 'user' }" @click="router.push({ name: 'user' })" v-perm="'user:query'">
          <Icon icon="si:user-alt-2-line" width="18" height="18" />
          <span>{{ $t('allUsers') }}</span>
        </a>
        <a class="nav-item" :class="{ active: route.meta.name === 'all-email' }" @click="router.push({ name: 'all-email' })" v-perm="'all-email:query'">
          <Icon icon="fluent:mail-list-28-regular" width="18" height="18" />
          <span>{{ $t('allMail') }}</span>
        </a>
        <a class="nav-item" :class="{ active: route.meta.name === 'role' }" @click="router.push({ name: 'role' })" v-perm="'role:query'">
          <Icon icon="fluent:lock-closed-16-regular" width="18" height="18" />
          <span>{{ $t('permissions') }}</span>
        </a>
        <a class="nav-item" :class="{ active: route.meta.name === 'reg-key' }" @click="router.push({ name: 'reg-key' })" v-perm="'reg-key:query'">
          <Icon icon="fluent:fingerprint-20-filled" width="18" height="18" />
          <span>{{ $t('inviteCode') }}</span>
        </a>
        <a class="nav-item" :class="{ active: route.meta.name === 'sys-setting' }" @click="router.push({ name: 'sys-setting' })" v-perm="'setting:query'">
          <Icon icon="eos-icons:system-ok-outlined" width="18" height="18" />
          <span>{{ $t('SystemSettings') }}</span>
        </a>
      </div>
    </nav>
  </div>
</template>

<script setup>
import router from '@/router/index.js'
import { useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useUiStore } from '@/store/ui.js'
import { ref, onMounted, onBeforeUnmount } from 'vue'

const route = useRoute()
const uiStore = useUiStore()
const sidebarRef = ref(null)

function onSidebarWheel(e) {
  const nav = sidebarRef.value?.querySelector('.nav-scroll')
  if (!nav) return
  e.preventDefault()
  nav.scrollTop += e.deltaY
}

onMounted(() => {
  sidebarRef.value?.addEventListener('wheel', onSidebarWheel, { passive: false })
})

onBeforeUnmount(() => {
  sidebarRef.value?.removeEventListener('wheel', onSidebarWheel)
})

function openSend() {
  uiStore.writerRef?.open()
  if (window.innerWidth < 1025) uiStore.asideShow = false
}
</script>

<style scoped>
.sidebar-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 20px 12px;
}
.brand-mark {
  width: 34px; height: 34px;
  border-radius: 10px;
  object-fit: contain;
}
.brand-name {
  font-family: var(--s-font-display);
  font-weight: 800; font-size: 20px;
  letter-spacing: -0.5px;
  color: var(--s-ink);
}
.brand-name span { color: var(--s-accent); }

.compose-wrap { padding: 4px 16px 12px; }
.compose-btn {
  width: 100%;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 11px 0;
  background: var(--s-accent);
  color: #fff;
  border-radius: var(--s-radius);
  font-weight: 700; font-size: 14px;
  box-shadow: var(--s-shadow-sm);
  transition: all var(--s-ease);
}
.compose-btn:hover {
  background: var(--s-accent-hover);
  transform: translateY(-1px);
  box-shadow: var(--s-shadow);
}
.compose-plus { font-size: 16px; font-weight: 400; }

.nav-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px 16px;
}

.nav-group { margin-bottom: 8px; }
.nav-label {
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 1px;
  color: var(--s-muted);
  padding: 12px 12px 4px;
}
.admin-label { display: flex; align-items: center; gap: 8px; }
.admin-badge {
  font-size: 9px; font-weight: 800;
  background: var(--s-accent-soft);
  color: var(--s-accent);
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 1.5px;
}

.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 12px;
  border-radius: var(--s-radius);
  font-size: 14px; font-weight: 500;
  color: var(--s-ink-secondary);
  cursor: pointer;
  transition: all var(--s-ease);
  user-select: none;
}
.nav-item:hover {
  background: var(--s-soft);
  color: var(--s-ink);
}
.nav-item.active {
  background: var(--s-accent-soft);
  color: var(--s-accent);
  font-weight: 600;
}

/* ── Mobile: larger touch targets ── */
@media (max-width: 768px) {
  .nav-item {
    padding: 12px 14px;
    min-height: 44px;
  }

  .compose-btn {
    padding: 13px 0;
    min-height: 44px;
  }
}
</style>
