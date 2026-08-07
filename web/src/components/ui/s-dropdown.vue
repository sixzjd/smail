<template>
  <div class="s-dropdown" ref="dropdownRef">
    <div @click="toggle">
      <slot name="trigger" />
    </div>
    <div v-if="open" class="s-dropdown-menu">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const open = ref(false)
const dropdownRef = ref(null)

const toggle = () => { open.value = !open.value }
const close = () => { open.value = false }

const handleClickOutside = (e) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) close()
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))

defineExpose({ close })
</script>
