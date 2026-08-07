<template>
  <span class="s-badge">
    <slot />
    <span v-if="count" class="s-badge-count">{{ displayCount }}</span>
    <span v-else-if="dot" class="s-badge-dot"></span>
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  count: Number,
  max: { type: Number, default: 99 },
  dot: Boolean
})

const displayCount = computed(() => {
  if (props.count > props.max) return `${props.max}+`
  return props.count
})
</script>
