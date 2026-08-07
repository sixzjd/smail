<template>
  <label class="s-radio" :class="{ checked: isChecked }">
    <input type="radio" :value="label" :checked="isChecked" @change="emit('update:modelValue', label)" />
    <span class="s-radio-dot"></span>
    <span v-if="$slots.default" class="s-radio-label"><slot /></span>
  </label>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number, Boolean], default: '' },
  label: { type: [String, Number, Boolean], required: true }
})
const emit = defineEmits(['update:modelValue'])

const isChecked = computed(() => props.modelValue === props.label)
</script>
