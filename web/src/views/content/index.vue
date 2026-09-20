<template>
  <div class="content-box">
    <!-- Action bar -->
    <div class="content-toolbar">
      <div class="toolbar-left">
        <button class="toolbar-btn" @click="handleBack" aria-label="Back">
          <Icon icon="material-symbols-light:arrow-back-ios-new" width="18" height="18" />
        </button>
      </div>
      <div class="toolbar-right">
        <!-- 恢复按钮只在回收站来源的详情页出现（trash 视图把 showRestore 置 true）。
             与彻底删除同属回收站管理动作，故同样要求 email:delete。 -->
        <button class="toolbar-btn" v-if="emailStore.contentData.showRestore" v-perm="'email:delete'"
                @click="handleRestore" :aria-label="$t('restoreEmail')" :title="$t('restoreEmail')">
          <Icon icon="iconoir:undo" width="17" height="17" />
        </button>
        <button class="toolbar-btn" v-perm="deletePerm" @click="handleDelete" aria-label="Delete">
          <Icon icon="uiw:delete" width="15" height="15" />
        </button>
        <span class="toolbar-divider" v-if="emailStore.contentData.showStar"></span>
        <button class="toolbar-btn toolbar-star" v-if="emailStore.contentData.showStar" @click="changeStar" aria-label="Star">
          <Icon v-if="email.isStar" icon="fluent-color:star-16" width="18" height="18" />
          <Icon v-else icon="solar:star-line-duotone" width="16" height="16" />
        </button>
        <button class="toolbar-btn" v-if="emailStore.contentData.showReply" v-perm="'email:send'" @click="openReply" aria-label="Reply">
          <Icon icon="la:reply" width="18" height="18" />
        </button>
        <button class="toolbar-btn" v-if="emailStore.contentData.showReply" v-perm="'email:send'" @click="openForward" aria-label="Forward">
          <Icon icon="iconoir:arrow-up-right" width="17" height="17" />
        </button>
      </div>
    </div>

    <!-- Scrollable content area -->
    <div class="content-scroll">
      <div class="content-inner">
        <!-- Subject -->
        <h1 class="email-subject">{{ email.subject }}</h1>

        <!-- Sender info -->
        <div class="sender-card">
          <div class="sender-avatar">
            <s-avatar :alt="email.name || email.sendEmail" size="lg" />
          </div>
          <div class="sender-meta">
            <div class="sender-row">
              <span class="sender-name">{{ email.name }}</span>
              <span class="sender-addr">&lt;{{ email.sendEmail }}&gt;</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">{{ $t('from') }}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">{{ $t('recipient') }}</span>
              <span class="meta-value">{{ formateReceive(email.recipient) }}</span>
            </div>
            <div class="meta-row">
              <span class="meta-value meta-date">{{ formatDetailDate(email.createTime) }}</span>
            </div>
          </div>
        </div>

        <!-- Status banners -->
        <div v-if="email.status === 3" class="status-banner status-banner--error">
          <s-tag type="danger">Error</s-tag>
          <span>{{ toMessage(email.message) }}</span>
        </div>
        <div v-if="email.status === 4" class="status-banner status-banner--warn">
          <s-tag type="warning">{{ $t('complained') }}</s-tag>
        </div>
        <div v-if="email.status === 5" class="status-banner status-banner--warn">
          <s-tag type="warning">{{ $t('delayed') }}</s-tag>
        </div>

        <!-- Email body -->
        <div class="email-body" :class="{ 'email-body--no-att': !email.attList || email.attList.length === 0 }">
          <ShadowHtml class="email-html" :html="formatImage(email.content)" v-if="email.content" />
          <pre v-else class="email-text">{{ email.text }}</pre>
        </div>

        <!-- Attachments -->
        <div class="attachments" v-if="email.attList && email.attList.length > 0">
          <div class="att-header">
            <span class="att-label">{{ $t('attachments') }}</span>
            <span class="att-count">{{ $t('attCount', { total: email.attList.length }) }}</span>
          </div>
          <div class="att-grid">
            <div class="att-card" v-for="att in email.attList" :key="att.attId">
              <div class="att-card-icon" @click="showImage(att.key)">
                <Icon v-bind="getIconByName(att.filename)" />
              </div>
              <div class="att-card-name" @click="showImage(att.key)" :title="att.filename">
                {{ att.filename }}
              </div>
              <div class="att-card-size">{{ formatBytes(att.size) }}</div>
              <div class="att-card-actions">
                <Icon v-if="isImage(att.filename)" icon="hugeicons:view" width="18" height="18" @click="showImage(att.key)" />
                <a :href="cvtR2Url(att.key)" download>
                  <Icon icon="system-uicons:push-down" width="18" height="18" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Image preview overlay -->
    <Teleport to="body">
      <div v-if="showPreview" class="img-preview-mask" @click="showPreview = false">
        <button class="img-preview-close" @click="showPreview = false">&times;</button>
        <img :src="srcList[0]" class="img-preview-img" @click.stop />
      </div>
    </Teleport>
  </div>
