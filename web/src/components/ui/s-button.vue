<template>
  <button
    class="s-btn"
    :class="[
      `s-btn--${type}`,
      size && `s-btn--${size}`,
      { 's-btn--icon': icon, 's-btn--block': block }
    ]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="s-spinner"></span>
    <slot v-else />
  </button>
</template>

<script setup>
defineProps({
  type: { type: String, default: 'secondary' }, // primary, secondary, outline, danger, ghost
  size: { type: String, default: '' }, // sm, lg
  disabled: Boolean,
  loading: Boolean,
  icon: Boolean,
  block: Boolean
})
defineEmits(['click'])
</script>

<style scoped>
.s-spinner {
  width: 14px; height: 14px; border: 2px solid currentColor;
  border-top-color: transparent; border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
