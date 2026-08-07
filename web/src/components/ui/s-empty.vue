<template>
  <div class="s-empty">
    <div class="s-empty-icon">
      <slot name="icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </slot>
    </div>
    <div v-if="description" class="s-empty-text">{{ description }}</div>
    <div v-if="$slots.default" class="s-empty-sub"><slot /></div>
  </div>
</template>

<script setup>
defineProps({
  description: String
})
</script>