</template>
<script setup>
import ShadowHtml from '@/components/shadow-html/index.vue'
import {computed, reactive, ref, watch, onMounted, onUnmounted} from "vue";
import {useRouter} from 'vue-router'
import { toast } from '@/components/ui/toast.js'
import { confirm } from '@/components/ui/confirm.js'
import {emailDelete, emailPermanentDelete, emailRead, emailDetail, emailRestore} from "@/request/email.js";
import {Icon} from "@iconify/vue";
import {useEmailStore} from "@/store/email.js";
import {useAccountStore} from "@/store/account.js";
import {formatDetailDate} from "@/utils/day.js";
import {starAdd, starCancel} from "@/request/star.js";
import {getExtName, formatBytes} from "@/utils/file-utils.js";
import {cvtR2Url, formatImage} from "@/utils/convert.js";
import {getIconByName} from "@/utils/icon-utils.js";
import {allEmailDelete} from "@/request/all-email.js";
import {useUiStore} from "@/store/ui.js";
import {useI18n} from "vue-i18n";
import {EmailUnreadEnum} from "@/enums/email-enum.js";
import SAvatar from '@/components/ui/s-avatar.vue'
import STag from '@/components/ui/s-tag.vue'

const uiStore = useUiStore();
const accountStore = useAccountStore();
const emailStore = useEmailStore();
const router = useRouter()

// 删除按钮的权限随来源视图变化：
// 收件箱/已发送/星标 -> /api/email/delete，回收站 -> /api/email/permanent-delete，二者同属 email:delete；
// 「全部邮件」-> /api/allEmail/delete，属 all-email:delete。
const deletePerm = computed(() => {
  const delType = emailStore.contentData.delType
  return (delType === 'logic' || delType === 'permanent') ? 'email:delete' : 'all-email:delete'
})
const email = emailStore.contentData.email
const showPreview = ref(false)
const srcList = reactive([])
const detailLoaded = ref(false)

const { t } = useI18n()

watch(() => accountStore.currentAccountId, () => {
  handleBack()
})

onMounted(async () => {
  if (emailStore.contentData.showUnread && email.unread === EmailUnreadEnum.UNREAD) {
    email.unread = EmailUnreadEnum.READ;
    emailRead([email.emailId]);
  }
  try {
    const data = await emailDetail(email.emailId);
    if (data) {
      Object.assign(email, data);
    }
  } catch (e) {
    console.error(e);
  } finally {
    detailLoaded.value = true;
  }
})

onUnmounted(() => {
  emailStore.contentData.showUnread = false;
  // showRestore 由 trash 视图置 true，若不在此复位，之后从收件箱打开邮件
  // 也会看到「恢复」按钮（content 不在 keep-alive include 里，卸载必定触发）。
  emailStore.contentData.showRestore = false;
})

