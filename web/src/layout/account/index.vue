<template>
  <div class="account-box">
    <!-- Top toolbar -->
    <div class="account-toolbar">
      <button class="toolbar-btn" v-perm="'account:add'" @click="add" :title="$t('addAccount')">
        <Icon icon="ion:add-outline" width="20" height="20" />
      </button>
      <button class="toolbar-btn" @click="refresh" :title="$t('refresh')">
        <Icon icon="ion:reload" width="16" height="16" />
      </button>
    </div>

    <!-- Scrollable list -->
    <div class="account-scroll" ref="scrollbarRef">
      <div v-infinite-scroll="getAccountList" :infinite-scroll-distance="600" :infinite-scroll-immediate="false">

        <!-- Account cards -->
        <div
          class="account-card"
          :class="{ 'account-card--active': accountStore.currentAccountId === item.accountId }"
          v-for="(item, index) in accounts"
          :key="item.accountId"
          @click="changeAccount(item)"
        >
          <div class="account-card-email">{{ item.email }}</div>
          <div class="account-card-actions">
            <div class="account-card-left" @click.stop>
              <button class="card-icon-btn" @click="setAllReceive(item)" :title="item.allReceive === 1 ? 'All receive on' : 'All receive off'">
                <Icon v-if="!item.allReceive" icon="eva:email-fill" width="18" height="18" class="icon-warn" />
                <Icon v-else icon="flat-color-icons:folder" width="18" height="18" />
              </button>
            </div>
            <div class="account-card-right" @click.stop>
              <s-tooltip :content="$t('copy')">
                <button class="card-icon-btn" @click.stop="copyAccount(item.email)">
                  <Icon icon="fluent-color:clipboard-24" width="18" height="18" />
                </button>
              </s-tooltip>
              <template v-if="showNullSetting(item)">
                <span class="card-settings-dot"></span>
              </template>
              <s-dropdown v-else>
                <template #trigger>
                  <button class="card-icon-btn">
                    <Icon icon="fluent:settings-24-filled" width="17" height="17" class="icon-muted" />
                  </button>
                </template>
                <s-dropdown-item v-if="hasPerm('email:send')" @click="openSetName(item)">{{ $t('rename') }}</s-dropdown-item>
                <s-dropdown-item v-if="item.accountId !== userStore.user.account.accountId" @click="setAsTop(item, index)">{{ $t('pin') }}</s-dropdown-item>
                <s-dropdown-item
                  v-if="item.accountId !== userStore.user.account.accountId && hasPerm('account:delete')"
                  :danger="true"
                  @click="remove(item)"
                >{{ $t('delete') }}</s-dropdown-item>
              </s-dropdown>
            </div>
          </div>
        </div>

        <!-- Initial loading skeleton -->
        <template v-if="loading">
          <div class="skeleton-card" v-for="i in skeletonRows" :key="'sk-'+i">
            <s-skeleton :rows="3" />
          </div>
        </template>

        <!-- Follow loading skeleton -->
        <template v-if="accounts.length > 0 && !noLoading">
          <div class="skeleton-card">
            <s-skeleton :rows="3" />
          </div>
        </template>

        <!-- End of list -->
        <div class="end-label" v-if="noLoading && accounts.length > 0">
          {{ $t('noMoreData') }}
        </div>

        <!-- Empty state -->
        <div class="empty-wrap" v-if="noLoading && accounts.length === 0">
          <s-empty :description="$t('noMessagesFound')" />
        </div>
      </div>
    </div>

    <!-- Add account dialog -->
    <s-modal v-model="showAdd" :title="$t('addAccount')" size="sm">
      <div class="modal-form">
        <div class="input-group">
          <s-input v-model="addForm.email" ref="addRef" :placeholder="$t('emailAccount')" />
          <div class="domain-suffix">
            <s-select
              ref="mySelect"
              v-model="addForm.suffix"
              :options="domainOptions"
              :placeholder="$t('select')"
              class="domain-select-hidden"
            />
            <div class="domain-display" @click.stop="openSelect">
              <span>{{ addForm.suffix }}</span>
              <Icon icon="mingcute:down-small-fill" width="16" height="16" />
            </div>
          </div>
        </div>
        <s-button type="primary" block @click="submit" :loading="addLoading">{{ $t('add') }}</s-button>
      </div>
      <div
        class="add-email-turnstile"
        :class="verifyShow ? 'turnstile-show' : 'turnstile-hide'"
        :data-sitekey="settingStore.settings.siteKey"
        data-callback="onTurnstileSuccess"
        data-error-callback="onTurnstileError"
      >
        <span style="font-size: 12px; color: var(--s-danger)" v-if="botJsError">{{ $t('verifyModuleFailed') }}</span>
      </div>
    </s-modal>

    <!-- Rename dialog -->
    <s-modal v-model="setNameShow" :title="$t('changeUserName')" size="sm">
      <div class="modal-form">
        <s-input v-model="accountName" :placeholder="$t('username')" />
        <s-button type="primary" block @click="setName" :loading="setNameLoading">{{ $t('save') }}</s-button>
      </div>
    </s-modal>
  </div>
