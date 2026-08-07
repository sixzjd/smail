<template>
  <div class="s-dropdown-item" :class="{ 's-dropdown-item--danger': danger }" @click="$emit('click', $event)">
    <slot />
  </div>
</template>

<script setup>
defineProps({
  danger: Boolean
})
defineEmits(['click'])
</script>