function openReply() {
  uiStore.writerRef.openReply(email)
}

function openForward() {
  uiStore.writerRef.openForward(email)
}

function toMessage(message) {
  return  message ? JSON.parse(message).message : '';
}

function showImage(key) {
  if (!isImage(key)) return;
  const url = cvtR2Url(key)
  srcList.length = 0
  srcList.push(url)
  showPreview.value = true
}

function isImage(filename) {
  return ['png', 'jpg', 'jpeg', 'bmp', 'gif','jfif'].includes(getExtName(filename))
}

function formateReceive(recipient) {
  recipient = JSON.parse(recipient)
  return recipient.map(item => item.address).join(', ')
}

function changeStar() {
  if (email.isStar) {
    email.isStar = 0;
    starCancel(email.emailId).then(() => {
      email.isStar = 0;
      emailStore.cancelStarEmailId = email.emailId
      setTimeout(() => emailStore.cancelStarEmailId = 0)
      emailStore.starScroll?.deleteEmail([email.emailId])
    }).catch((e) => {
      console.error(e)
      email.isStar = 1;
    })
  } else {
    email.isStar = 1;
    starAdd(email.emailId).then(() => {
      email.isStar = 1;
      emailStore.addStarEmailId = email.emailId
      setTimeout(() => emailStore.addStarEmailId = 0)
      emailStore.starScroll?.addItem(email)
    }).catch((e) => {
      console.error(e)
      email.isStar = 0;
    })
  }
}

const handleBack = () => {
  router.back()
}

// 从回收站恢复：把 isDel 置回 NORMAL，邮件重新回到收件箱。
// 后端 /api/email/restore 已按 userId 收窄，传别人的 emailId 不会有任何效果。
const handleRestore = async () => {
  const ok = await confirm(t('restoreEmailConfirm'), t('confirm'))
  if (!ok) return
  emailRestore([email.emailId]).then(() => {
    toast(t('restoreSuccess'), 'success')
    // 复用 deleteIds 通道让 email-scroll 把这一行从回收站列表里摘掉
    emailStore.deleteIds = [email.emailId]
    // 收件箱/已发送都在 keep-alive 的 include 列表里，切回去不会重新拉数据，
    // 恢复后的邮件若不显式刷新就永远看不到（同 layout/account 切账号的做法）。
    emailStore.emailScroll?.refreshList()
    emailStore.sendScroll?.refreshList()
  })
  router.back()
}

const handleDelete = async () => {
  const ok = await confirm(t('delEmailConfirm'), t('confirm'))
  if (!ok) return
  const delType = emailStore.contentData.delType

  if (delType === 'logic') {
    emailDelete(email.emailId).then(() => {
      toast(t('delSuccessMsg'), 'success')
      emailStore.deleteIds = [email.emailId]
    })
  } else if (delType === 'permanent') {
    emailPermanentDelete([email.emailId]).then(() => {
      toast(t('delSuccessMsg'), 'success')
      emailStore.deleteIds = [email.emailId]
    })
  } else {
    allEmailDelete(email.emailId).then(() => {
      toast(t('delSuccessMsg'), 'success')
      emailStore.deleteIds = [email.emailId]
    })
  }
  router.back()
}
</script>
<style scoped lang="scss">
.content-box {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--s-paper);
  overflow: hidden;
}

/* ── Toolbar ── */
.content-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 20px;
  border-bottom: 1px solid var(--s-line);
  flex-shrink: 0;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: none;
  background: transparent;
  border-radius: var(--s-radius);
  color: var(--s-muted);
  cursor: pointer;
  transition: all var(--s-ease);

  &:hover {
    background: var(--s-soft);
    color: var(--s-ink);
  }
}

.toolbar-star:hover {
  color: #d4a017;
}

.toolbar-divider {
  width: 1px;
  height: 18px;
  background: var(--s-line);
  margin: 0 4px;
}

