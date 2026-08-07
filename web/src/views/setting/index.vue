<template>
  <div class="settings-page">
    <!-- Profile Section -->
    <section class="settings-card">
      <h2 class="card-title">{{ $t('profile') }}</h2>
      <div class="card-body">
        <div class="field-row">
          <span class="field-label">{{ $t('username') }}</span>
          <div class="field-value">
            <span v-if="setNameShow" class="edit-name-input">
              <s-input v-model="accountName" :placeholder="$t('username')" />
              <button class="link-btn" @click="setName">{{ $t('save') }}</button>
            </span>
            <span v-else class="user-name">
              <span class="name-text">{{ userStore.user.name }}</span>
              <button class="link-btn" @click="showSetName">{{ $t('change') }}</button>
            </span>
          </div>
        </div>
        <div class="field-row">
          <span class="field-label">{{ $t('emailAccount') }}</span>
          <span class="field-value muted">{{ userStore.user.email }}</span>
        </div>
        <div class="field-row">
          <span class="field-label">{{ $t('password') }}</span>
          <div class="field-value">
            <s-button type="primary" size="sm" @click="pwdShow = true">{{ $t('changePwdBtn') }}</s-button>
          </div>
        </div>
      </div>
    </section>

    <!-- Language Section -->
    <section class="settings-card">
      <h2 class="card-title">{{ $t('language') }}</h2>
      <div class="card-body">
        <s-select
          :model-value="langSelect"
          :options="langOptions"
          :placeholder="$t('select')"
          @change="changeLang"
        />
      </div>
    </section>

    <!-- Danger Zone -->
    <section class="settings-card danger-zone" v-perm="'my:delete'">
      <h2 class="card-title danger-title">{{ $t('deleteUser') }}</h2>
      <div class="card-body">
        <p class="danger-text">{{ $t('delAccountMsg') }}</p>
        <s-button type="danger" @click="deleteConfirm">{{ $t('deleteUserBtn') }}</s-button>
      </div>
    </section>

    <!-- Change Password Modal -->
    <s-modal v-model="pwdShow" :title="$t('changePassword')" size="sm">
      <div class="pwd-form">
        <s-input type="password" :placeholder="$t('newPassword')" v-model="form.password" />
        <s-input type="password" :placeholder="$t('confirmPassword')" v-model="form.newPwd" />
        <s-button type="primary" block :loading="setPwdLoading" @click="submitPwd">{{ $t('save') }}</s-button>
      </div>
    </s-modal>
  </div>
</template>

<script setup>
import {reactive, ref, computed, defineOptions} from 'vue'
import {resetPassword, userDelete} from "@/request/my.js";
import {useUserStore} from "@/store/user.js";
import router from "@/router/index.js";
import {accountSetName} from "@/request/account.js";
import {useAccountStore} from "@/store/account.js";
import {useI18n} from "vue-i18n";
import {useSettingStore} from "@/store/setting.js";
import { toast } from '@/components/ui/toast.js';
import { confirm } from '@/components/ui/confirm.js';
import SInput from '@/components/ui/s-input.vue';
import SButton from '@/components/ui/s-button.vue';
import SModal from '@/components/ui/s-modal.vue';
import SSelect from '@/components/ui/s-select.vue';

const { t } = useI18n()
const accountStore = useAccountStore()
const settingStore = useSettingStore()
const userStore = useUserStore();
const setPwdLoading = ref(false)
const setNameShow = ref(false)
const accountName = ref(null)
const langSelect = ref(settingStore.lang)

const langOptions = computed(() => [
  { label: '中文', value: 'zh' },
  { label: 'English', value: 'en' }
])

defineOptions({
  name: 'setting'
})

function showSetName() {
  accountName.value = userStore.user.name
  setNameShow.value = true
}

function setName() {

  if (!accountName.value) {
    toast(t('emptyUserNameMsg'), 'error')
    return;
  }

  setNameShow.value = false
  let name = accountName.value

  if (name === userStore.user.name) {
    return
  }

  userStore.user.name = accountName.value

  accountSetName(userStore.user.account.accountId,name).then(() => {
    toast(t('saveSuccessMsg'), 'success')

    accountStore.changeUserAccountName = name

  }).catch(() => {
    userStore.user.name = name
  })
}

function changeLang(lang) {
  let setting = {}
  try {
    setting = JSON.parse(localStorage.getItem('setting') || '{}')
  } catch (e) {
    setting = {}
  }
  localStorage.setItem('setting', JSON.stringify({...setting, lang}))
  window.location.reload()
}

const pwdShow = ref(false)
const form = reactive({
  password: '',
  newPwd: '',
})

const deleteConfirm = async () => {
  const ok = await confirm(t('delAccountConfirm'), t('confirm'))
  if (ok) {
    userDelete().then(() => {
      localStorage.removeItem('token');
      router.replace('/login');
      toast(t('delSuccessMsg'), 'success')
    })
  }
}


function submitPwd() {

  if (!form.password) {
    toast(t('emptyPwdMsg'), 'error')
    return
  }

  if (form.password.length < 6) {
    toast(t('pwdLengthMsg'), 'error')
    return
  }

  if (form.password !== form.newPwd) {
    toast(t('confirmPwdFailMsg'), 'error')
    return
  }

  setPwdLoading.value = true
  resetPassword(form.password).then(() => {
    toast(t('saveSuccessMsg'), 'success')
    pwdShow.value = false
    setPwdLoading.value = false
    form.password = ''
    form.newPwd = ''
  }).catch(() => {
    setPwdLoading.value = false
  })

}

</script>

<style scoped lang="scss">
.settings-page {
  padding: 40px;
  max-width: 100%;
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

.settings-card {
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

.field-row {
  display: grid;
  grid-template-columns: 120px 1fr;
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
  gap: 10px;
  color: var(--s-ink);
  min-width: 0;
}

.field-value.muted {
  color: var(--s-muted);
}

.user-name {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.name-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.link-btn {
  background: none;
  border: none;
  color: var(--s-accent);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  white-space: nowrap;
  transition: color var(--s-ease);

  &:hover {
    color: var(--s-accent-hover);
  }
}

.edit-name-input {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: 280px;

  .s-input-wrap {
    flex: 1;
  }
}

/* Danger zone */
.danger-zone {
  border-color: var(--s-danger-soft);

  .danger-title {
    color: var(--s-danger);
  }
}

.danger-text {
  font-size: 13px;
  color: var(--s-muted);
  line-height: 1.6;
  margin: 0;
}

/* Password form */
.pwd-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
</style>
