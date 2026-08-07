<template>
  <div class="s-input-wrap" :class="{ 's-input-wrap--error': error }">
    <span v-if="$slots.prefix || prefixIcon" class="s-input-icon">
      <slot name="prefix">{{ prefixIcon }}</slot>
    </span>
    <input
      v-if="type !== 'textarea'"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      @input="$emit('update:modelValue', $event.target.value)"
      @change="$emit('change', $event.target.value)"
      @blur="$emit('blur', $event)"
      @focus="$emit('focus', $event)"
    />
    <textarea
      v-else
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :rows="rows"
      @input="$emit('update:modelValue', $event.target.value)"
      @change="$emit('change', $event.target.value)"
      @blur="$emit('blur', $event)"
      @focus="$emit('focus', $event)"
    ></textarea>
    <span v-if="$slots.suffix" class="s-input-icon">
      <slot name="suffix" />
    </span>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: [String, Number], default: '' },
  type: { type: String, default: 'text' },
  placeholder: String,
  disabled: Boolean,
  readonly: Boolean,
  error: Boolean,
  prefixIcon: String,
  rows: { type: Number, default: 3 }
})
defineEmits(['update:modelValue', 'change', 'blur', 'focus'])
</script>