/* ── Scroll area ── */
.content-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.content-inner {
  max-width: 780px;
  margin: 0 auto;
  padding: 32px 24px 48px;

  @media (max-width: 768px) {
    padding: 20px 16px 36px;
  }
}

/* ── Subject ── */
.email-subject {
  font-family: var(--s-font-display);
  font-size: 26px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--s-ink);
  margin: 0 0 24px;
  letter-spacing: -0.02em;

  @media (max-width: 768px) {
    font-size: 21px;
    margin-bottom: 18px;
  }
}

/* ── Sender card ── */
.sender-card {
  display: flex;
  gap: 14px;
  padding-bottom: 20px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--s-line);
}

.sender-avatar {
  flex-shrink: 0;
}

.sender-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.sender-row {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 4px;
}

.sender-name {
  font-family: var(--s-font-display);
  font-weight: 600;
  font-size: 15px;
  color: var(--s-ink);
}

.sender-addr {
  font-size: 13px;
  color: var(--s-muted);
}

.meta-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 13px;
  line-height: 1.6;
}

.meta-label {
  color: var(--s-muted);
  white-space: nowrap;
  min-width: 70px;
  font-weight: 500;
}

.meta-value {
  /* 原为 var(--s-body)——那是页面背景色，当文字色用会导致收件人一行几乎不可见 */
  color: var(--s-ink-secondary);
  word-break: break-word;
}

.meta-date {
  color: var(--s-muted);
}

/* ── Status banners ── */
.status-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: var(--s-radius);
  margin-bottom: 16px;
  font-size: 13px;
  line-height: 1.5;

  &--error {
    background: color-mix(in srgb, var(--s-danger) 8%, var(--s-paper));
    border: 1px solid color-mix(in srgb, var(--s-danger) 20%, transparent);
    color: var(--s-danger);
  }

  &--warn {
    background: color-mix(in srgb, #d4a017 8%, var(--s-paper));
    border: 1px solid color-mix(in srgb, #d4a017 20%, transparent);
    color: #8a6d0b;
  }
}

/* ── Email body ── */
.email-body {
  font-family: var(--s-font-body);
  font-size: 15px;
  line-height: 1.75;
  color: var(--s-ink);
  margin-bottom: 32px;

  &--no-att {
    margin-bottom: 48px;
  }
}

.email-html {
  position: relative;
}

.email-text {
  font-family: inherit;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}

/* ── Attachments ── */
.attachments {
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-lg);
  padding: 16px;
  background: var(--s-soft);
  width: fit-content;
  max-width: 100%;
}

.att-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.att-label {
  font-family: var(--s-font-display);
  font-weight: 600;
  font-size: 13px;
  color: var(--s-ink);
}

.att-count {
  font-size: 12px;
  color: var(--s-muted);
}

.att-grid {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  min-width: min(400px, calc(100vw - 80px));
  max-width: 600px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.att-card {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--s-paper);
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius);
  cursor: pointer;
  transition: box-shadow var(--s-ease);

  &:hover {
    box-shadow: var(--s-shadow-sm);
  }
}

.att-card-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.att-card-name {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--s-ink);
}

.att-card-size {
  font-size: 12px;
  color: var(--s-muted);
  white-space: nowrap;
}

.att-card-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--s-muted);
  padding-left: 4px;

  a {
    color: inherit;
    display: flex;
    align-items: center;
  }

  :deep(.iconify:hover) {
    color: var(--s-accent);
  }
}

/* ── Image preview overlay ── */
.img-preview-mask {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.img-preview-close {
  position: absolute;
  top: 16px;
  right: 20px;
  font-size: 32px;
  color: rgba(255, 255, 255, 0.8);
  background: none;
  border: none;
  cursor: pointer;
  line-height: 1;
  z-index: 1;

  &:hover {
    color: #fff;
  }
}

.img-preview-img {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: var(--s-radius);
  cursor: default;
}
</style>
