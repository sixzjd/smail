<template>
  <div class="login-page">
    <!-- Background layer (custom background image) -->
    <div v-if="background" class="login-bg" :style="background"></div>

    <!-- OAuth loading overlay -->
    <div v-if="oauthLoading" class="login-overlay">
      <div class="login-overlay-inner">
        <span class="s-spinner"></span>
        <span class="login-overlay-text">登录中...</span>
      </div>
    </div>

    <!-- Split-panel card -->
    <div class="login-card">
      <!-- Left: Brand story panel -->
      <section class="login-story">
        <div class="login-story-inner">
          <div class="login-brand">
            <span class="login-brand-mark">S</span>
            <span class="login-brand-text"><strong>s</strong>mail</span>
          </div>
          <div class="login-story-copy">
            <div class="login-kicker">A calmer inbox</div>
            <h1 class="login-headline">让一切尽在掌握</h1>
            <p class="login-subtitle" v-if="show === 'login'">{{ $t('loginTitle') }}</p>
            <p class="login-subtitle" v-else>{{ $t('regTitle') }}</p>
          </div>
          <div class="login-story-footer">
            <a v-if="settingStore.settings.projectLink" class="login-gh" href="https://github.com/sixzjd/smail" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <Icon icon="mingcute:github-line" width="18" height="18" />
            </a>
            <a class="login-doc" href="javascript:void(0)" aria-label="Doc" @click.prevent="router.push('/doc')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </a>
          </div>
        </div>
      </section>

      <!-- Right: Form panel -->
      <section class="login-form-wrap">
        <div class="login-form-inner">

          <!-- ===== LOGIN ===== -->
          <div v-show="show === 'login'">
            <h2 class="login-form-title">{{ $t('loginBtn') }}</h2>
            <p class="login-form-lead">{{ $t('loginTitle') }}</p>

            <div class="login-field">
              <label class="login-label">{{ $t('emailAccount') }}</label>
              <div class="login-email-row">
                <s-input
                  v-model="form.email"
                  type="text"
                  inputmode="email"
                  :placeholder="$t('emailAccount')"
                  class="login-email-input"
                />
                <s-select
                  v-if="!hideLoginDomain"
                  v-model="suffix"
                  :options="domainList.map(d => ({ value: d, label: d }))"
                  :placeholder="$t('select')"
                  class="login-domain-select"
                />
              </div>
            </div>

            <div class="login-field">
              <label class="login-label">{{ $t('password') }}</label>
              <s-input
                v-model="form.password"
                type="password"
                inputmode="text"
                :placeholder="$t('password')"
                class="login-pwd-input"
              />
            </div>

            <s-button type="primary" block :loading="loginLoading" @click="submit">
              {{ $t('loginBtn') }}
            </s-button>

            <s-button
              v-if="settingStore.settings.linuxdoSwitch"
              type="outline"
              block
              @click="linuxDoLogin"
              class="login-oauth-btn"
            >
              <img :src="'/image/linuxdo.webp'" alt="" class="login-oauth-icon" />
              LinuxDo
            </s-button>
          </div>

          <!-- ===== REGISTER ===== -->
          <div v-show="show !== 'login'">
            <h2 class="login-form-title">{{ $t('regBtn') }}</h2>
            <p class="login-form-lead">{{ $t('regTitle') }}</p>

            <div class="login-field">
              <label class="login-label">{{ $t('emailAccount') }}</label>
              <div class="login-email-row">
                <s-input
                  v-model="registerForm.email"
                  type="text"
                  inputmode="email"
                  :placeholder="$t('emailAccount')"
                  class="login-email-input"
                />
                <s-select
                  v-if="!hideLoginDomain"
                  v-model="suffix"
                  :options="domainList.map(d => ({ value: d, label: d }))"
                  :placeholder="$t('select')"
                  class="login-domain-select"
                />
              </div>
            </div>

            <div class="login-field">
              <label class="login-label">{{ $t('password') }}</label>
              <s-input v-model="registerForm.password" type="password" inputmode="text" :placeholder="$t('password')" class="login-pwd-input" />
            </div>

            <div class="login-field">
              <label class="login-label">{{ $t('confirmPwd') }}</label>
              <s-input v-model="registerForm.confirmPassword" type="password" inputmode="text" :placeholder="$t('confirmPwd')" class="login-pwd-input" />
            </div>

            <div class="login-field" v-if="settingStore.settings.regKey === 0">
              <s-input v-model="registerForm.code" type="text" :placeholder="$t('regKey')" />
            </div>

            <div class="login-field" v-if="settingStore.settings.regKey === 2">
              <s-input v-model="registerForm.code" type="text" :placeholder="$t('regKeyOptional')" />
            </div>

            <div
              v-show="verifyShow"
              class="register-turnstile"
              :data-sitekey="settingStore.settings.siteKey"
              data-callback="onTurnstileSuccess"
              data-error-callback="onTurnstileError"
              data-after-interactive-callback="loadAfter"
              data-before-interactive-callback="loadBefore"
            >
              <span class="login-verify-error" v-if="botJsError">{{ $t('verifyModuleFailed') }}</span>
            </div>

            <s-button type="primary" block :loading="registerLoading" @click="submitRegister">
              {{ $t('regBtn') }}
            </s-button>

            <s-button
              v-if="settingStore.settings.linuxdoSwitch"
              type="outline"
              block
              @click="linuxDoLogin"
              class="login-oauth-btn"
            >
              <img :src="'/image/linuxdo.webp'" alt="" class="login-oauth-icon" />
              LinuxDo
            </s-button>
          </div>

          <!-- Switch between login / register -->
          <div class="login-foot" v-if="settingStore.settings.register === 0">
            <template v-if="show === 'login'">
              {{ $t('noAccount') }}
              <a class="login-link" @click="show = 'register'">{{ $t('regSwitch') }}</a>
            </template>
            <template v-else>
              {{ $t('hasAccount') }}
              <a class="login-link" @click="show = 'login'">{{ $t('loginSwitch') }}</a>
            </template>
          </div>

        </div>
      </section>

      <!-- GitHub & Doc links (below form on mobile) -->
      <div class="login-story-bottom">
        <a v-if="settingStore.settings.projectLink" class="login-gh" href="https://github.com/sixzjd/smail" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
          <Icon icon="mingcute:github-line" width="18" height="18" />
        </a>
        <a class="login-doc" href="javascript:void(0)" aria-label="Doc" @click.prevent="router.push('/doc')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        </a>
      </div>
    </div>

    <!-- Bind email dialog -->
    <s-modal v-model="showBindForm" :title="'注册邮箱'" size="sm">
      <div class="login-bind-grid">
        <div class="login-field">
          <div class="login-email-row">
            <s-input
              v-model="bindForm.email"
              type="text"
              :placeholder="$t('emailAccount')"
              class="login-email-input"
            />
            <s-select
              v-if="!hideLoginDomain"
              v-model="suffix"
              :options="domainList.map(d => ({ value: d, label: d }))"
              :placeholder="$t('select')"
              class="login-domain-select"
            />
          </div>
        </div>

        <div class="login-field" v-if="settingStore.settings.regKey === 0">
          <s-input v-model="bindForm.code" type="text" :placeholder="$t('regKey')" />
        </div>

        <div class="login-field" v-if="settingStore.settings.regKey === 2">
          <s-input v-model="bindForm.code" type="text" :placeholder="$t('regKeyOptional')" />
        </div>

        <s-button type="primary" block :loading="bindLoading" @click="bind">
          绑定
        </s-button>
      </div>
    </s-modal>
  </div>
