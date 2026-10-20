<template>
  <div class="client-page">
    <!-- 服务器设置 -->
    <section class="client-card">
      <h2 class="card-title">{{ $t('clientServerTitle') }}</h2>
      <div class="card-body">
        <div v-if="!config.enabled" class="notice">
          <Icon icon="fluent:info-24-filled" width="18" height="18" />
          <span>{{ $t('clientNotEnabled') }}</span>
        </div>

        <div class="field-row">
          <span class="field-label">{{ $t('clientIncomingServer') }}</span>
          <div class="field-value">
            <code class="mono">{{ config.imap?.host || '-' }}</code>
            <span class="sep">·</span>
            <span>{{ $t('clientPort') }} {{ config.imap?.tlsPort || 993 }} (SSL/TLS)</span>
            <span class="sep">·</span>
            <span>{{ $t('clientPort') }} {{ config.imap?.port || 143 }} (STARTTLS)</span>
            <button class="copy-btn" @click="copy(config.imap?.host)">
              <Icon icon="fluent:copy-24-regular" width="15" height="15" />
            </button>
          </div>
        </div>

        <div class="field-row">
          <span class="field-label">{{ $t('clientOutgoingServer') }}</span>
          <div class="field-value">
            <code class="mono">{{ config.smtp?.host || '-' }}</code>
            <span class="sep">·</span>
            <span>{{ $t('clientPort') }} {{ config.smtp?.tlsPort || 465 }} (SSL/TLS)</span>
            <span class="sep">·</span>
            <span>{{ $t('clientPort') }} {{ config.smtp?.port || 587 }} (STARTTLS)</span>
            <button class="copy-btn" @click="copy(config.smtp?.host)">
              <Icon icon="fluent:copy-24-regular" width="15" height="15" />
            </button>
          </div>
        </div>

        <div class="field-row">
          <span class="field-label">{{ $t('clientUsername') }}</span>
          <div class="field-value">
            <code class="mono">{{ userStore.user.email || '-' }}</code>
            <button class="copy-btn" @click="copy(userStore.user.email)">
              <Icon icon="fluent:copy-24-regular" width="15" height="15" />
            </button>
          </div>
        </div>

        <div class="field-row">
          <span class="field-label">{{ $t('clientPassword') }}</span>
          <div class="field-value">
            <span class="muted">{{ $t('clientPasswordTip') }}</span>
            <s-button type="primary" size="sm" @click="router.push({ name: 'setting' })">
              {{ $t('clientChangePwd') }}
            </s-button>
          </div>
        </div>

        <div v-if="accounts.length > 1" class="field-row">
          <span class="field-label">{{ $t('clientMyMailboxes') }}</span>
          <div class="field-value tags">
            <span v-for="item in accounts" :key="item.accountId" class="tag">{{ item.email }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 客户端指引 -->
    <section class="client-card">
      <h2 class="card-title">{{ $t('clientGuideTitle') }}</h2>
      <div class="card-body">
        <div class="guide-tabs">
          <button v-for="tab in tabs" :key="tab.key" class="guide-tab" :class="{ active: tab.key === activeTab }" @click="activeTab = tab.key">
            {{ tab.label }}
          </button>
        </div>

        <ol class="guide-steps">
          <li v-for="(step, index) in activeSteps" :key="index">
            <span class="step-index">{{ index + 1 }}</span>
            <div class="step-content">
              <div class="step-title">{{ step.title }}</div>
              <div class="step-desc">{{ step.desc }}</div>
              <div v-if="step.fields && step.fields.length" class="step-fields">
                <div v-for="field in step.fields" :key="field.label" class="step-field">
                  <span class="field-name">{{ field.label }}</span>
                  <code class="mono">{{ field.value }}</code>
                  <button v-if="field.copy !== false" class="copy-btn" @click="copy(field.value)">
                    <Icon icon="fluent:copy-24-regular" width="14" height="14" />
                  </button>
                </div>
              </div>
            </div>
          </li>
        </ol>

        <div v-if="activeTab === 'ios'" class="tip-box">
          <Icon icon="fluent:warning-24-filled" width="16" height="16" />
          <span>{{ $t('clientIosDefaultTip') }}</span>
        </div>
      </div>
    </section>

    <!-- 说明 -->
    <section class="client-card">
      <h2 class="card-title">{{ $t('clientNoteTitle') }}</h2>
      <div class="card-body">
        <ul class="note-list">
          <li>{{ $t('clientNote1') }}</li>
          <li>{{ $t('clientNote2') }}</li>
          <li>{{ $t('clientNote3') }}</li>
          <li>{{ $t('clientNote4') }}</li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/store/user.js'
import { clientConfig } from '@/request/client.js'
import { toast } from '@/components/ui/toast.js'
import router from '@/router/index.js'
import SButton from '@/components/ui/s-button.vue'

const { t } = useI18n()
const userStore = useUserStore()
const activeTab = ref('ios')

const config = ref({ enabled: false, imap: {}, smtp: {}, accounts: [] })
const accounts = computed(() => config.value.accounts || [])

const imapHost = computed(() => config.value.imap?.host || 'imap.example.com')
const smtpHost = computed(() => config.value.smtp?.host || 'smtp.example.com')
const imapTlsPort = computed(() => config.value.imap?.tlsPort || 993)
const imapPort = computed(() => config.value.imap?.port || 143)
const smtpTlsPort = computed(() => config.value.smtp?.tlsPort || 465)
const smtpPort = computed(() => config.value.smtp?.port || 587)
const username = computed(() => userStore.user.email || 'you@example.com')

const tabs = computed(() => [
  { key: 'ios', label: t('clientIosMail') },
  { key: 'outlook', label: t('clientOutlook') },
  { key: 'thunderbird', label: t('clientThunderbird') },
])

const guides = computed(() => ({
  ios: [
    {
      title: t('clientIosStep1'),
      desc: t('clientIosStep1Desc'),
      fields: [
        { label: t('clientType'), value: t('clientTypeOther'), copy: false },
      ]
    },
    {
      title: t('clientIosStep2'),
      desc: t('clientIosStep2Desc'),
      fields: [
        { label: t('clientIncomingServer'), value: imapHost.value },
        { label: t('clientPort'), value: `${imapTlsPort.value}` },
        { label: t('clientSsl'), value: t('clientSslOn'), copy: false },
        { label: t('clientUsername'), value: username.value },
        { label: t('clientPassword'), value: t('clientPasswordTip'), copy: false },
      ]
    },
    {
      title: t('clientIosStep3'),
      desc: t('clientIosStep3Desc'),
      fields: [
        { label: t('clientOutgoingServer'), value: smtpHost.value },
        { label: t('clientPort'), value: `${smtpTlsPort.value}` },
        { label: t('clientSsl'), value: t('clientSslOn'), copy: false },
        { label: t('clientUsername'), value: username.value },
        { label: t('clientPassword'), value: t('clientPasswordTip'), copy: false },
      ]
    },
    {
      title: t('clientIosStep4'),
      desc: t('clientIosStep4Desc'),
    },
  ],
  outlook: [
    {
      title: t('clientOutlookStep1'),
      desc: t('clientOutlookStep1Desc'),
      fields: [
        { label: t('clientType'), value: t('clientTypeImap') },
      ]
    },
    {
      title: t('clientOutlookStep2'),
      desc: t('clientOutlookStep2Desc'),
      fields: [
        { label: t('clientIncomingServer'), value: imapHost.value },
        { label: t('clientPort'), value: `${imapTlsPort.value} (SSL/TLS)` },
        { label: t('clientUsername'), value: username.value },
        { label: t('clientPassword'), value: t('clientPasswordTip') },
      ]
    },
    {
      title: t('clientOutlookStep3'),
      desc: t('clientOutlookStep3Desc'),
      fields: [
        { label: t('clientOutgoingServer'), value: smtpHost.value },
        { label: t('clientPort'), value: `${smtpTlsPort.value} (SSL/TLS)` },
        { label: t('clientUsername'), value: username.value },
        { label: t('clientPassword'), value: t('clientPasswordTip') },
      ]
    },
  ],
  thunderbird: [
    {
      title: t('clientTbStep1'),
      desc: t('clientTbStep1Desc'),
      fields: [
        { label: t('clientType'), value: t('clientTypeImap') },
        { label: t('clientIncomingServer'), value: imapHost.value },
        { label: t('clientPort'), value: `${imapTlsPort.value} (SSL/TLS)` },
        { label: t('clientUsername'), value: username.value },
        { label: t('clientPassword'), value: t('clientPasswordTip') },
      ]
    },
    {
      title: t('clientTbStep2'),
      desc: t('clientTbStep2Desc'),
      fields: [
        { label: t('clientOutgoingServer'), value: smtpHost.value },
        { label: t('clientPort'), value: `${smtpTlsPort.value} (SSL/TLS)` },
        { label: t('clientUsername'), value: username.value },
        { label: t('clientPassword'), value: t('clientPasswordTip') },
        { label: t('clientAuthMethod'), value: t('clientAuthNormal') },
      ]
    },
    {
      title: t('clientTbStep3'),
      desc: t('clientTbStep3Desc'),
    },
  ],
}))

const activeSteps = computed(() => guides.value[activeTab.value] || [])

async function copy(text) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    toast(t('copySuccessMsg'), 'success')
  } catch (e) {
    toast(t('copyFailMsg'), 'error')
  }
}