</template>
<script setup>
import {Icon} from "@iconify/vue";
import {computed, nextTick, reactive, ref, watch} from "vue";
import {
  accountList,
  accountAdd,
  accountDelete,
  accountSetName,
  accountSetAllReceive,
  accountSetAsTop
} from "@/request/account.js";
import {isEmail} from "@/utils/verify-utils.js";
import {useSettingStore} from "@/store/setting.js";
import {useAccountStore} from "@/store/account.js";
import {useEmailStore} from "@/store/email.js";
import {useUserStore} from "@/store/user.js";
import {hasPerm} from "@/perm/perm.js"
import {useI18n} from "vue-i18n";
import {AccountAllReceiveEnum} from "@/enums/account-enum.js";
import { toast } from '@/components/ui/toast.js'
import { confirm } from '@/components/ui/confirm.js'
import SButton from '@/components/ui/s-button.vue'
import SInput from '@/components/ui/s-input.vue'
import SSelect from '@/components/ui/s-select.vue'
import SModal from '@/components/ui/s-modal.vue'
import STooltip from '@/components/ui/s-tooltip.vue'
import SDropdown from '@/components/ui/s-dropdown.vue'
import SDropdownItem from '@/components/ui/s-dropdown-item.vue'
import SSkeleton from '@/components/ui/s-skeleton.vue'
import SEmpty from '@/components/ui/s-empty.vue'

const {t} = useI18n();
const userStore = useUserStore();
const accountStore = useAccountStore();
const settingStore = useSettingStore();
const emailStore = useEmailStore();
const showAdd = ref(false)
const addLoading = ref(false);
const domainList = computed(() => settingStore.domainList)
const domainOptions = computed(() => settingStore.domainList.map(d => ({ value: d, label: d })))
const accounts = reactive([])
const noLoading = ref(false)
const loading = ref(false)
const followLoading = ref(false);
const verifyShow = ref(false)
const setNameShow = ref(false)
const setNameLoading = ref(false)
const accountName = ref(null)
const addRef = ref({})
const scrollbarRef = ref(null)
let account = null
let turnstileId = null
const botJsError = ref(false)
let verifyToken = ''
let verifyErrorCount = 0
let first = true
const addForm = reactive({
  email: '',
  suffix: settingStore.domainList[0]
})
let skeletonRows = 10
const queryParams = {
  size: 30
}

const mySelect = ref()

if (hasPerm('account:query')) {
  getAccountList()
}

watch(() => accountStore.changeUserAccountName, () => {
  accounts[0].name = accountStore.changeUserAccountName
})

watch(() => settingStore.domainList, (list) => {
  if (!addForm.suffix && list.length > 0) {
    addForm.suffix = list[0]
  }
}, {immediate: true})


const openSelect = () => {
  mySelect.value.toggleMenu()
}

window.onTurnstileError = (e) => {
  if (verifyErrorCount >= 4) {
    return
  }
  verifyErrorCount++
  console.warn('人机验加载失败', e)
  setTimeout(() => {
    nextTick(() => {
      if (!turnstileId) {
        turnstileId = window.turnstile.render('.add-email-turnstile')
      } else {
        window.turnstile.reset(turnstileId);
      }
    })
  }, 1500)
};

window.onTurnstileSuccess = (token) => {
  verifyToken = token;
};

function getSkeletonRows() {
  if (accounts.length > 20) return skeletonRows = 20
  if (accounts.length === 0) return skeletonRows = 1
  skeletonRows = accounts.length
}

function setName() {

  let name = accountName.value

  if (name === account.name) {
    setNameShow.value = false
    return
  }

  if (!name) {
    toast(t('emptyUserNameMsg'), 'error')
    return;
  }

  setNameLoading.value = true
  accountSetName(account.accountId, name).then(() => {
    account.name = name
    setNameShow.value = false

    if (account.accountId === userStore.user.account.accountId) {
      userStore.user.name = name
    }

    toast(t('saveSuccessMsg'), 'success')
  }).finally(() => {
    setNameLoading.value = false
  })
}

