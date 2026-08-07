<template>
  <div class="s-avatar" :class="`s-avatar--${size}`" :style="avatarStyle">
    <img v-if="src" :src="src" :alt="alt || ''" @error="imgError = true" />
    <span v-else>{{ initial }}</span>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  src: String,
  alt: String,
  size: { type: String, default: 'md' }, // sm, md, lg
  color: String
})

const imgError = ref(false)

const initial = computed(() => {
  if (props.alt) return props.alt.charAt(0).toUpperCase()
  return '?'
})

const avatarStyle = computed(() => {
  if (!props.src || imgError.value) {
    return {
      background: props.color || 'var(--s-accent-soft)',
      color: props.color ? '#fff' : 'var(--s-accent)'
    }
  }
  return {}
})
</script>