onMounted(async () => {
  try {
    const data = await clientConfig()
    config.value = data || { enabled: false, imap: {}, smtp: {}, accounts: [] }
  } catch (e) {
    // 配置接口失败时保持占位即可
  }
})
</script>

<style scoped lang="scss">
.client-page {
  padding: 40px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 60px;

  @media (max-width: 767px) {
    padding: 24px 20px;
    padding-bottom: 40px;
    gap: 20px;
  }
}

.client-card {
  background: var(--s-paper);
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-lg);
  transition: box-shadow var(--s-ease);

  &:hover {
    box-shadow: var(--s-shadow-sm);
  }
}

.card-title {
  font-family: var(--s-font-display);
  font-size: 16px;
  font-weight: 700;
  color: var(--s-ink);
  padding: 16px 24px;
  border-bottom: 1px solid var(--s-line-light);
  margin: 0;
}

.card-body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-radius: var(--s-radius);
  background: var(--s-accent-soft);
  color: var(--s-accent);
  font-size: 13px;
  line-height: 1.6;
}

.field-row {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 16px;
  align-items: center;
  font-size: 14px;

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
    gap: 6px;
  }
}

.field-label {
  font-weight: 600;
  color: var(--s-ink-secondary);
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.field-value {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--s-ink);
}

