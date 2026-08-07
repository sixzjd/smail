<template>
  <router-view />
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { watch } from 'vue'
import { useSettingStore } from '@/store/setting.js'

const settingStore = useSettingStore()
const { locale } = useI18n()
locale.value = settingStore.lang
watch(() => settingStore.lang, () => locale.value = settingStore.lang)
import('@/icons/index.js')
</script>
