<template>
  <div class="s-tabs">
    <div class="s-tabs-header">
      <button
        v-for="tab in tabs"
        :key="tab.name"
        class="s-tab-btn"
        :class="{ active: modelValue === tab.name }"
        @click="emit('update:modelValue', tab.name)"
      >
        {{ tab.label }}
      </button>
    </div>
    <div class="s-tabs-content">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: String,
  tabs: { type: Array, default: () => [] } // [{ name: 'tab1', label: '标签1' }]
})
const emit = defineEmits(['update:modelValue'])
</script>