</template>

<script setup>
import router from "@/router";
import {computed, nextTick, reactive, ref} from "vue";
import {login} from "@/request/login.js";
import {register} from "@/request/login.js";
import {websiteConfig} from "@/request/setting.js";
import {isEmail} from "@/utils/verify-utils.js";
import {useSettingStore} from "@/store/setting.js";
import {useAccountStore} from "@/store/account.js";
import {useUserStore} from "@/store/user.js";
import {useUiStore} from "@/store/ui.js";
import {Icon} from "@iconify/vue";
import {cvtR2Url} from "@/utils/convert.js";
import {loginUserInfo} from "@/request/my.js";
import {permsToRouter} from "@/perm/perm.js";
import {useI18n} from "vue-i18n";
import {oauthBindUser, oauthLinuxDoLogin} from "@/request/ouath.js";
import { toast } from "@/components/ui/toast.js";

const {t} = useI18n();
const accountStore = useAccountStore();
const userStore = useUserStore();
const uiStore = useUiStore();
const settingStore = useSettingStore();
const loginLoading = ref(false)
const bindLoading = ref(false)
const oauthLoading = ref(false);
const showBindForm = ref(false);
const show = ref('login')

const bindForm = reactive({
  email: '',
  oauthUserId: '',
  code: ''
})

