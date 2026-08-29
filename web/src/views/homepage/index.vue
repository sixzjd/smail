<template>
  <div class="home-page" style="padding: 2rem; text-align: center;">
    <h1 style="margin-bottom: 1.5rem;">项目总览</h1>
    <div class="project-list" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 2rem;">
      <a class="project-card" href="https://mail.sixzjd.sbs" target="_blank" style="width: 260px; padding: 1.5rem; border: 1px solid #e0e0e0; border-radius: 8px; text-decoration: none; color: inherit;">
        <h2>🧭 smail（临时邮箱）</h2>
        <p>基于 Cloudflare Edge 的临时邮件服务。</p>
      </a>
      <a class="project-card" href="https://fakegps.sixzjd.sbs" target="_blank" style="width: 260px; padding: 1.5rem; border: 1px solid #e0e0e0; border-radius: 8px; text-decoration: none; color: inherit;">
        <h2>🛰️ fakegps（iPhone GPS 模拟）</h2>
        <p>在 iPhone 上模拟 GPS 位置的工具。</p>
      </a>
      <a class="project-card" href="https://macraft.sixzjd.sbs" target="_blank" style="width: 260px; padding: 1.5rem; border: 1px solid #e0e0e0; border-radius: 8px; text-decoration: none; color: inherit;">
        <h2>🛠️ macraft（Minecraft 服务器管理）</h2>
        <p>提供 Minecraft 服务器的可视化管理面板。</p>
      </a>
    </div>
  </div>
</template>

<script setup>
// No script needed – purely static navigation.
</script>

<style scoped>
.project-card:hover {
  background-color: #f9f9f9;
  border-color: #d0d0d0;
}
</style>
