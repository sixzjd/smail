<template>
  <button class="hamburger-btn" :class="{ 'is-active': isActive }" @click="toggleClick" aria-label="Toggle menu">
    <svg
      class="hamburger-icon"
      viewBox="0 0 1024 1024"
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      fill="currentColor"
    >
      <path d="M408 442h480c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H408c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8zm-8 204c0 4.4 3.6 8 8 8h480c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H408c-4.4 0-8 3.6-8 8v56zm504-486H120c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zm0 632H120c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zM142.4 642.1L298.7 519a8.84 8.84 0 0 0 0-13.9L142.4 381.9c-5.8-4.6-14.4-.5-14.4 6.9v246.3a8.9 8.9 0 0 0 14.4 7z" />
    </svg>
  </button>
</template>

<script setup>
defineProps({
  isActive: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits()
const toggleClick = () => {
  emit('toggleClick');
}
</script>

<style scoped>
.hamburger-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: var(--s-radius, 8px);
  background: transparent;
  color: var(--s-ink-secondary, #5c534a);
  cursor: pointer;
  transition: all var(--s-ease, 200ms ease);
}

.hamburger-btn:hover {
  background: var(--s-soft, #f3eadf);
  color: var(--s-ink, #211c19);
}

.hamburger-icon {
  display: block;
  transition: transform var(--s-ease, 200ms ease);
}

.hamburger-btn.is-active .hamburger-icon {
  transform: rotate(180deg);
}
</style>