const form = reactive({
  email: '',
  password: '',

});
const mySelect = ref()
const suffix = ref('')
const registerForm = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  code: null
})
const domainList = settingStore.domainList;
const registerLoading = ref(false)
suffix.value = domainList[0]
const verifyShow = ref(false)
let verifyToken = ''
let turnstileId = null
let botJsError = ref(false)
let verifyErrorCount = 0

window.onTurnstileSuccess = (token) => {
  verifyToken = token;
};

window.onTurnstileError = (e) => {
  if (verifyErrorCount >= 4) {
    return
  }
  verifyErrorCount++
  console.warn('人机验加载失败', e)
  setTimeout(() => {
    nextTick(() => {
      if (!turnstileId) {
        turnstileId = window.turnstile.render('.register-turnstile')
      } else {
        window.turnstile.reset(turnstileId);
      }
    })
  }, 1500)
};

window.loadAfter = () => {}

window.loadBefore = () => {}

const loginOpacity = computed(() => {
  const opacity = settingStore.settings.loginOpacity
  return uiStore.dark ? `rgba(0, 0, 0, ${opacity})` : `rgba(255, 255, 255, ${opacity})`
})

const loginDarkenFactor = computed(() => {
  const factor = Number(settingStore.settings.loginDarkenFactor ?? 0)
  if (Number.isNaN(factor)) return 0
  return Math.min(1, Math.max(0, factor))
})

const hideLoginDomain = computed(() => settingStore.settings.loginDomain === 1)

const background = computed(() => {
  const bg = settingStore.settings.background
  if (!bg) return ''
  const bgUrl = cvtR2Url(bg)
  return {
    'background-image': `
      linear-gradient(rgba(0, 0, 0, ${loginDarkenFactor.value}), rgba(0, 0, 0, ${loginDarkenFactor.value})),
      url(${bgUrl})
    `,
    'background-repeat': 'no-repeat, no-repeat',
    'background-size': 'cover, cover',
    'background-position': 'center, center'
  }
})

const openSelect = () => {
  mySelect.value.toggleMenu()
}

const getFullEmail = (email) => {
  return hideLoginDomain.value ? email : email + suffix.value
}

const getEmailName = (email) => {
  return email.split('@')[0]
}

function linuxDoLogin() {
  const clientId = settingStore.settings.linuxdoClientId
  const redirectUri = encodeURIComponent(settingStore.settings.linuxdoCallbackUrl)
  window.location.href =
      `https://connect.linux.do/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid+profile+email`
}

linuxDoGetUser();

async function linuxDoGetUser() {

  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')

  if (code) {

    oauthLoading.value = true
    oauthLinuxDoLogin(code).then(data => {

      bindForm.oauthUserId = data.userInfo.oauthUserId;

      if (!data.token) {
        showBindForm.value = true
        oauthLoading.value = false
        toast('请注册绑定一个邮箱', 'warning')
        return;
      }

      saveToken(data.token);
    }).catch(() => {
      oauthLoading.value = false
    })
  }

  const cleanUrl = window.location.origin + window.location.pathname
  window.history.replaceState({}, '', cleanUrl)
}