function openSetName(accountItem) {
  accountName.value = accountItem.name
  account = accountItem
  setNameShow.value = true
}

function setAllReceive(account) {
  let allReceiveAccount = accounts.find(account => account.allReceive === AccountAllReceiveEnum.ENABLED);
  if (allReceiveAccount && allReceiveAccount.accountId !== account.accountId) allReceiveAccount.allReceive = AccountAllReceiveEnum.DISABLED;
  account.allReceive = account.allReceive === AccountAllReceiveEnum.DISABLED ? AccountAllReceiveEnum.ENABLED : AccountAllReceiveEnum.DISABLED;
  accountSetAllReceive(account.accountId).catch(() => {
    account.allReceive = account.allReceive === AccountAllReceiveEnum.DISABLED ? AccountAllReceiveEnum.ENABLED : AccountAllReceiveEnum.DISABLED;
    if (allReceiveAccount) allReceiveAccount.allReceive = AccountAllReceiveEnum.ENABLED;
  }).then(() => {
    if (account.allReceive === AccountAllReceiveEnum.ENABLED) {
      toast(t('setSuccess'), 'success')
    }
    changeAccount(account);
    emailStore.emailScroll?.refreshList();
    emailStore.sendScroll?.refreshList();
  })
}


function showNullSetting(item) {
  return !hasPerm('email:send') && !(item.accountId !== userStore.user.account.accountId && hasPerm('account:delete'))
}

function remove(account) {
  confirm(t('delConfirm', {msg: account.email}), t('confirm')).then(ok => {
    if (!ok) return
    accountDelete(account.accountId).then(() => {
      const index = accounts.findIndex(item => item.accountId === account.accountId);
      accounts.splice(index, 1);
      if (accounts.length < queryParams.size) {
        getAccountList()
      }
      toast(t('delSuccessMsg'), 'success')
    })
  });
}

function refresh() {
  if (loading.value) {
    return
  }
  loading.value = false
  followLoading.value = false
  noLoading.value = false
  queryParams.accountId = 0
  queryParams.lastSort = null
  getSkeletonRows();
  if (scrollbarRef.value) scrollbarRef.value.scrollTop = 0
  accounts.splice(0, accounts.length)
  getAccountList()
}

function changeAccount(account) {
  accountStore.currentAccountId = account.accountId
  accountStore.currentAccount = account
}

function add() {
  addForm.suffix = addForm.suffix || settingStore.domainList[0]
  showAdd.value = true
  setTimeout(() => {
    addRef.value.focus()
  }, 100)
}

function setAsTop(account, index) {
  accountSetAsTop(account.accountId).then(() => {
    toast(t('setSuccess'), 'success')

    const [item] = accounts.splice(index, 1);
    accounts.splice(1, 0, item);

  });
}

async function copyAccount(account) {
  try {
    await navigator.clipboard.writeText(account);
    toast(t('copySuccessMsg'), 'success')
  } catch (err) {
    console.error(`${t('copyFailMsg')}:`, err);
    toast(t('copyFailMsg'), 'error')
  }
}

function getAccountList() {

  if (loading.value || followLoading.value || noLoading.value) return;

  if (accounts.length === 0) {
    loading.value = true
  } else {
    followLoading.value = true
  }

  const accountId = accounts.length > 0 ? accounts.at(-1).accountId : 0;
  const lastSort = accounts.length > 0 ? accounts.at(-1).sort : null;

  accountList(accountId, queryParams.size, lastSort).then(list => {

    if (list.length < queryParams.size) {
      noLoading.value = true
    }
    if (accounts.length === 0) {
      accountStore.currentAccount = list[0]
    }

    accounts.push(...list)

    loading.value = false
    followLoading.value = false
    first = false
  }).catch(() => {
    loading.value = false
    followLoading.value = false
  })
}


