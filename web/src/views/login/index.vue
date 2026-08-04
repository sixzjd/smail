<template>
  <div id="login-box" :style=" background ? 'background: var(--el-bg-color)' : ''" v-loading="oauthLoading" element-loading-text="登录中...">
    <div id="background-wrap" v-if="!settingStore.settings.background">
      <div class="x1 cloud"></div>
      <div class="x2 cloud"></div>
      <div class="x3 cloud"></div>
      <div class="x4 cloud"></div>
      <div class="x5 cloud"></div>
    </div>
    <div v-else :style="background"></div>
    <div class="form-wrapper">
      <div class="container">
        <span class="form-title">{{ settingStore.settings.title }}</span>
        <span class="form-desc" v-if="show === 'login'">{{ $t('loginTitle') }}</span>
        <span class="form-desc" v-else>{{ $t('regTitle') }}</span>
        <div v-show="show === 'login'">
          <el-input :class="!hideLoginDomain ? 'email-input' : ''" v-model="form.email"
                    type="text" :placeholder="$t('emailAccount')" autocomplete="off">
            <template #append v-if="!hideLoginDomain">
              <div @click.stop="openSelect">
                <el-select
                    v-if="show === 'login'"
                    ref="mySelect"
                    v-model="suffix"
                    :placeholder="$t('select')"
                    class="select"
                >
                  <el-option
                      v-for="item in domainList"
                      :key="item"
                      :label="item"
                      :value="item"
                  />
                </el-select>
                <div style="color: var(--el-text-color-primary)">
                  <span>{{ suffix }}</span>
                  <Icon class="setting-icon" icon="mingcute:down-small-fill" width="20" height="20"/>
                </div>
              </div>
            </template>
          </el-input>
          <el-input v-model="form.password" :placeholder="$t('password')" type="password" autocomplete="off">
          </el-input>
          <el-button class="btn" type="primary" @click="submit" :loading="loginLoading"
          >{{ $t('loginBtn') }}
          </el-button>
          <el-button class="btn" v-if="settingStore.settings.linuxdoSwitch"  style="margin-top: 10px"  @click="linuxDoLogin">
            <el-avatar src="/image/linuxdo.webp" :size="18" style="margin-right: 10px" />LinuxDo
          </el-button>
        </div>
        <div v-show="show !== 'login'">
          <el-input :class="!hideLoginDomain ? 'email-input' : ''" v-model="registerForm.email" type="text" :placeholder="$t('emailAccount')"
                    autocomplete="off">
            <template #append v-if="!hideLoginDomain">
              <div @click.stop="openSelect">
                <el-select
                    v-if="show !== 'login'"
                    ref="mySelect"
                    v-model="suffix"
                    :placeholder="$t('select')"
                    class="select"
                >
                  <el-option
                      v-for="item in domainList"
                      :key="item"
                      :label="item"
                      :value="item"
                  />
                </el-select>
                <div style="color: var(--el-text-color-primary)">
                  <span>{{ suffix }}</span>
                  <Icon class="setting-icon" icon="mingcute:down-small-fill" width="20" height="20"/>
                </div>
              </div>
            </template>
          </el-input>
          <el-input v-model="registerForm.password" :placeholder="$t('password')" type="password" autocomplete="off"/>
          <el-input v-model="registerForm.confirmPassword" :placeholder="$t('confirmPwd')" type="password"
                    autocomplete="off"/>
          <el-input v-if="settingStore.settings.regKey === 0" v-model="registerForm.code" :placeholder="$t('regKey')"
                    type="text" autocomplete="off"/>
          <el-input v-if="settingStore.settings.regKey === 2" v-model="registerForm.code"
                    :placeholder="$t('regKeyOptional')" type="text" autocomplete="off"/>
          <div v-show="verifyShow"
               class="register-turnstile"
               :data-sitekey="settingStore.settings.siteKey"
               data-callback="onTurnstileSuccess"
               data-error-callback="onTurnstileError"
               data-after-interactive-callback="loadAfter"
               data-before-interactive-callback="loadBefore"
          >
            <span style="font-size: 12px;color: #F56C6C" v-if="botJsError">{{ $t('verifyModuleFailed') }}</span>
          </div>
          <el-button class="btn" style="margin: 0" type="primary" @click="submitRegister" :loading="registerLoading"
          >{{ $t('regBtn') }}
          </el-button>
          <el-button v-if="settingStore.settings.linuxdoSwitch" class="btn" style="margin-top: 10px"  @click="linuxDoLogin">
            <el-avatar src="/image/linuxdo.webp" :size="18" style="margin-right: 10px" />LinuxDo
          </el-button>
        </div>
        <template v-if="settingStore.settings.register === 0">
          <div class="switch" @click="show = 'register'" v-if="show === 'login'">{{ $t('noAccount') }}
            <span>{{ $t('regSwitch') }}</span></div>
          <div class="switch" @click="show = 'login'" v-else>{{ $t('hasAccount') }} <span>{{ $t('loginSwitch') }}</span>
          </div>
        </template>
      </div>
    </div>
    <el-dialog class="bind-dialog" v-model="showBindForm"  title="注册邮箱" >
      <div class="bind-container">
        <el-input :class="!hideLoginDomain ? 'email-input' : ''" v-model="bindForm.email" type="text" :placeholder="$t('emailAccount')" autocomplete="off">
          <template #append v-if="!hideLoginDomain">
            <div @click.stop="openSelect">
              <el-select
                  ref="mySelect"
                  v-model="suffix"
                  :placeholder="$t('select')"
                  class="select"
              >
                <el-option
                    v-for="item in domainList"
                    :key="item"
                    :label="item"
                    :value="item"
                />
              </el-select>
              <div style="color: var(--el-text-color-primary)">
                <span>{{ suffix }}</span>
                <Icon class="setting-icon" icon="mingcute:down-small-fill" width="20" height="20"/>
              </div>
            </div>
          </template>
        </el-input>
        <el-input v-if="settingStore.settings.regKey === 0" v-model="bindForm.code" :placeholder="$t('regKey')"
                  type="text" autocomplete="off"/>
        <el-input v-if="settingStore.settings.regKey === 2" v-model="bindForm.code"
                  :placeholder="$t('regKeyOptional')" type="text" autocomplete="off"/>
        <el-button class="btn" type="primary" @click="bind" :loading="bindLoading"
        >绑定
        </el-button>
      </div>
    </el-dialog>
    <a v-show="settingStore.settings.projectLink" class="github" href="https://github.com/sixzjd/smail">
      <Icon icon="mingcute:github-line" color="#a78bfa" width="20" height="20" />
    </a>
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

