<template>
  <div class="email-container">

    <!-- ── Toolbar ── -->
    <div class="email-toolbar">
      <label class="email-toolbar__check">
        <s-checkbox
            v-model="checkAll"
            :indeterminate="isIndeterminate"
            :disabled="!emailList.length || loading"
            @change="handleCheckAllChange"
        />
      </label>
      <div class="email-toolbar__divider"></div>
      <div class="email-toolbar__actions">
        <slot name="first"></slot>
        <button class="toolbar-btn" @click="refresh" :title="$t('refresh')">
          <Icon icon="ion:reload" width="17" height="17" />
        </button>
        <button v-perm="'email:delete'" class="toolbar-btn toolbar-btn--danger"
                v-if="getSelectedMailsIds().length > 0"
                @click="handleDelete">
          <Icon icon="uiw:delete" width="15" height="15" />
        </button>
        <button v-perm="'email:delete'" class="toolbar-btn"
                v-if="getSelectedMailsIds().length > 0 && showUnread"
                @click="handleRead">
          <Icon icon="fluent:mail-read-20-regular" width="17" height="17" />
        </button>
      </div>
      <div class="email-toolbar__right">
        <span class="email-count" v-if="total">{{ $t('emailCount', {total: total}) }}</span>
        <button v-if="showAccountIcon" class="toolbar-btn" @click="changeAccountShow">
          <Icon icon="akar-icons:dot-grid-fill" width="16" height="16" />
        </button>
      </div>
    </div>

    <!-- ── Scroll area ── -->
    <div ref="scroll" class="email-scroll">
      <UseVirtualList ref="scrollbarRef"
                      @scroll="onScroll"
                      :list="list"
                      :options="{ itemHeight: itemHeight, overscan: 15 }"
                      class="email-virtual-list"
                      style="height: 100%"
                      v-if="!loading && emailList.length > 0"
                      :key="keyCount"
      >
        <template #default="{ data: item, index }">
          <!-- Email row -->
          <div :class="['email-row', type, { 'email-row--unread': item.unread === EmailUnreadEnum.UNREAD && showUnread }]"
               :data-checked="item.checked"
               @click="jumpDetails(item)"
               v-if="!item.expand"
               :key="item.emailId"
               @contextmenu="handleContextmenu($event, item)"
               :style="item.rightChecked ? 'background: var(--s-accent-soft)' : ''"
          >
            <!-- Checkbox -->
            <div :class="['email-row__check', { 'email-row__check--stack': type === 'all-email' }]">
              <s-checkbox v-model="item.checked" @click.stop />
            </div>

            <!-- Star -->
            <div class="email-row__star" v-if="showStar" @click.stop="starChange(item)">
              <Icon v-if="item.isStar" icon="fluent-color:star-16" width="18" height="18" />
              <Icon v-else icon="solar:star-line-duotone" width="16" height="16" />
            </div>
            <div v-if="!showStar" class="email-row__star-placeholder"></div>

            <!-- Sender column (all-email desktop only) -->
            <div class="email-row__sender-col" v-if="type === 'all-email'" :title="item.accountEmail || ''">
              <Icon icon="mdi-light:email" width="14" height="14" class="email-row__sender-icon" />
              <span class="email-row__sender-text">{{ item.accountEmail || '\u200B' }}</span>
            </div>

            <!-- Content -->
            <div class="email-row__content">
              <div class="email-row__sender-line"
                   :style="(item.unread === EmailUnreadEnum.UNREAD && showUnread) ? 'font-weight: 700' : ''">
                <div class="email-row__status" v-if="showStatus">
                  <s-tooltip :content="item.statusIcon.content">
                    <Icon :icon="item.statusIcon.icon" :style="`color: ${item.statusIcon.color}`" width="18" height="18" />
                  </s-tooltip>
                  <div class="email-row__del-status" v-if="item.isDel">
                    <s-tooltip :content="item.isDelContent">
                      <Icon icon="mdi:email-remove" width="18" height="18" />
                    </s-tooltip>
                  </div>
                </div>
                <div v-else></div>
                <span class="email-row__name">
                  <span class="email-row__name-text">
                    <div class="email-row__dot" v-if="isMobile && (item.unread === EmailUnreadEnum.UNREAD && showUnread)" />
                    <slot name="name" :email="item">{{ item.name }}</slot>
                  </span>
                  <span class="email-row__name-star">
                    <Icon v-if="item.isStar" icon="fluent-color:star-16" width="16" height="16" />
                  </span>
                </span>
                <span class="email-row__phone-time">{{ item.formatCreateTime }}</span>
              </div>
              <div class="email-row__body">
                <div class="email-row__text">
                  <span class="email-row__subject"
                        :style="(item.unread === EmailUnreadEnum.UNREAD && showUnread) ? 'font-weight: 700' : ''">
                    <div class="email-row__dot" v-if="!isMobile && (item.unread === EmailUnreadEnum.UNREAD && showUnread)" />
                    <span v-if="item.code" class="email-row__code" @click.stop="copyCode(item.code)">[{{ t('codeLabel') }}{{ item.code }}]</span>
                    <span class="email-row__subject-text">
                      <slot name="subject" :email="item">{{ item.subject || '\u200B' }}</slot>
                    </span>
                  </span>
                  <span class="email-row__preview">{{ item.formatText || '\u200B' }}</span>
                </div>
                <div class="email-row__user-info" v-if="showUserInfo">
                  <div class="email-row__user">
                    <Icon icon="mynaui:user" width="16" height="16" />
                    <span>{{ item.userEmail }}</span>
                  </div>
                  <div class="email-row__account-info">
                    <Icon icon="mdi-light:email" width="16" height="16" />
                    <span>{{ item.type === 0 ? item.toEmail : item.sendEmail }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Date -->
            <div class="email-row__date"
                 :style="(item.unread === EmailUnreadEnum.UNREAD && showUnread) ? 'font-weight: 700' : ''">
              <span class="email-row__time">{{ item.formatCreateTime }}</span>
            </div>
          </div>

          <!-- Skeleton loading row -->
          <skeletonBlock v-else-if="item.expand === 'loading'"
                         :rows="1"
                         :showStar="showStar"
                         :accountShow="accountShow"
                         :showStatus="showStatus"
                         :showUserInfo="showUserInfo"
                         :type="type" />

          <!-- No more data -->
          <div class="email-row__end" v-else-if="item.expand === 'noMoreData'">
            <span>{{ $t('noMoreData') }}</span>
          </div>
        </template>
      </UseVirtualList>

      <!-- Initial load skeleton -->
      <skeletonBlock v-if="firstLoad && showFirstLoading"
                     :rows="20"
                     :showStar="showStar"
                     :accountShow="accountShow"
                     :showStatus="showStatus"
                     :showUserInfo="showUserInfo"
                     :type="type" />

      <!-- Pagination loading skeleton -->
      <skeletonBlock v-if="loading"
                     :rows="skeletonRows"
                     :showStar="showStar"
                     :accountShow="accountShow"
                     :showStatus="showStatus"
                     :showUserInfo="showUserInfo"
                     :type="type" />

      <!-- Empty state -->
      <div class="email-empty-wrap" v-if="noLoading && emailList.length === 0 && !loading">
        <s-empty :description="$t('noMessagesFound')" />
      </div>
    </div>

    <!-- ── Context menu ── -->
    <div v-if="contextMenuVisible"
         class="email-context-menu"
         :style="{ left: contextX + 'px', top: contextY + 'px' }">
      <div v-if="rightClickEmail.code" class="email-context-item" @click="copyCode(rightClickEmail.code)">
        <Icon icon="fluent-color:clipboard-24" width="18" height="18" />
        <span>{{ t('copyCode') }}</span>
      </div>
      <div v-if="['email'].includes(props.type)" class="email-context-item" @click="emailRead(rightClickEmail.emailId)">
        <Icon icon="fluent:mail-read-20-regular" width="18" height="18" />
        <span>{{ t('markAsRead') }}</span>
      </div>
      <div v-if="['email','star'].includes(props.type)" class="email-context-item" @click="openReply(rightClickEmail)">
        <Icon icon="la:reply" width="18" height="18" />
        <span>{{ t('reply') }}</span>
      </div>
      <div v-if="['email','send','star'].includes(props.type)" class="email-context-item" @click="openForward(rightClickEmail)">
        <Icon icon="iconoir:arrow-up-right" width="17" height="17" />
        <span>{{ t('forward') }}</span>
      </div>
      <div v-if="['email','send','star'].includes(props.type)" class="email-context-item" @click="starChange(rightClickEmail)">
        <Icon icon="solar:star-line-duotone" width="17" height="17" />
        <span>{{ t('star') }}</span>
      </div>
      <div v-if="props.type === 'all-email'" class="email-context-item" @click="handleSearch('user', rightClickEmail.userEmail)">
        <Icon icon="iconoir:search" width="18" height="18" />
        <span>{{ t('searchUser') }}</span>
      </div>
      <div v-if="props.type === 'all-email'" class="email-context-item" @click="handleSearch('account', rightClickEmail.toEmail)">
        <Icon icon="iconoir:search" width="18" height="18" />
        <span>{{ t('searchEmail') }}</span>
      </div>
      <div v-if="props.type === 'all-email'" class="email-context-item" @click="handleSearch('name', rightClickEmail.name)">
        <Icon icon="iconoir:search" width="18" height="18" />
        <span>{{ t('searchSender') }}</span>
      </div>
      <div class="email-context-divider"></div>
      <div class="email-context-item email-context-item--danger" @click="rightDelete(rightClickEmail.emailId)">
        <Icon icon="uiw:delete" width="14" height="18" />
        <span>{{ t('delete') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import {Icon} from "@iconify/vue";
import skeletonBlock from "@/components/email-scroll/skeleton/index.vue"
import {computed, onActivated, reactive, ref, watch, nextTick, onMounted, onUnmounted } from "vue";
import {useEmailStore} from "@/store/email.js";
import {useUiStore} from "@/store/ui.js";
import {useSettingStore} from "@/store/setting.js";
import {fromNow} from "@/utils/day.js";
import {useI18n} from "vue-i18n";
import {EmailUnreadEnum} from "@/enums/email-enum.js";
import { UseVirtualList } from '@vueuse/components'
import { useScroll } from '@vueuse/core'
import sCheckbox from '@/components/ui/s-checkbox.vue'
import sTooltip from '@/components/ui/s-tooltip.vue'
import sEmpty from '@/components/ui/s-empty.vue'
import { toast } from '@/components/ui/toast.js'
import { confirm } from '@/components/ui/confirm.js'

const props = defineProps({
  getEmailList: Function,
  emailDelete: Function,
  emailRead: Function,
  starAdd: Function,
  starCancel: Function,
  cancelSuccess: Function,
  starSuccess: Function,
  actionLeft: {
    type: String,
    default: '0'
  },
  timeSort: {
    type: Number,
    default: 0,
  },
  showStatus: {
    type: Boolean,
    default: false
  },
  showAccountIcon: {
    type: Boolean,
    default: true,
  },
  showUserInfo: {
    type: Boolean,
    default: false
  },
  showStar: {
    type: Boolean,
    default: true
  },
  allowStar: {
    type: Boolean,
    default: true
  },
  type: {
    type: String,
    default: 'email'
  },
  showFirstLoading: {
    type: Boolean,
    default: true
  },
  showUnread: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['jump', 'refresh-before', 'delete-draft', 'right-search'])
const {t} = useI18n()
const settingStore = useSettingStore()
const uiStore = useUiStore();
const emailStore = useEmailStore();
const loading = ref(false);
const followLoading = ref(false);
const noLoading = ref(false);
const emailList = reactive([])
const expandList = reactive([])
const total = ref(0);
const checkAll = ref(false);
const isIndeterminate = ref(false);
const scroll = ref(null)
const firstLoad = ref(true)
let scrollTop = 0
const latestEmail = ref(null)
const scrollbarRef = ref(null)
let reqLock = false
const isMobile = ref(innerWidth < 1367)
let skeletonRows = 0
const timePaddingRight = ref('');
const keyCount = ref(0);
const contextMenuVisible = ref(false);
const contextX = ref(0);
const contextY = ref(0);
const rightClickEmail = ref({});
const checkedEmailCount = ref(0);

const queryParam = reactive({
  size: 50
});

defineExpose({
  refreshList,
  deleteEmail,
  addItem,
  handleList,
  emailList,
  firstLoad,
  latestEmail,
  noLoading,
  total
})

onActivated(() => {
  requestAnimationFrame(() => {
    const index = scrollTop / itemHeight.value
    scrollbarRef.value?.scrollTo(index);
  })
})

onMounted(() => {
  document.addEventListener('click', closeContextMenu)
  window.addEventListener('wheel', handleWheel)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  document.removeEventListener('click', closeContextMenu)
  window.removeEventListener('wheel', handleWheel)
  window.removeEventListener('resize', handleResize)
})

function handleResize() {
  isMobile.value = innerWidth < 1367
}

function handleWheel() {
  if (contextMenuVisible.value) closeContextMenu()
}

getEmailList()

function onScroll(e) {
  scrollTop = e.target.scrollTop;
}

const { arrivedState } = useScroll(scrollbarRef, {
  offset: { bottom: 1200 }
})


const list = computed(() => {
  return [...emailList, ...expandList]
})

const itemHeight = computed(() => {
    if (props.type === 'all-email') {
      return isMobile.value ? 132 : 65;
    } else  {
      return isMobile.value ? 83 : 80;
    }
})

watch(emailList, () => {
  updateHasScrollbar();
})

watch(scrollbarRef, () => {
  updateHasScrollbar();
})

// 强制刷新 (itemHeight 更改后虚拟滚动列表不会自己更新)
watch(itemHeight, () => {
  keyCount.value ++
})

watch(followLoading, (isFollowLoading) => {
  if (isFollowLoading) {
    expandList.push({
      emailId: 0,
      expand: 'loading'
    })
  } else {
    const index = expandList.findIndex(item => item.expand === 'loading')
    if (index > -1) expandList.splice(index, 1);
  }
});

watch(noLoading, (isNoLoading) => {
  if (isNoLoading) {
    expandList.push({
      emailId: 0,
      expand: 'noMoreData'
    })
  } else {
    const index = expandList.findIndex(item => item.expand === 'noMoreData')
    if (index > -1) expandList.splice(index, 1);
  }
})


// 监听是否到达底部
watch(() => arrivedState.bottom, (isBottom) => {
  if (isBottom && !loading.value) {
    loadData();
  }
});

watch(
    () => emailList.map(item => item.checked),
    () => {
      checkedEmailCount.value = emailList.length
      if (emailList.length > 0) {
        updateCheckStatus();
      }
    },
    {deep: true}
);


watch(() => emailStore.deleteIds, () => {
  if (emailStore.deleteIds) {
    deleteEmail(emailStore.deleteIds)
  }
})

watch(() => [emailStore.cancelStarEmailId, emailStore.addStarEmailId], () => {
  emailList.forEach(email => {
    if (email.emailId === emailStore.cancelStarEmailId) {
      email.isStar = 0
    }
    if (email.emailId === emailStore.addStarEmailId) {
      email.isStar = 1
    }
  })
})

function closeContextMenu() {
  if (!contextMenuVisible.value) return
  contextMenuVisible.value = false
  if (rightClickEmail.value.rightChecked) {
    rightClickEmail.value.rightChecked = false
  }
}

function openReply(email) {
  uiStore.writerRef.openReply(email)
}

function openForward(email) {
  uiStore.writerRef.openForward(email)
}

const handleContextmenu = (event, email) => {

  if (props.type === 'draft') {
    return
  }

  if (rightClickEmail.value.rightChecked) {
    rightClickEmail.value.rightChecked = false
  }

  const { clientX, clientY } = event
  contextX.value = clientX
  contextY.value = clientY
  event.preventDefault();
  contextMenuVisible.value = true

  rightClickEmail.value = email;
  rightClickEmail.value.rightChecked = true
}

function updateHasScrollbar() {
  nextTick(() => {
    const doc = document.querySelector('.email-virtual-list');
    if (doc) {
      if (doc.scrollHeight > doc.clientHeight) {
        timePaddingRight.value = '5px';
      } else {
        timePaddingRight.value = '15px'
      }
    }
  })
}

function getSkeletonRows() {
  skeletonRows = Math.min(Math.max(emailList.length, 1), 20)
}

const accountShow = computed(() => {
  return uiStore.accountShow && settingStore.settings.manyEmail === 0
})

function htmlToText(email) {
  if (email.content) {
    return cleanSpace(
      email.content
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
    )
  }

  if (email.text) {
    return cleanSpace(email.text)
  }
  return ''
}

function cleanSpace(text) {
  return text
      .replace(/[\u200B-\u200F\uFEFF\u034F\u200B-\u200F\u00A0\u3000\u00AD]/g, '')// 移除零宽空格
      .replace(/\s+/g, ' ')                   // 多空白合并成一个空格
      .trim();
}

function starChange(email) {

  if (!email.isStar) {

    if (!props.allowStar) return;

    email.isStar = 1;
    props.starAdd(email.emailId).then(() => {
      email.isStar = 1;
      props.starSuccess(email)
    }).catch(e => {
      console.error(e)
      email.isStar = 0
    })
  } else {

    email.isStar = 0;
    props.starCancel(email.emailId).then(() => {
      email.isStar = 0;
      props.cancelSuccess?.(email)
    }).catch(e => {
      console.error(e)
      email.isStar = 1;
    })
  }
}

function changeAccountShow() {
  uiStore.accountShow = !uiStore.accountShow;
}

const handleRead = () => {
  const emailIds = getSelectedMailsIds();
  props.emailRead(emailIds);
  localRead(emailIds);
}

function emailRead(emailId) {
  props.emailRead([emailId])
  localRead([emailId]);
}

function localRead(emailIds) {
  emailIds.forEach(emailId => {
    const index = emailList.findIndex(email => email.emailId === emailId);
    if (index > -1) {
      emailList[index].unread = EmailUnreadEnum.READ;
      emailList[index].checked = false;
    }
  })
}

function rightDelete(emailId) {
  closeContextMenu()

  if (props.type === 'all-email') {
    confirm(t('delOneEmailConfirm')).then((ok) => {
      if (!ok) return
      props.emailDelete([emailId]).then(() => {
        toast(t('delSuccessMsg'), 'success')
        emailStore.deleteIds = [emailId];
      })
    })
    return;
  }
  props.emailDelete([emailId]).then(() => {
    toast(t('delSuccessMsg'), 'success')
    emailStore.deleteIds = [emailId];
  })
}

function handleSearch(type, value) {
  emit('right-search', type, value);
}

async function copyCode(code) {
  try {
    await navigator.clipboard.writeText(code);
    toast(t('copySuccessMsg'), 'success')
  } catch (err) {
    console.error(`${t('copyFailMsg')}:`, err);
    toast(t('copyFailMsg'), 'error')
  }
}

function handleDelete() {
  confirm(t('delEmailsConfirm')).then((ok) => {
    if (!ok) return

    if (props.type === 'draft') {
      const draftIds = getSelectedDraftsIds();
      emit('delete-draft', draftIds);
      return;
    }

    const emailIds = getSelectedMailsIds();
    props.emailDelete(emailIds).then(() => {
      toast(t('delSuccessMsg'), 'success')
      emailStore.deleteIds = emailIds;
    })
  })
}

function deleteEmail(emailIds) {
  const idSet = new Set(emailIds)
  emailList.splice(0, emailList.length, ...emailList.filter(item => !idSet.has(item.emailId)))
  if (emailList.length < queryParam.size && !noLoading.value) {
    getEmailList()
  }
}

function addItem(email) {

  const existIndex = emailList.findIndex(item => item.emailId === email.emailId)

  if (existIndex > -1) {
    return false;
  }

  email.formatText = htmlToText(email);
  email.formatCreateTime = fromNow(email.formatCreateTime);

  if (props.timeSort) {
    if (noLoading.value) {
      handleList([email]);
      emailList.push(email);
    }

    if (email.emailId > latestEmail.value?.emailId) {
      latestEmail.value = email
    }

    total.value++
    return true;
  }


  const index = emailList.findIndex(item => item.emailId < email.emailId)

  if (index !== -1) {
    handleList([email]);
    emailList.splice(index, 0, email);
  } else {
    if (noLoading.value) {
      handleList([email]);
      emailList.push(email);
    }
  }

  if (email.emailId > latestEmail.value?.emailId) {
    latestEmail.value = email
  }

  total.value++
  return true;
}

function handleCheckAllChange(val) {
  emailList.forEach(item => item.checked = val);
  isIndeterminate.value = false;
}

// 获取选中的邮件列表id
function getSelectedMailsIds() {
  return emailList.filter(item => item.checked).map(item => item.emailId);
}

function getSelectedDraftsIds() {
  return emailList.filter(item => item.checked).map(item => item.draftId);
}

function updateCheckStatus() {
  const checkedCount = emailList.filter(item => item.checked).length;
  checkedEmailCount.value = checkedCount;
  checkAll.value = checkedCount === emailList.length;
  isIndeterminate.value = checkedCount > 0 && checkedCount < emailList.length;
}

function jumpDetails(email) {

  if (contextMenuVisible.value) {
    closeContextMenu()
    return;
  }

  const sel = window.getSelection();
  if (sel.toString().trim()) {
    return
  }
  emit('jump', email)
}


function getEmailList(refresh = false) {

  if (reqLock) return;

  let emailId = emailList.length > 0 ? emailList.at(-1).emailId : 0;

  reqLock = true

  if (!refresh) {

    if (loading.value || noLoading.value) {
      reqLock = false
      return
    }

  } else {
    getSkeletonRows()
    emailId = 0
    loading.value = true
    scrollTop = 0
  }

  if (emailList.length === 0) {
    loading.value = true
  } else {
    followLoading.value = !refresh;
  }
  props.getEmailList(emailId, queryParam.size).then(data => {
    firstLoad.value = false

    let list = data.list.map(item => ({
      ...item,
      checked: false
    }));


    if (refresh) {
      emailList.length = 0
    }

    latestEmail.value = data.latestEmail

    handleList(list);
    emailList.push(...list);
    if (refresh) scrollbarRef.value?.setScrollTop(0);

    noLoading.value = data.list.length < queryParam.size;
    followLoading.value = data.list.length >= queryParam.size;

    total.value = data.total;
  }).finally(() => {
    loading.value = false
    reqLock = false
  })
}

function handleList(list) {
  const statusIconMap = {
    0: { icon: 'ic:round-mark-email-read', color: '#51C76B', content: t('received') },
    1: { icon: 'bi:send-arrow-up-fill',  color: '#51C76B', content: t('sent') },
    2: { icon: 'bi:send-check-fill',     color: '#51C76B', content: t('delivered') },
    3: { icon: 'bi:send-x-fill',         color: '#F56C6C', content: t('bounced') },
    8: { icon: 'bi:send-x-fill',         color: '#F56C6C', content: t('bounced') },
    4: { icon: 'bi:send-exclamation-fill', color: '#FBBD08', content: t('complained') },
    5: { icon: 'bi:send-arrow-up-fill',  color: '#FBBD08', content: t('delayed') },
    7: { icon: 'ic:round-mark-email-read', color: '#FBBD08', content: t('noRecipient') },
  };
  const delContent = t('selectDeleted');

  list.forEach(email => {
    email.formatText = htmlToText(email)
    email.formatCreateTime = fromNow(email.createTime);
    if (email.isDel) {
      email.isDelContent = delContent;
    }
    email.statusIcon = statusIconMap[email.status];
  })
}

function refresh() {
  emit('refresh-before')
  if (props.skeleton) {
    scrollbarRef.value.setScrollTop(0)
  }
  refreshList()
}

function refreshList() {
  checkAll.value = false;
  isIndeterminate.value = false;
  getEmailList(true);
}

function loadData() {
  getEmailList()
}

</script>

<style lang="scss" scoped>
/* ═══════════════════════════════════════════
   Email Scroll — Editorial Design
   ═══════════════════════════════════════════ */

.email-container {
  display: grid;
  grid-template-rows: auto 1fr;
  font-family: var(--s-font-body);
  color: var(--s-ink);
  overflow: hidden;
  height: 100%;
  background: var(--s-paper);
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-lg);
  box-shadow: var(--s-shadow);
}

/* ── Toolbar ── */
.email-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  min-height: 48px;
  background: var(--s-paper);
  border-bottom: 1px solid var(--s-line);
  font-size: 13px;

  &__check {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  &__divider {
    width: 1px;
    height: 20px;
    background: var(--s-line);
    flex-shrink: 0;
    margin: 0 4px;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: 1;
    min-width: 0;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    margin-left: auto;
  }
}

.toolbar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--s-muted);
  border-radius: var(--s-radius-sm);
  cursor: pointer;
  transition: all var(--s-ease);
  flex-shrink: 0;

  &:hover {
    background: var(--s-soft);
    color: var(--s-accent);
  }

  &--danger:hover {
    background: var(--s-danger-soft);
    color: var(--s-danger);
  }
}

.email-count {
  font-size: 12px;
  color: var(--s-muted);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

/* ── Scroll area ── */
.email-scroll {
  height: 100%;
  overflow: hidden;
  background: var(--s-paper);
  border-radius: 0 0 var(--s-radius-lg) var(--s-radius-lg);

  .email-virtual-list {
    will-change: scroll-position;
  }
}

.email-empty-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
}

/* ── Email row ── */
.email-row {
  display: grid;
  grid-template-columns: 40px 36px 1fr auto;
  align-items: center;
  gap: 4px;
  padding: 0 16px;
  min-height: 80px;
  border-bottom: 1px solid var(--s-line-light);
  border-left: 3px solid transparent;
  cursor: pointer;
  transition: background var(--s-ease);
  position: relative;
  font-family: var(--s-font-body);
  font-size: 14px;

  @media (pointer: coarse) {
    user-select: none;
  }

  /* Unread */
  &--unread {
    background: var(--s-accent-soft);
    border-left: 3px solid var(--s-accent);
    padding-left: 16px;

    .email-row__name-text,
    .email-row__subject-text {
      font-weight: 700;
      color: var(--s-ink);
    }

    .email-row__preview {
      color: var(--s-ink-secondary);
    }
  }

  /* Hover */
  &:hover {
    background: var(--s-soft);
  }

  /* Checked */
  &[data-checked="true"] {
    background: var(--s-accent-soft);
    border-left: 3px solid var(--s-accent);
    padding-left: 16px;
  }

  /* all-email type (taller rows) */
  &.all-email {
    min-height: 65px;
    grid-template-columns: 40px 36px 130px 1fr auto;
  }

  @media (max-width: 1366px) {
    grid-template-columns: 36px 1fr auto;
    min-height: 80px;
    padding: 8px 12px;
    gap: 6px;

    &.all-email {
      min-height: 120px;
      grid-template-columns: 36px 1fr auto;
    }
  }
}

/* ── Row: Checkbox ── */
.email-row__check {
  display: flex;
  align-items: center;
  justify-content: center;

  &--stack {
    @media (min-width: 1367px) {
      align-self: start;
      padding-top: 14px;
    }
  }
}

/* ── Row: Star ── */
.email-row__star {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  cursor: pointer;
  color: var(--s-muted);
  transition: color var(--s-ease);
  border-radius: var(--s-radius-sm);
  padding: 6px 0;

  &:hover {
    color: var(--s-warning);
  }

  @media (max-width: 1366px) {
    display: none;
  }
}

/* ── Star placeholder (hidden on mobile to fix grid) ── */
.email-row__star-placeholder {
  @media (max-width: 1366px) {
    display: none;
  }
}

/* ── Row: Sender column (all-email desktop) ── */
.email-row__sender-col {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 6px 4px 6px 0;
  overflow: hidden;

  @media (max-width: 1366px) {
    display: none;
  }
}

.email-row__sender-icon {
  flex-shrink: 0;
  color: var(--s-muted);
}

.email-row__sender-text {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 13px;
  color: var(--s-muted);
}

/* ── Row: Content ── */
.email-row__content {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 2px;
  padding: 6px 0;

  .all-email & {
    gap: 4px;
  }
}

.email-row__sender-line {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 8px;
  color: var(--s-ink);
}

.email-row__status {
  display: flex;
  align-items: center;
  gap: 4px;

  @media (max-width: 1366px) {
    gap: 5px;
  }
}

.email-row__del-status {
  color: var(--s-info);
  display: flex;
  align-items: center;
}

.email-row__name {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 6px;
  overflow: hidden;
  align-items: center;

  @media (max-width: 1366px) {
    grid-template-columns: auto 1fr auto;
  }
}

.email-row__name-text {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 4px;
  color: #55483f;
}

.email-row__name-star {
  display: flex;
  align-items: center;

  @media (min-width: 1367px) {
    display: none;
  }
}

.email-row__phone-time {
  font-weight: 400;
  font-size: 12px;
  color: var(--s-muted);

  @media (min-width: 1367px) {
    display: none;
  }
}

.email-row__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.email-row__text {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 0;

  @media (max-width: 1366px) {
    grid-template-columns: 1fr;
  }
}

.email-row__subject {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  overflow: hidden;
  min-width: 0;

  @media (min-width: 1367px) {
    padding-right: 8px;
  }
}

.email-row__code {
  flex: 0 0 auto;
  max-width: 170px;
  height: 20px;
  line-height: 20px;
  font-size: 12px;
  font-weight: 600;
  color: var(--s-accent);
  background: var(--s-accent-soft);
  padding: 0 6px;
  border-radius: 4px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: pointer;
}

.email-row__subject-text {
  overflow: hidden;
  min-width: 0;
  font-weight: 500;
  color: var(--s-ink);
  word-break: break-word;
  line-height: 1.4;
}

.email-row__preview {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: #97887c;
  font-size: 13px;

  @media (max-width: 1366px) {
    margin-top: 2px;
  }
}

.email-row__user-info {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 4px;
  color: var(--s-muted);
  font-size: 12px;

  @media (max-width: 1366px) {
    flex-direction: column;
    gap: 4px;
  }
}

.email-row__user,
.email-row__account-info {
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 300px;

  @media (max-width: 1223px) {
    max-width: 260px;
  }
}

/* ── Row: Date ── */
.email-row__date {
  text-align: right;
  font-size: 12px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  padding-left: 12px;
  color: #97887c;
  font-variant-numeric: tabular-nums;

  @media (max-width: 1366px) {
    display: none;
  }
}

.email-row__time {
  padding-right: v-bind(timePaddingRight);
}

/* ── Unread dot ── */
.email-row__dot {
  height: 6px;
  width: 6px;
  background: var(--s-accent);
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

/* ── End of list ── */
.email-row__end {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px 0;
  color: var(--s-muted);
  font-size: 12px;
}

/* ── Context menu ── */
.email-context-menu {
  position: fixed;
  z-index: 3000;
  background: var(--s-paper);
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius);
  box-shadow: var(--s-shadow);
  min-width: 170px;
  padding: 4px;
  animation: ctx-fade-in 120ms ease;
}

@keyframes ctx-fade-in {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

.email-context-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: var(--s-radius-sm);
  font-size: 13px;
  color: var(--s-ink);
  cursor: pointer;
  transition: background var(--s-ease);
  white-space: nowrap;

  &:hover {
    background: var(--s-soft);
  }

  &--danger {
    color: var(--s-danger);

    &:hover {
      background: var(--s-danger-soft);
    }
  }
}

.email-context-divider {
  height: 1px;
  background: var(--s-line-light);
  margin: 4px 8px;
}

/* ── Responsive ── */
@media (max-width: 800px) {
  .email-container {
    border-radius: 0;
    border: none;
  }

  .email-toolbar {
    padding: 6px 12px;
    min-height: 42px;
  }

  .email-row {
    padding: 8px 10px;
  }
}

@media (max-width: 520px) {
  .email-toolbar__divider {
    display: none;
  }

  .email-row__preview {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .email-row,
  .toolbar-btn,
  .email-row__star {
    transition: none;
  }
}

/* ── Mobile touch optimizations ── */
@media (max-width: 768px) {
  .email-row {
    touch-action: manipulation;
  }

  .toolbar-btn {
    min-width: 44px;
    min-height: 44px;
  }
}
</style>
