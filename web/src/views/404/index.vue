<template>
  <div class="page-404">
    <div class="content-404">
      <span class="code-404">404</span>
      <p class="msg-404">{{ $t('error404') }}</p>
      <s-button type="primary" @click="router.replace({name: 'layout'})">{{ $t('home') }}</s-button>
    </div>
  </div>
</template>

<script lang="js" setup>
import router from "@/router/index.js";
import SButton from '@/components/ui/s-button.vue';

let isPhone = window.innerWidth < 1025
</script>

<style scoped lang="scss">
.page-404 {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 24px;
}

.content-404 {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.code-404 {
  font-family: var(--s-font-display);
  font-size: 96px;
  font-weight: 800;
  line-height: 1;
  color: var(--s-line);
  letter-spacing: -4px;
  user-select: none;

  @media (max-width: 767px) {
    font-size: 72px;
  }
}

.msg-404 {
  font-family: var(--s-font-body);
  font-size: 16px;
  color: var(--s-muted);
  margin: 0;
  max-width: 280px;
  line-height: 1.5;
}
</style>
