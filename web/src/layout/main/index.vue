<template>
  <div :class="accountShow && hasPerm('account:query') ? 'main-box main-box-show' : 'main-box main-box-hide'">
    <div :class="accountShow && hasPerm('account:query') ? 'block-show' : 'block-hide'" @click="uiStore.accountShow = false"></div>
    <account :class="accountShow && hasPerm('account:query') ? 'show' : 'hide'" />
    <router-view class="main-view" v-slot="{ Component, route }">
      <keep-alive :include="['email','all-email','send','sys-setting','star','user','role','analysis','reg-key','draft']">
        <component :is="Component" :key="route.name" />
      </keep-alive>
    </router-view>
  </div>
</template>

<script setup>
import account from '@/layout/account/index.vue'
import { useUiStore } from '@/store/ui.js'
import { useSettingStore } from '@/store/setting.js'
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { hasPerm } from '@/perm/perm.js'
import { toast } from '@/components/ui/toast.js'

const settingStore = useSettingStore()
const uiStore = useUiStore()
const route = useRoute()
let innerWidth = window.innerWidth

let noticeTimer = null

const accountShow = computed(() => {
  return uiStore.accountShow && settingStore.settings.manyEmail === 0
})

watch(() => uiStore.changeNotice, () => {
  const s = settingStore.settings
  showNotice({
    title: s.noticeTitle,
    content: s.noticeContent,
    type: s.noticeType,
    duration: s.noticeDuration,
    width: s.noticeWidth,
    position: s.noticePosition,
    offset: s.noticeOffset,
    enabled: s.notice
  })
})

watch(() => uiStore.changePreview, () => {
  showNotice(uiStore.previewData)
})

function showNotice(data) {
  if (data.enabled === 1 || data.notice === 1) return

  // Use toast for simplicity
  const content = data.content?.replace(/<[^>]+>/g, '') || data.title || ''
  toast(content, data.type === 'none' ? 'info' : data.type, data.duration || 4500)
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  handleResize()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})

const handleResize = () => {
  if (['content', 'email', 'send'].includes(route.meta.name)) {
    if (innerWidth !== window.innerWidth) {
      innerWidth = window.innerWidth
      uiStore.accountShow = window.innerWidth >= 767
    }
  }
}
</script>

<style scoped>
.main-box {
  display: grid;
  height: calc(100vh - var(--s-topbar-h));
  overflow: hidden;
}
.main-box-show { grid-template-columns: 260px 1fr; }
.main-box-hide { grid-template-columns: 1fr; }

@media (max-width: 767px) {
  .main-box-show { grid-template-columns: 1fr; }
}

.main-view {
  background: var(--s-paper);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  min-height: 0;
  width: 100%;
}

.block-show {
  position: fixed;
}
@media (max-width: 767px) {
  .block-show {
    position: absolute; right: 0;
    height: 100%; width: 100%;
    background: #000; opacity: 0.5;
    z-index: 10;
  }
}
.block-hide {
  position: fixed;
  pointer-events: none;
}

.show { transition: all 100ms; }
@media (max-width: 767px) {
  .show {
    position: fixed; z-index: 100;
    width: 260px;
  }
}

.hide {
  transition: all 100ms;
  position: fixed;
  transform: translateX(-100%);
  opacity: 0;
  pointer-events: none;
}
</style>
