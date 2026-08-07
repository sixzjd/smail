<template>
  <div class="test-page">
    <h1 class="test-title">Test Page</h1>
    <p class="test-desc">Editorial design system test area.</p>
  </div>
</template>

<script setup>

</script>

<style scoped lang="scss">
.test-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  padding: 24px;
}

.test-title {
  font-family: var(--s-font-display);
  font-size: 24px;
  font-weight: 700;
  color: var(--s-ink);
  margin: 0;
}

.test-desc {
  font-size: 14px;
  color: var(--s-muted);
  margin: 0;
}
</style>