function submit() {

  if (!addForm.email) {
    toast(t('emptyEmailMsg'), 'error')
    return
  }

  if (addForm.email.length < settingStore.settings.minEmailPrefix) {
    toast(t('minEmailPrefix', {msg: settingStore.settings.minEmailPrefix}), 'error')
    return
  }

  if (!isEmail(addForm.email + addForm.suffix)) {
    toast(t('notEmailMsg'), 'error')
    return
  }

  if (!verifyToken && (settingStore.settings.addEmailVerify === 0 || (settingStore.settings.addEmailVerify === 2 && settingStore.settings.addVerifyOpen))) {
    if (!verifyShow.value) {
      verifyShow.value = true
      nextTick(() => {
        if (!turnstileId) {
          try {
            turnstileId = window.turnstile.render('.add-email-turnstile')
          } catch (e) {
            botJsError.value = true
          }
        } else {
          window.turnstile.reset('.add-email-turnstile')
        }
      })
    } else if (!botJsError.value) {
      toast(t('botVerifyMsg'), 'error')
    }
    return;
  }

  addLoading.value = true
  accountAdd(addForm.email + addForm.suffix, verifyToken).then(account => {
    addLoading.value = false
    showAdd.value = false
    addForm.email = ''
    accounts.push(account)
    verifyToken = ''
    settingStore.settings.addVerifyOpen = account.addVerifyOpen
    toast(t('addSuccessMsg'), 'success')
    verifyShow.value = false
    userStore.refreshUserInfo()
  }).catch(res => {
    if (res.code === 400) {
      verifyToken = ''
      if (turnstileId) {
        window.turnstile.reset(turnstileId)
      } else {
        nextTick(() => {
          turnstileId = window.turnstile.render('.add-email-turnstile')
        })
      }
      verifyShow.value = true
    }
    addLoading.value = false
  })
}
</script>
<style>
path[fill="#ffdda1"] {
  fill: #ffdd7d;
}
</style>
<style scoped lang="scss">
.account-box {
  border-right: 1px solid var(--s-line);
  background: var(--s-paper);
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Toolbar ── */
.account-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 40px;
  padding: 0 10px;
  border-bottom: 1px solid var(--s-line);
  flex-shrink: 0;
}

.toolbar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
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

/* ── Scroll area ── */
.account-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: 8px;

  @media (max-width: 767px) {
    height: calc(100% - 60px);
  }
}

/* ── Account card ── */
.account-card {
  padding: 12px 14px;
  margin: 8px 10px 0;
  border-radius: var(--s-radius-lg);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--s-ease);

  &:first-child {
    margin-top: 10px;
  }

  &:hover {
    background: var(--s-soft);
  }

  &--active {
    background: var(--s-soft);
    border-color: var(--s-line);
  }
}

.account-card-email {
  font-family: var(--s-font-display);
  font-weight: 600;
  font-size: 14px;
  color: var(--s-ink);
  margin-bottom: 14px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.account-card-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.account-card-left,
.account-card-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.card-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: var(--s-radius);
  cursor: pointer;
  color: var(--s-muted);
  transition: all var(--s-ease);

  &:hover {
    background: var(--s-line);
    color: var(--s-ink);
  }
}

.icon-warn {
  color: #e0b800;
}

.icon-muted {
  color: var(--s-muted);
}

.card-settings-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--s-line);
}

/* ── Skeleton card ── */
.skeleton-card {
  padding: 14px;
  margin: 8px 10px 0;
  border-radius: var(--s-radius-lg);
  border: 1px solid var(--s-line);
  background: var(--s-soft);
}

/* ── End label ── */
.end-label {
  text-align: center;
  padding: 12px 0;
  font-size: 12px;
  color: var(--s-muted);
}

/* ── Empty ── */
.empty-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

/* ── Modal form ── */
.modal-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ── Input group (email + domain) ── */
.input-group {
  display: flex;
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius);
  overflow: hidden;
  transition: border-color var(--s-ease);

  &:focus-within {
    border-color: var(--s-accent);
  }

  :deep(.s-input-wrap) {
    border: none;
    border-radius: 0;
    flex: 1;
  }
  :deep(.s-input-wrap--error) {
    border: none;
  }
}

.domain-suffix {
  position: relative;
  flex-shrink: 0;
}

.domain-select-hidden {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  pointer-events: none;
  z-index: 2;

  /* Re-enable pointer events on the trigger area only */
  :deep(.s-select-trigger) {
    pointer-events: auto;
  }
}

.domain-display {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 12px;
  height: 100%;
  font-size: 14px;
  color: var(--s-body);
  background: var(--s-soft);
  border-left: 1px solid var(--s-line);
  cursor: pointer;
  user-select: none;
  white-space: nowrap;

  &:hover {
    background: var(--s-line);
  }
}

/* ── Turnstile ── */
.add-email-turnstile {
  margin-top: 14px;
}

.turnstile-show {
  opacity: 1;
}

.turnstile-hide {
  opacity: 0;
  pointer-events: none;
  position: fixed;
}
</style>
