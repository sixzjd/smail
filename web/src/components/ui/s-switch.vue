<template>
  <div class="s-switch" :class="{ on: modelValue }" @click="toggle" :aria-checked="modelValue" role="switch">
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: Boolean,
  disabled: Boolean
})
const emit = defineEmits(['update:modelValue'])

const toggle = () => {
  if (!props.disabled) {
    emit('update:modelValue', !props.modelValue)
  }
}
</script>
