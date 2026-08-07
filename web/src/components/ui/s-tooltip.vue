<template>
  <div class="s-tooltip">
    <slot />
    <div class="s-tooltip-tip">{{ content }}</div>
  </div>
</template>

<script setup>
defineProps({
  content: String
})
</script>
