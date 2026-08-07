<template>
  <div class="s-radio-group" v-if="!buttonStyle">
    <s-radio v-for="opt in options" :key="opt.value" :modelValue="modelValue" :label="opt.value" @update:modelValue="emit('update:modelValue', $event)">
      {{ opt.label }}
    </s-radio>
  </div>
  <div class="s-radio-button-group" v-else>
    <button
      v-for="opt in options"
      :key="opt.value"
      class="s-radio-button"
      :class="{ active: modelValue === opt.value }"
      @click="emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<script setup>
import SRadio from './s-radio.vue'

defineProps({
  modelValue: { type: [String, Number, Boolean], default: '' },
  options: { type: Array, default: () => [] },
  buttonStyle: Boolean
})
const emit = defineEmits(['update:modelValue'])
</script>
