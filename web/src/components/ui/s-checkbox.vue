<template>
  <label class="s-checkbox" :class="{ checked: isChecked, indeterminate }">
    <input type="checkbox" :checked="isChecked" @change="toggle" />
    <span class="s-checkbox-box">
      <span v-if="isChecked">✓</span>
      <span v-else-if="indeterminate">−</span>
    </span>
    <span v-if="$slots.default" class="s-checkbox-label"><slot /></span>
  </label>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  indeterminate: Boolean
})
const emit = defineEmits(['update:modelValue'])

const isChecked = computed(() => props.modelValue)

const toggle = () => {
  emit('update:modelValue', !props.modelValue)
}
</script>