window.loadAfter = (e) => {
  console.log('loadAfter')
}

window.loadBefore = (e) => {
  console.log('loadBefore')
}

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
        ElMessage({
          message: '请注册绑定一个邮箱',
          type: 'warning',
          duration: 4000,
          plain: true,
        })
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
    ElMessage({
      message: t('emptyEmailMsg'),
      type: 'error',
      plain: true,
    })
    return
  }


  if (getEmailName(bindForm.email).length < settingStore.settings.minEmailPrefix) {
    ElMessage({
      message: t('minEmailPrefix', {msg: settingStore.settings.minEmailPrefix}),
      type: 'error',
      plain: true,
    })
    return
  }

  let email = getFullEmail(bindForm.email);


  if (!isEmail(email)) {
    ElMessage({
      message: t('notEmailMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (settingStore.settings.regKey === 0) {

    if (!bindForm.code) {

      ElMessage({
        message: t('emptyRegKeyMsg'),
        type: 'error',
        plain: true,
      })
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
    ElMessage({
      message: t('emptyEmailMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  let email = getFullEmail(form.email);

  if (!isEmail(email)) {
    ElMessage({
      message: t('notEmailMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (!form.password) {
    ElMessage({
      message: t('emptyPwdMsg'),
      type: 'error',
      plain: true,
    })
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
    ElMessage({
      message: t('emptyEmailMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  console.log(registerForm.email)

  if (getEmailName(registerForm.email).length < settingStore.settings.minEmailPrefix) {
    ElMessage({
      message: t('minEmailPrefix', {msg: settingStore.settings.minEmailPrefix}),
      type: 'error',
      plain: true,
    })
    return
  }

  const email = getFullEmail(registerForm.email);

  if (!isEmail(email)) {
    ElMessage({
      message: t('notEmailMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (!registerForm.password) {
    ElMessage({
      message: t('emptyPwdMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (registerForm.password.length < 6) {
    ElMessage({
      message: t('pwdLengthMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (registerForm.password !== registerForm.confirmPassword) {

    ElMessage({
      message: t('confirmPwdFailMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (settingStore.settings.regKey === 0) {

    if (!registerForm.code) {

      ElMessage({
        message: t('emptyRegKeyMsg'),
        type: 'error',
        plain: true,
      })
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
            console.log('人机验证js加载失败')
          }
        } else {
          window.turnstile.reset('.register-turnstile')
        }
      })
    } else if (!botJsError.value) {
      ElMessage({
        message: t('botVerifyMsg'),
        type: "error",
        plain: true
      })
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
    ElMessage({
      message: t('regSuccessMsg'),
      type: 'success',
      plain: true,
    })
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


<style>
.el-select-dropdown__item {
  padding: 0 15px;
}

.no-autofill-pwd {
  .el-input__inner {
    -webkit-text-security: disc !important;
  }
}
</style>

<style lang="scss" scoped>

.form-wrapper {
  position: fixed;
  right: 0;
  height: 100%;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  @media (max-width: 767px) {
    width: 100%;
  }
}

.container {
  background: var(--login-form-bg, rgba(17, 0, 34, 0.85));
  backdrop-filter: blur(20px);
  padding-left: 40px;
  padding-right: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 450px;
  height: 100%;
  border-left: 1px solid var(--login-form-border, rgba(139, 92, 246, 0.15));
  box-shadow: var(--login-form-shadow, -10px 0 40px rgba(0, 0, 0, 0.3));
  @media (max-width: 1024px) {
    padding: 20px 18px;
    width: 384px;
    margin-left: 18px;
  }
  @media (max-width: 767px) {
    border: 1px solid var(--login-form-border, rgba(139, 92, 246, 0.15));
    padding: 20px 18px;
    border-radius: 12px;
    height: fit-content;
    width: 100%;
    margin-right: 18px;
    margin-left: 18px;
    background: var(--login-form-bg-mobile, rgba(17, 0, 34, 0.9));
  }

  .btn {
    height: 36px;
    width: 100%;
    border-radius: 6px;
    background: linear-gradient(135deg, #8b5cf6, #f59e0b) !important;
    border: none !important;
    font-weight: 600;
    transition: all 0.3s ease;
  }

  .btn:hover {
    background: linear-gradient(135deg, #7c3aed, #d97706) !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
  }

  .form-desc {
    margin-top: 5px;
    margin-bottom: 18px;
    color: var(--form-desc-color);
  }

  .form-title {
    font-weight: bold;
    font-size: 22px !important;
    color: var(--el-text-color-primary);
  }

  .switch {
    margin-top: 20px;
    text-align: center;
    color: var(--secondary-text-color);

    span {
      color: var(--login-switch-color);
      cursor: pointer;
    }
  }

  :deep(.el-input__wrapper) {
    border-radius: 6px;
    background: var(--login-input-bg, rgba(26, 10, 46, 0.8));
    border: 1px solid var(--login-input-border, rgba(139, 92, 246, 0.1));
    box-shadow: none !important;
  }

  :deep(.el-input__wrapper:focus-within) {
    border-color: rgba(139, 92, 246, 0.4) !important;
  }

  :deep(.el-input__inner) {
    color: var(--el-text-color-primary) !important;
  }

  .email-input :deep(.el-input__wrapper) {
    border-radius: 6px 0 0 6px;
    background: var(--login-input-bg, rgba(26, 10, 46, 0.8));
  }

  .el-input {
    height: 38px;
    width: 100%;
    margin-bottom: 18px;

    :deep(.el-input__inner) {
      height: 36px;
    }
  }
}

:deep(.el-select-dropdown__item) {
  padding: 0 10px;
}

:deep(.bind-dialog) {
  width: 400px !important;
  @media (max-width: 440px) {
    width: calc(100% - 40px) !important;
    margin-right: 20px !important;
    margin-left: 20px !important;
  }
}

.bind-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px;
}

.setting-icon {
  position: relative;
  top: 6px;
}

.github {
  position: fixed;
  width: 35px;
  height: 35px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  background: var(--login-input-bg, rgba(26, 10, 46, 0.8));
  backdrop-filter: blur(10px);
  bottom: 10px;
  right: 10px;
  z-index: 1000;
  border: 1px solid var(--login-input-border, rgba(139, 92, 246, 0.2));
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.github:hover {
  border-color: rgba(139, 92, 246, 0.5);
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.2);
}

:deep(.el-input-group__append) {
  padding: 0 !important;
  padding-left: 8px !important;
  padding-right: 4px !important;
  background: var(--login-input-bg, rgba(26, 10, 46, 0.8)) !important;
  border-radius: 0 8px 8px 0;
  border: 1px solid var(--login-input-border, rgba(139, 92, 246, 0.1));
  border-left: none;
  color: var(--el-text-color-primary) !important;
}

:deep(.el-input-group__append span) {
  color: var(--el-text-color-primary) !important;
}

:deep(.el-button+.el-button) {
  margin: 0;
}

.register-turnstile {
  margin-bottom: 18px;
}

.select {
  position: absolute;
  right: 30px;
  width: 100px;
  opacity: 0;
  pointer-events: none;
}

.custom-style {
  margin-bottom: 10px;
}

.custom-style .el-segmented {
  --el-border-radius-base: 6px;
  width: 180px;
}


#login-box {
  background: linear-gradient(135deg, var(--login-bg-from, #0c0015) 0%, var(--login-bg-to, #1a0a2e) 30%, var(--login-bg-mid, #110022) 60%, var(--login-bg-from, #0c0015) 100%);
  font: 100% Arial, sans-serif;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  display: grid;
  grid-template-columns: 1fr;
  position: relative;
}

#login-box::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(ellipse at 20% 50%, var(--login-glow-1, rgba(139, 92, 246, 0.08)) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 20%, var(--login-glow-2, rgba(245, 158, 11, 0.05)) 0%, transparent 50%),
              radial-gradient(ellipse at 60% 80%, var(--login-glow-3, rgba(139, 92, 246, 0.06)) 0%, transparent 50%);
  z-index: 0;
  pointer-events: none;
}


#background-wrap {
  height: 100%;
  z-index: 0;
}

@keyframes animateCloud {
  0% {
    margin-left: -500px;
  }

  100% {
    margin-left: 100%;
  }
}

.x1 {
  animation: animateCloud 30s linear infinite;
  transform: scale(0.65);
}

.x2 {
  animation: animateCloud 15s linear infinite;
  transform: scale(0.3);
}

.x3 {
  animation: animateCloud 25s linear infinite;
  transform: scale(0.5);
}

.x4 {
  animation: animateCloud 13s linear infinite;
  transform: scale(0.4);
}

.x5 {
  animation: animateCloud 20s linear infinite;
  transform: scale(0.55);
}

.cloud {
  background: radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.03) 70%, transparent 100%);
  border-radius: 50%;
  height: 200px;
  width: 200px;
  position: relative;
  filter: blur(40px);
}

.cloud:after,
.cloud:before {
  content: "";
  position: absolute;
  background: transparent;
  z-index: -1;
}

.cloud:after {
  border-radius: 50%;
  height: 0;
  width: 0;
}

.cloud:before {
  border-radius: 50%;
  height: 0;
  width: 0;
}

</style>
