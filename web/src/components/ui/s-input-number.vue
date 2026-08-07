<template>
  <div class="s-input-number">
    <button @click="decrement" :disabled="min !== undefined && modelValue <= min">−</button>
    <input type="number" :value="modelValue" :min="min" :max="max" :step="step" @input="onInput" />
    <button @click="increment" :disabled="max !== undefined && modelValue >= max">+</button>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Number, default: 0 },
  min: Number,
  max: Number,
  step: { type: Number, default: 1 }
})
const emit = defineEmits(['update:modelValue'])

const clamp = (val) => {
  if (props.min !== undefined) val = Math.max(props.min, val)
  if (props.max !== undefined) val = Math.min(props.max, val)
  return val
}

const decrement = () => emit('update:modelValue', clamp(props.modelValue - props.step))
const increment = () => emit('update:modelValue', clamp(props.modelValue + props.step))
const onInput = (e) => emit('update:modelValue', clamp(Number(e.target.value)))
</script>
