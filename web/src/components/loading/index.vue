<template>
  <svg class="s-spinner-icon" :style="{ width: `${size}px`, height: `${size}px` }" viewBox="0 0 20 20">
    <circle v-for="i in 4" :key="i" :class="`dot${i}`" r="3.375" cx="0" cy="0" />
  </svg>
</template>

<script>
export default {
  props: {
    size: { type: Number, default: 30 }
  }
}
</script>

<style scoped>
.s-spinner-icon {
  animation: loading-rotate 2s linear infinite;
}
circle {
  fill: var(--s-accent);
  opacity: 0.3;
  animation: pulse 1s infinite linear alternate;
}
.dot1 { transform: translate(3.75px, 3.75px); animation-delay: 0s; }
.dot2 { transform: translate(12.5px, 3.75px); animation-delay: 0.4s; }
.dot3 { transform: translate(3.75px, 12.5px); animation-delay: 1.2s; }
.dot4 { transform: translate(12.5px, 12.5px); animation-delay: 0.8s; }

@keyframes loading-rotate { to { transform: rotate(360deg); } }
@keyframes pulse { to { opacity: 1; } }
</style>