function bind() {

  if (!bindForm.email) {
    toast(t('emptyEmailMsg'), 'error')
    return
  }


  if (getEmailName(bindForm.email).length < settingStore.settings.minEmailPrefix) {
    toast(t('minEmailPrefix', {msg: settingStore.settings.minEmailPrefix}), 'error')
    return
  }

  let email = getFullEmail(bindForm.email);


  if (!isEmail(email)) {
    toast(t('notEmailMsg'), 'error')
    return
  }

  if (settingStore.settings.regKey === 0) {

    if (!bindForm.code) {

      toast(t('emptyRegKeyMsg'), 'error')
      return
    }

  }

  const form = {email, oauthUserId: bindForm.oauthUserId, code: bindForm.code}

  bindLoading.value = true
  oauthBindUser(form).then(data => {
    saveToken(data.token)
  }).catch(() => {
    bindLoading.value = false
  })
}

const submit = () => {

  if (!form.email) {
    toast(t('emptyEmailMsg'), 'error')
    return
  }

  let email = getFullEmail(form.email);

  if (!isEmail(email)) {
    toast(t('notEmailMsg'), 'error')
    return
  }

  if (!form.password) {
    toast(t('emptyPwdMsg'), 'error')
    return
  }

  loginLoading.value = true
  login(email, form.password).then(async data => {
    await saveToken(data.token)
  }).finally(() => {
    loginLoading.value = false
  })
}

async function saveToken(token) {
  localStorage.setItem('token', token)
  refreshWebsiteConfig()
  const user = await loginUserInfo();
  accountStore.currentAccountId = user.account.accountId;
  accountStore.currentAccount = user.account;
  userStore.user = user;
  const routers = permsToRouter(user.permKeys);
  routers.forEach(routerData => {
    router.addRoute('layout', routerData);
  });
  await router.replace({name: 'layout'})
  uiStore.showNotice()
  oauthLoading.value = false;
  bindLoading.value = false;
}

function refreshWebsiteConfig() {
  websiteConfig().then(setting => {
    settingStore.settings = setting
    settingStore.domainList = setting.domainList
    if (!suffix.value && setting.domainList.length > 0) {
      suffix.value = setting.domainList[0]
    }
    document.title = setting.title
  }).catch(e => {
    console.error(e)
  })
}


function submitRegister() {

  if (!registerForm.email) {
    toast(t('emptyEmailMsg'), 'error')
    return
  }

  if (getEmailName(registerForm.email).length < settingStore.settings.minEmailPrefix) {
    toast(t('minEmailPrefix', {msg: settingStore.settings.minEmailPrefix}), 'error')
    return
  }

  const email = getFullEmail(registerForm.email);

  if (!isEmail(email)) {
    toast(t('notEmailMsg'), 'error')
    return
  }

  if (!registerForm.password) {
    toast(t('emptyPwdMsg'), 'error')
    return
  }

  if (registerForm.password.length < 6) {
    toast(t('pwdLengthMsg'), 'error')
    return
  }

  if (registerForm.password !== registerForm.confirmPassword) {

    toast(t('confirmPwdFailMsg'), 'error')
    return
  }

  if (settingStore.settings.regKey === 0) {

    if (!registerForm.code) {

      toast(t('emptyRegKeyMsg'), 'error')
      return
    }

  }

  if (!verifyToken && (settingStore.settings.registerVerify === 0 || (settingStore.settings.registerVerify === 2 && settingStore.settings.regVerifyOpen))) {
    if (!verifyShow.value) {
      verifyShow.value = true
      nextTick(() => {
        if (!turnstileId) {
          try {
            turnstileId = window.turnstile.render('.register-turnstile')
          } catch (e) {
            botJsError.value = true
          }
        } else {
          window.turnstile.reset('.register-turnstile')
        }
      })
    } else if (!botJsError.value) {
      toast(t('botVerifyMsg'), 'error')
    }
    return;
  }

  registerLoading.value = true

  const form = {
    email,
    password: registerForm.password,
    token: verifyToken,
    code: registerForm.code
  }

  register(form).then(({regVerifyOpen}) => {
    show.value = 'login'
    registerForm.email = ''
    registerForm.password = ''
    registerForm.confirmPassword = ''
    registerForm.code = ''
    registerLoading.value = false
    verifyToken = ''
    settingStore.settings.regVerifyOpen = regVerifyOpen
    verifyShow.value = false
    toast(t('regSuccessMsg'), 'success')
  }).catch(res => {

    registerLoading.value = false

    if (res.code === 400) {
      verifyToken = ''
      settingStore.settings.regVerifyOpen = true
      if (turnstileId) {
        window.turnstile.reset(turnstileId)
      } else {
        nextTick(() => {
          turnstileId = window.turnstile.render('.register-turnstile')
        })
      }
      verifyShow.value = true

    }
  });
}

