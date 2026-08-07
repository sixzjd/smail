<template>
  <Teleport to="body">
    <div v-if="modelValue" class="s-modal-mask" @click.self="closeOnMask && close()">
      <div class="s-modal" :class="`s-modal--${size}`">
        <div class="s-modal-header">
          <div class="s-modal-title">
            <slot name="title">{{ title }}</slot>
          </div>
          <button v-if="showClose" class="s-modal-close" @click="close" aria-label="关闭">×</button>
        </div>
        <div class="s-modal-body">
          <slot />
        </div>
        <div v-if="$slots.footer" class="s-modal-footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  modelValue: Boolean,
  title: String,
  size: { type: String, default: 'md' }, // sm, md, lg, xl
  showClose: { type: Boolean, default: true },
  closeOnMask: { type: Boolean, default: true }
})
const emit = defineEmits(['update:modelValue', 'close'])

const close = () => {
  emit('update:modelValue', false)
  emit('close')
}
</script>
