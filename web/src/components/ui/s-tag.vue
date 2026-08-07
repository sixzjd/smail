<template>
  <span class="s-tag" :class="`s-tag--${type}`">
    <slot />
  </span>
</template>

<script setup>
defineProps({
  type: { type: String, default: 'default' } // default, accent, success, warning, danger, info
})
</script>
