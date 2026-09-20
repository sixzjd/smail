<template>
  <div class="home-page">
    <div class="home-inner">
      <header class="home-head">
        <h1 class="home-title">{{ t('projectOverview') }}</h1>
        <p class="home-sub">{{ t('projectOverviewDesc') }}</p>
      </header>

      <div class="home-grid">
        <a v-for="item in onlineProjects"
           :key="item.name"
           class="project-card"
           :href="item.href"
           target="_blank"
           rel="noopener noreferrer">
          <span class="project-icon">
            <Icon :icon="item.icon" width="20" height="20" />
          </span>
          <span class="project-body">
            <span class="project-name">{{ item.name }}</span>
            <span class="project-desc">{{ item.desc }}</span>
          </span>
        </a>

        <div v-for="item in offlineProjects"
             :key="item.name"
             class="project-card project-card--off">
          <span class="project-icon">
            <Icon :icon="item.icon" width="20" height="20" />
          </span>
          <span class="project-body">
            <span class="project-name">
              {{ item.name }}
              <s-tag type="info">{{ t('notOnline') }}</s-tag>
            </span>
            <span class="project-desc">{{ item.desc }}</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {computed} from 'vue'
import {Icon} from '@iconify/vue'
import {useI18n} from 'vue-i18n'

defineOptions({
  name: 'home'
})

const {t} = useI18n()

// href 为 null 的条目渲染成不可点击的「未上线」卡片。
// macraft.sixzjd.sbs 目前没有 DNS A 记录（已用 DoH 核实），指向它只会打开失败页；
// 等站点上线后把 href 填回即可自动变成可点击卡片。
const projects = [
  {
    name: 'smail（临时邮箱）',
    desc: '基于 Cloudflare Edge 的临时邮件服务。',
    href: 'https://mail.sixzjd.sbs',
    icon: 'iconoir:mail'
  },
  {
    name: 'fakegps（iPhone GPS 模拟）',
    desc: '在 iPhone 上模拟 GPS 位置的工具。',
    href: 'https://fakegps.sixzjd.sbs',
    icon: 'iconoir:map-pin'
  },
  {
    name: 'macraft（Minecraft 服务器管理）',
    desc: '提供 Minecraft 服务器的可视化管理面板。',
    href: null,
    icon: 'iconoir:server'
  }
]

const onlineProjects = computed(() => projects.filter(item => item.href))
const offlineProjects = computed(() => projects.filter(item => !item.href))
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  background: var(--s-body);
  font-family: var(--s-font-body);
  color: var(--s-ink);
}

.home-inner {
  width: 100%;
  max-width: 880px;
}

.home-head {
  text-align: center;
  margin-bottom: 28px;
}

.home-title {
  margin: 0 0 6px;
  font-family: var(--s-font-display);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.2px;
}

.home-sub {
  margin: 0;
  font-size: 13px;
  color: var(--s-muted);
}

.home-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 14px;
}

.project-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: var(--s-paper);
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-lg);
  color: inherit;
  text-decoration: none;
  transition: border-color var(--s-ease), transform var(--s-ease), box-shadow var(--s-ease);
}

a.project-card:hover {
  border-color: var(--s-accent);
  transform: translateY(-2px);
  box-shadow: var(--s-shadow-sm);
}

.project-card--off {
  opacity: 0.62;
  cursor: default;
}

.project-icon {
  flex: 0 0 auto;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--s-radius);
  background: var(--s-accent-soft);
  color: var(--s-accent);
}

.project-card--off .project-icon {
  background: var(--s-soft);
  color: var(--s-muted);
}

.project-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.project-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--s-font-display);
  font-size: 14px;
  font-weight: 600;
}

.project-desc {
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--s-muted);
}
</style>
