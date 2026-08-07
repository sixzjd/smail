<template>
  <div class="layout">
    <aside class="sidebar" :class="{ open: uiStore.asideShow }">
      <Aside />
    </aside>
    <div class="overlay" :class="{ show: uiStore.asideShow && isMobile }" @click="uiStore.asideShow = false"></div>
    <div class="main-col">
      <header class="topbar">
        <Header />
      </header>
      <Main />
    </div>
  </div>
  <writer ref="writerRef" />
</template>

<script setup>
import Aside from '@/layout/aside/index.vue'
import Header from '@/layout/header/index.vue'
import Main from '@/layout/main/index.vue'
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useUiStore } from '@/store/ui.js'
import writer from '@/layout/write/index.vue'

const uiStore = useUiStore()
const writerRef = ref({})
const isMobile = ref(window.innerWidth < 1025)

const handleResize = () => {
  isMobile.value = window.innerWidth < 1025
  uiStore.asideShow = window.innerWidth > 1024
}

onMounted(() => {
  uiStore.writerRef = writerRef
  window.addEventListener('resize', handleResize)
  handleResize()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.layout {
  height: 100vh;
  display: flex;
  overflow: hidden;
  background: var(--s-body);
}

.sidebar {
  width: var(--s-sidebar-w);
  flex-shrink: 0;
  height: 100vh;
  background: var(--s-paper);
  border-right: 1px solid var(--s-line-light);
  display: flex;
  flex-direction: column;
  transition: transform 250ms ease;
}

@media (max-width: 1024px) {
  .sidebar {
    position: fixed;
    left: 0; top: 0;
    z-index: 200;
    transform: translateX(-100%);
    box-shadow: none;
  }
  .sidebar.open {
    transform: translateX(0);
    box-shadow: var(--s-shadow);
  }
}

.overlay {
  display: none;
}
.overlay.show {
  display: block;
  position: fixed;
  inset: 0;
  z-index: 199;
  background: rgba(33,28,25,.4);
  animation: s-fade-in 200ms ease;
}
html.dark .overlay.show { background: rgba(0,0,0,.55); }

.main-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.topbar {
  height: var(--s-topbar-h);
  flex-shrink: 0;
  background: var(--s-paper);
  border-bottom: 1px solid var(--s-line-light);
}
</style>