</script>

<style scoped>
/* ── Page shell ── */
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--s-paper, #f8f6f1);
  font-family: var(--s-font-body, 'DM Sans', sans-serif);
  color: var(--s-ink, #1a1a1a);
  position: relative;
}

.login-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
}

/* ── OAuth loading overlay ── */
.login-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(248, 246, 241, 0.85);
  backdrop-filter: blur(6px);
}

.login-overlay-inner {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--s-ink, #1a1a1a);
  font-family: var(--s-font-display, 'Plus Jakarta Sans', sans-serif);
  font-weight: 600;
}

.s-spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid var(--s-line, #e0ddd6);
  border-top-color: var(--s-accent, #d9543e);
  border-radius: 50%;
  animation: login-spin 0.6s linear infinite;
}

@keyframes login-spin {
  to { transform: rotate(360deg); }
}

/* ── Card ── */
.login-card {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 2fr 3fr;
  width: 100%;
  max-width: 920px;
  min-height: 540px;
  background: var(--s-paper, #f8f6f1);
  border-radius: var(--s-radius-xl, 16px);
  box-shadow: var(--s-shadow, 0 4px 24px rgba(0,0,0,.08));
  overflow: hidden;
  margin-left: -40px;
}

/* ── Left: story panel ── */
.login-story {
  background: var(--s-soft, #f0ede6);
  border-right: 1px solid var(--s-line, #e0ddd6);
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 48px 24px 48px 40px;
}

.login-story-inner {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 360px;
  width: 100%;
  align-items: flex-start;
  margin-left: 10px;
}

/* ── Right: form panel ── */
.login-form-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
}

.login-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--s-font-display, 'Plus Jakarta Sans', sans-serif);
  font-size: 20px;
  color: var(--s-ink, #1a1a1a);
}

.login-brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--s-radius, 8px);
  background: var(--s-accent, #d9543e);
  color: #fff;
  font-weight: 800;
  font-size: 18px;
  font-family: var(--s-font-display, 'Plus Jakarta Sans', sans-serif);
}

.login-brand-text strong {
  font-weight: 700;
}

.login-story-copy {
  margin-top: 32px;
}

.login-kicker {
  font-family: var(--s-font-body, 'DM Sans', sans-serif);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--s-accent, #d9543e);
  margin-bottom: 12px;
}

.login-headline {
  font-family: var(--s-font-display, 'Plus Jakarta Sans', sans-serif);
  font-size: 28px;
  font-weight: 700;
  line-height: 1.25;
  color: var(--s-ink, #1a1a1a);
  margin: 0 0 10px;
}

.login-subtitle {
  font-size: 15px;
  color: var(--s-muted, #7a7670);
  margin: 0;
  line-height: 1.5;
}

/* ── GitHub & Doc links (below form on mobile) ── */
.login-story-bottom {
  display: none;
  gap: 12px;
  padding: 0 28px 20px;
}

.login-story-footer {
  margin-top: auto;
  padding-top: 32px;
  display: flex;
  gap: 12px;
}

.login-gh,
.login-doc {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: var(--s-radius, 8px);
  border: 1px solid var(--s-line, #e0ddd6);
  color: var(--s-muted, #7a7670);
  transition: all var(--s-ease, 200ms ease);
  text-decoration: none;
}

.login-gh:hover,
.login-doc:hover {
  border-color: var(--s-accent, #d9543e);
  color: var(--s-accent, #d9543e);
}

/* ── Right: form panel ── */
.login-form-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
}

.login-form-inner {
  width: 100%;
  max-width: 340px;
}

.login-form-title {
  font-family: var(--s-font-display, 'Plus Jakarta Sans', sans-serif);
  font-size: 22px;
  font-weight: 700;
  color: var(--s-ink, #1a1a1a);
  margin: 0 0 4px;
}

.login-form-lead {
  font-size: 14px;
  color: var(--s-muted, #7a7670);
  margin: 0 0 28px;
}

/* ── Fields ── */
.login-field {
  margin-bottom: 18px;
}

.login-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--s-ink, #1a1a1a);
  margin-bottom: 6px;
}

.login-email-row {
  display: flex;
  gap: 0;
}

.login-email-input {
  flex: 1;
  min-width: 0;
}

.login-email-input :deep(.s-input-wrap) {
  border-radius: var(--s-radius, 8px) 0 0 var(--s-radius, 8px);
  border-right: none;
}

.login-domain-select {
  width: 140px;
  flex-shrink: 0;
}

.login-domain-select :deep(.s-select-trigger) {
  border-radius: 0 var(--s-radius, 8px) var(--s-radius, 8px) 0;
  height: 100%;
  border-left: 1px solid var(--s-line, #e0ddd6);
}

/* ── OAuth button icon ── */
.login-oauth-icon {
  width: 18px;
  height: 18px;
  border-radius: 3px;
  margin-right: 8px;
  vertical-align: middle;
}

.login-oauth-btn {
  margin-top: 10px;
}

/* ── Footer / switch ── */
.login-foot {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: var(--s-muted, #7a7670);
}

.login-link {
  color: var(--s-accent, #d9543e);
  cursor: pointer;
  text-decoration: none;
  font-weight: 500;
  transition: color var(--s-ease, 200ms ease);
}

.login-link:hover {
  color: var(--s-ink, #1a1a1a);
}

/* ── Turnstile ── */
.register-turnstile {
  margin-bottom: 18px;
}

.login-verify-error {
  font-size: 12px;
  color: var(--s-danger, #e53e3e);
}

/* ── Bind dialog grid ── */
.login-bind-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* ── Responsive: tablet ── */
@media (max-width: 860px) {
  .login-card {
    grid-template-columns: 1fr;
    max-width: 480px;
    min-height: auto;
    margin-left: 0;
  }

  .login-story {
    position: static;
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--s-line, #e0ddd6);
    padding: 24px 28px 20px;
  }

  .login-story-inner {
    min-height: auto;
    height: auto;
  }

  .login-story-footer {
    display: none;
  }

  .login-story-copy {
    margin-top: 16px;
  }

  .login-kicker {
    margin-bottom: 8px;
  }

  .login-headline {
    font-size: 21px;
    margin: 0 0 8px;
  }

  .login-form-wrap {
    margin-top: 10px;
    margin-left: 0;
    width: 100%;
    padding: 20px 28px 26px;
  }

  .login-form-title {
    margin-top: 10px;
  }

  .login-story-bottom {
    display: flex;
    justify-content: center;
  }

}

/* ── Responsive: mobile ── */
@media (max-width: 520px) {
  .login-page {
    padding: 12px;
    align-items: flex-start;
    padding-top: 40px;
  }

  .login-card {
    grid-template-columns: 1fr;
    max-width: 100%;
    border-radius: var(--s-radius-lg, 12px);
    margin-left: 0;
  }

  .login-story {
    position: static;
    width: 100%;
    padding: 20px 20px 16px;
  }

  .login-brand {
    font-size: 16px;
  }

  .login-brand-mark {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }

  .login-story-copy {
    margin-top: 12px;
  }

  .login-kicker {
    margin-bottom: 6px;
    font-size: 11px;
  }

  .login-headline {
    font-size: 19px;
    margin: 0 0 6px;
  }

  .login-subtitle {
    font-size: 13px;
  }

  .login-form-wrap {
    margin-top: 10px;
    margin-left: 0;
    width: 100%;
    padding: 15px 20px 20px;
  }

  .login-form-title {
    margin-top: 10px;
    font-size: 19px;
  }

  .login-domain-select {
    width: 120px;
  }
}

/* ── Mobile: prevent iOS zoom on focus ── */
@media (max-width: 520px) {
  .login-email-input :deep(input),
  .login-pwd-input :deep(input),
  .login-domain-select :deep(input) {
    font-size: 16px;
  }
}
</style>