.field-value.tags {
  gap: 6px;
}

.tag {
  font-size: 12px;
  padding: 3px 9px;
  border-radius: 999px;
  background: var(--s-soft);
  color: var(--s-ink-secondary);
  border: 1px solid var(--s-line-light);
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
  background: var(--s-soft);
  padding: 2px 8px;
  border-radius: 6px;
  color: var(--s-ink);
  word-break: break-all;
}

.sep { color: var(--s-muted); }
.muted { color: var(--s-muted); font-size: 13px; }

.copy-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--s-muted);
  cursor: pointer;
  transition: all var(--s-ease);

  &:hover {
    background: var(--s-soft);
    color: var(--s-accent);
  }
}

.guide-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid var(--s-line-light);
  padding-bottom: 12px;
}

.guide-tab {
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid var(--s-line);
  background: transparent;
  color: var(--s-ink-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--s-ease);

  &:hover { color: var(--s-accent); }

  &.active {
    background: var(--s-accent-soft);
    border-color: transparent;
    color: var(--s-accent);
    font-weight: 600;
  }
}

.guide-steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.guide-steps li {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.step-index {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--s-accent-soft);
  color: var(--s-accent);
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1px;
}

.step-content { flex: 1; min-width: 0; }

.step-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--s-ink);
  margin-bottom: 4px;
}

.step-desc {
  font-size: 13px;
  color: var(--s-ink-secondary);
  line-height: 1.7;
}

.step-fields {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.step-field {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.field-name {
  font-size: 12px;
  color: var(--s-muted);
  min-width: 92px;
}

.note-list {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 13px;
  color: var(--s-ink-secondary);
  line-height: 1.7;
}

.tip-box {
  margin-top: 16px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 14px;
  border-radius: var(--s-radius);
  background: var(--s-accent-soft);
  color: var(--s-accent);
  font-size: 13px;
  line-height: 1.7;
}
</style>
