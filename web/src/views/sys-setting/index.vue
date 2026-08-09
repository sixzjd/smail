<template>
  <div class="settings-container">
    <div class="loading" :class="firstLoading ? 'loading-show' : 'loading-hide'">
      <loading/>
    </div>
    <div class="scroll" v-if="!firstLoading">
      <div class="scroll-body">
        <div class="card-grid">
          <!-- Website Settings Card -->
          <div class="settings-card">
            <div class="card-title">{{ $t('websiteSetting') }}</div>
            <div class="card-content">
              <div class="setting-item">
                <div><span>{{ $t('websiteReg') }}</span></div>
                <div><s-switch v-model="registerBool" @update:modelValue="onToggleChange"/></div>
              </div>
              <div class="setting-item">
                <div><span>{{ $t('loginDomain') }}</span></div>
                <div><s-switch v-model="loginDomainBool" @update:modelValue="onToggleChange"/></div>
              </div>
              <div class="setting-item">
                <div><span>{{ $t('regKey') }}</span></div>
                <div>
                  <s-select @change="change" :style="`width: ${ locale === 'en' ? 75 : 65 }px;`"
                      v-model="setting.register" :options="regKeyOptions"/>
                </div>
              </div>
              <div class="setting-item">
                <div><span>{{ $t('addAccount') }}</span></div>
                <div><s-switch v-model="addEmailBool" @update:modelValue="onToggleChange"/></div>
              </div>
              <div class="setting-item">
                <div>
                  <span>{{ $t('multipleEmail') }}</span>
                  <s-tooltip :content="$t('multipleEmailDesc')">
                    <Icon class="warning" icon="fe:warning" width="18" height="18"/>
                  </s-tooltip>
                </div>
                <div><s-switch v-model="manyEmailBool" @update:modelValue="onToggleChange"/></div>
              </div>
              <div class="setting-item">
                <div><span>{{ $t('emailPrefix') }}</span></div>
                <div class="forward">
                  <s-button class="opt-button" size="sm" type="ghost" @click="openEmailPrefix">
                    <Icon icon="fluent:settings-48-regular" width="18" height="18"/>
                  </s-button>
                </div>
              </div>
            </div>
          </div>

          <!-- Personalization Settings Card -->
          <div class="settings-card">
            <div class="card-title">{{ $t('customization') }}</div>
            <div class="card-content">
              <div class="setting-item">
                <div class="title-item"><span>{{ $t('websiteTitle') }}</span></div>
                <div class="email-title">
                  <span>{{ setting.title }}</span>
                  <s-button class="opt-button" size="sm" type="ghost" @click="editTitleShow = true">
                    <Icon icon="lsicon:edit-outline" width="16" height="16"/>
                  </s-button>
                </div>
              </div>
              <div class="setting-item">
                <div class="title-item"><span>{{ $t('loginBoxOpacity') }}</span></div>
                <div>
                  <s-input-number v-model="loginOpacity" @update:modelValue="opacityChange" :step="0.01" :max="1" :min="0"/>
                </div>
              </div>
              <div class="setting-item">
                <div class="title-item"><span>{{ $t('backgroundDarken') }}</span></div>
                <div>
                  <s-input-number v-model="loginDarkenFactor" @update:modelValue="darkenChange" :step="0.01" :max="1" :min="0"/>
                </div>
              </div>
              <div class="setting-item personalized">
                <div><span>{{ $t('loginBackground') }}</span></div>
                <div>
                  <img class="background" :src="cvtR2Url(setting.background)" alt="background" @error="$event.target.style.display='none'"/>
                  <div class="background-btn">
                    <s-button class="opt-button" size="sm" type="ghost" @click="openSetBackground">
                      <Icon icon="lsicon:edit-outline" width="16" height="16"/>
                    </s-button>
                    <s-button class="opt-button" size="sm" type="ghost" @click="delBackground">
                      <Icon icon="material-symbols:delete-outline-rounded" width="16" height="16"/>
                    </s-button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Email Sending Settings Card -->
          <div class="settings-card">
            <div class="card-title">{{ $t('emailSetting') }}</div>
            <div class="card-content">
              <div class="setting-item">
                <div><span>{{ $t('receiveEmail') }}</span></div>
                <div><s-switch v-model="receiveBool" @update:modelValue="onToggleChange"/></div>
              </div>
              <div class="setting-item">
                <div>
                  <span>{{ $t('autoRefresh') }}</span>
                  <s-tooltip :content="$t('autoRefreshDesc')">
                    <Icon class="warning" icon="fe:warning" width="18" height="18"/>
                  </s-tooltip>
                </div>
                <div>
                  <s-select @change="change" :style="`width: ${ locale === 'en' ? 75 : 65 }px;`"
                      v-model="setting.autoRefresh" :options="authRefreshOptions"/>
                </div>
              </div>
              <div class="setting-item">
                <div><span>{{ $t('sendEmail') }}</span></div>
                <div><s-switch v-model="sendBool" @update:modelValue="onToggleChange"/></div>
              </div>
              <div class="setting-item">
                <div>
                  <span>{{ $t('noRecipientTitle') }}</span>
                  <s-tooltip :content="$t('noRecipientDesc')">
                    <Icon class="warning" icon="fe:warning" width="18" height="18"/>
                  </s-tooltip>
                </div>
                <div><s-switch v-model="noRecipientBool" @update:modelValue="onToggleChange"/></div>
              </div>
              <div class="setting-item">
                <div><span>{{ setting.hasCfEmail ? $t('cloudflareEmailSending') : $t('resendToken') }}</span></div>
                <div v-if="setting.hasCfEmail"><span>{{ $t('enabled') }}</span></div>
                <div v-else>
                  <s-button class="opt-button" @click="openResendList" size="sm" type="ghost">
                    <Icon icon="ic:round-list" width="18" height="18"/>
                  </s-button>
                  <s-button class="opt-button" @click="openResendForm" size="sm" type="ghost">
                    <Icon icon="material-symbols:add-rounded" width="16" height="16"/>
                  </s-button>
                </div>
              </div>
              <div class="setting-item">
                <div><span>{{ $t('blackList') }}</span></div>
                <div>
                  <s-button class="opt-button" @click="openBlackListForm" size="sm" type="ghost">
                    <Icon icon="fluent:settings-48-regular" width="16" height="16"/>
                  </s-button>
                </div>
              </div>
            </div>
          </div>

          <!-- Object Storage Card -->
          <div class="settings-card">
            <div class="card-title">{{ $t('oss') }}</div>
            <div class="card-content">
              <div class="r2domain-item">
                <div>
                  <span>{{ $t('osDomain') }}</span>
                  <s-tooltip :content="$t('ossDomainDesc')">
                    <Icon class="warning" icon="fe:warning" width="18" height="18"/>
                  </s-tooltip>
                </div>
                <div class="r2domain">
                  <span>{{ setting.r2Domain || '' }}</span>
                  <s-button class="opt-button" size="sm" type="ghost" @click="r2DomainShow = true">
                    <Icon icon="lsicon:edit-outline" width="16" height="16"/>
                  </s-button>
                </div>
              </div>
              <div class="setting-item">
                <div><span>{{ $t('s3Configuration') }}</span></div>
                <div class="r2domain">
                  <s-button class="opt-button" size="sm" type="ghost" @click="addS3Show = true">
                    <Icon icon="fluent:settings-48-regular" width="16" height="16"/>
                  </s-button>
                </div>
              </div>
              <div class="setting-item">
                <div><span>{{ $t('storageType') }}</span></div>
                <div class="r2domain">
                  <div class="storage-type"><s-tag>{{ setting.storageType }}</s-tag></div>
                </div>
              </div>
            </div>
          </div>

          <div class="settings-card">
            <div class="card-title">{{ $t('emailPush') }}</div>
            <div class="card-content">
              <div class="setting-item">
                <div><span>{{ $t('tgBot') }}</span></div>
                <div class="forward">
                  <span>{{ setting.tgBotStatus === 0 ? $t('enabled') : $t('disabled') }}</span>
                  <s-button class="opt-button" size="sm" type="ghost" @click="openTgSetting">
                    <Icon icon="fluent:settings-48-regular" width="18" height="18"/>
                  </s-button>
                </div>
              </div>
              <div class="setting-item">
                <div><span>{{ $t('otherEmail') }}</span></div>
                <div class="forward">
                  <span>{{ setting.forwardStatus === 0 ? $t('enabled') : $t('disabled') }}</span>
                  <s-button class="opt-button" size="sm" type="ghost" @click="openThirdEmailSetting">
                    <Icon icon="fluent:settings-48-regular" width="18" height="18"/>
                  </s-button>
                </div>
              </div>
              <div class="setting-item">
                <div><span>{{ $t('forwardingRules') }}</span></div>
                <div class="forward">
                  <span>{{ setting.ruleType === 0 ? $t('forwardAll') : $t('rules') }}</span>
                  <s-button class="opt-button" size="sm" type="ghost" @click="openForwardRules">
                    <Icon icon="fluent:settings-48-regular" width="18" height="18"/>
                  </s-button>
                </div>
              </div>
            </div>
          </div>

          <!-- Turnstile Verification Card -->
          <div class="settings-card">
            <div class="card-title">{{ $t('turnstileSetting') }}</div>
            <div class="card-content">
              <div class="setting-item">
                <div><span>{{ $t('signUpVerification') }}</span></div>
                <div>
                  <s-button class="opt-button" size="sm" type="ghost" @click="openRegVerifyCount">
                    <Icon icon="fluent:settings-48-regular" width="18" height="18"/>
                  </s-button>
                  <s-select @change="change" :style="`width: ${ locale === 'en' ? 75 : 65 }px;`"
                      v-model="setting.registerVerify" :options="verifyOptions" class="bot-verify-select"/>
                </div>
              </div>
              <div class="setting-item">
                <div><span>{{ $t('addEmailVerification') }}</span></div>
                <div>
                  <s-button class="opt-button" size="sm" type="ghost" @click="openAddVerifyCount">
                    <Icon icon="fluent:settings-48-regular" width="18" height="18"/>
                  </s-button>
                  <s-select @change="change" :style="`width: ${ locale === 'en' ? 75 : 65 }px;`"
                      v-model="setting.addEmailVerify" :options="verifyOptions" class="bot-verify-select"/>
                </div>
              </div>
              <div class="setting-item">
                <div><span>Site Key</span></div>
                <div class="bot-verify">
                  <span>{{ setting.siteKey }}</span>
                  <s-button class="opt-button" size="sm" type="ghost" @click="turnstileShow = true">
                    <Icon icon="lsicon:edit-outline" width="16" height="16"/>
                  </s-button>
                </div>
              </div>
              <div class="setting-item">
                <div><span>Secret Key</span></div>
                <div class="bot-verify">
                  <span>{{ setting.secretKey }}</span>
                  <s-button class="opt-button" size="sm" type="ghost" @click="turnstileShow = true">
                    <Icon icon="lsicon:edit-outline" width="16" height="16"/>
                  </s-button>
                </div>
              </div>
            </div>
          </div>

          <div class="settings-card">
            <div class="card-title">{{ $t('noticeTitle') }}</div>
            <div class="card-content">
              <div class="setting-item">
                <div><span>{{ $t('noticePopup') }}</span></div>
                <div class="forward">
                  <span>{{ setting.notice === 0 ? $t('enabled') : $t('disabled') }}</span>
                  <s-button class="opt-button" size="sm" type="ghost" @click="openNoticePopupSetting">
                    <Icon icon="fluent:settings-48-regular" width="18" height="18"/>
                  </s-button>
                </div>
              </div>
              <div class="setting-item">
                <div><span>{{ $t('popUp') }}</span></div>
                <div class="forward">
                  <s-button class="opt-button" size="sm" type="ghost" @click="openNoticePopup">
                    <Icon icon="mynaui:click-solid" width="18" height="18"/>
                  </s-button>
                </div>
              </div>
            </div>
          </div>

          <div class="settings-card">
            <div class="card-title">Workers AI</div>
            <div class="card-content">
              <div class="setting-item">
                <div><span>{{ $t('codeRecognition') }}</span></div>
                <div><s-switch v-model="aiCodeBool" @update:modelValue="onAiCodeToggle"/></div>
              </div>
              <div class="setting-item">
                <div><span>{{ $t('codeRecognitionRules') }}</span></div>
                <div class="forward">
                  <s-button class="opt-button" size="sm" type="ghost" @click="openAiCodeFilter">
                    <Icon icon="fluent:settings-48-regular" width="18" height="18"/>
                  </s-button>
                </div>
              </div>
            </div>
          </div>

          <div class="settings-card about">
            <div class="card-title">{{ $t('about') }}</div>
            <div class="card-content">
              <div class="concerning-item">
                <span>{{ $t('version') }} :</span>
                <s-badge :dot="hasUpdate">
                  <s-button @click="jump('https://github.com/sixzjd/smail/releases')">
                    {{ currentVersion }}
                  </s-button>
                </s-badge>
              </div>
              <div class="concerning-item">
                <span>{{ $t('community') }} : </span>
                <div class="community">
                  <s-button @click="jump('https://github.com/sixzjd/smail')">Github</s-button>
                  <s-button @click="jump('https://t.me/smail_tg')">Telegram</s-button>
                </div>
              </div>
              <div class="concerning-item">
                <span>{{ $t('support') }} : </span>
                <s-button @click="jump('/doc#sponsor')"><svg style="width:16px;height:16px;margin-right:6px;vertical-align:middle;" viewBox="0 0 24 24" fill="none" stroke="#d9543e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>{{ t('supportDesc') }}</s-button>
              </div>
              <div class="concerning-item">
                <span>{{ $t('help') }} : </span>
                <s-button @click="jump('/doc')">{{ t('document') }}</s-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Dialog 1: Edit Title -->
      <s-modal v-model="editTitleShow" :title="$t('changeTitle')" size="sm" @close="editTitle = setting.title">
        <div class="s-form">
          <s-input type="text" :placeholder="$t('websiteTitle')" v-model="editTitle"/>
          <s-button type="primary" block :loading="settingLoading" @click="saveTitle">{{ $t('save') }}</s-button>
        </div>
      </s-modal>

      <!-- Dialog 2: Resend Token Form -->
      <s-modal v-model="resendTokenFormShow" :title="$t('resendToken')" size="sm" @close="cleanResendTokenForm">
        <div class="s-form">
          <div class="s-form-item">
            <label>{{ $t('domain') }}</label>
            <s-select v-model="resendTokenForm.domain" :options="domainSelectOptions"/>
          </div>
          <s-input type="text" :placeholder="$t('addResendTokenDesc')" v-model="resendTokenForm.token"/>
          <s-button type="primary" block :loading="settingLoading" @click="saveResendToken">{{ $t('save') }}</s-button>
        </div>
      </s-modal>

      <!-- Dialog 3: R2 Domain -->
      <s-modal v-model="r2DomainShow" :title="$t('addOsDomain')" size="sm" @close="r2DomainInput = setting.r2Domain">
        <div class="s-form">
          <s-input type="text" :placeholder="$t('domainDesc')" v-model="r2DomainInput"/>
          <s-button type="primary" block :loading="settingLoading" @click="saveR2domain">{{ $t('save') }}</s-button>
        </div>
      </s-modal>

      <!-- Dialog 4: Turnstile -->
      <s-modal v-model="turnstileShow" :title="$t('addTurnstileSecret')" size="sm" @close="turnstileForm.secretKey = '';turnstileForm.siteKey = ''">
        <div class="s-form">
          <s-input type="text" placeholder="Site Key" v-model="turnstileForm.siteKey"/>
          <s-input type="text" placeholder="Secret Key" v-model="turnstileForm.secretKey"/>
          <s-button type="primary" block :loading="settingLoading" @click="saveTurnstileKey">{{ $t('save') }}</s-button>
        </div>
      </s-modal>

      <!-- Dialog 5: Set Background -->
      <s-modal v-model="showSetBackground" :title="$t('backgroundTitle')" size="lg" @close="closedSetBackground">
        <div>
          <s-tooltip :content="$t('backgroundWarning')">
            <Icon class="warning" icon="fe:warning" width="18" height="18"/>
          </s-tooltip>
        </div>
        <s-input :placeholder="$t('backgroundUrlDesc')" v-model="backgroundUrl" v-if="!localUpShow" class="background-url"/>
        <img v-if="localUpShow" class="cropper" :src="backgroundImage" alt="background"/>
        <div class="cut-button">
          <s-button type="ghost" @click="openCut" v-if="!localUpShow">{{ $t('localUpload') }}</s-button>
          <s-button type="ghost" @click="localUpShow = false" v-if="localUpShow">{{ $t('imageLink') }}</s-button>
          <s-button type="primary" :loading="settingLoading" @click="saveBackground">{{ $t('save') }}</s-button>
        </div>
      </s-modal>

      <!-- Dialog 6: Telegram Bot -->
      <s-modal v-model="tgSettingShow" :title="$t('tgBot')" size="md">
        <div class="forward-set-body">
          <div class="forward-head">
            <s-tooltip :content="$t('tgBotDesc')">
              <Icon class="warning" icon="fe:warning" width="18" height="18"/>
            </s-tooltip>
          </div>
          <s-input :placeholder="setting.tgBotToken || $t('tgBotToken')" v-model="tgBotToken"/>
          <s-input-tag tag-type="warning" :placeholder="$t('toBotTokenDesc')" v-model="tgChatId" @add-tag="addChatTag"/>
          <s-input :placeholder="$t('customDomainDesc')" v-model="customDomain"/>
          <div class="tg-msg-label">
            <span>{{t('from')}}</span>
            <s-select v-model="tgMsgFrom" :options="tgMsgFromOption"/>
          </div>
          <div class="tg-msg-label">
            <span>{{t('recipient')}}</span>
            <s-select v-model="tgMsgTo" :options="tgMsgToOption"/>
          </div>
          <div class="tg-msg-label">
            <span>{{t('emailText')}}</span>
            <s-select v-model="tgMsgText" :options="tgMsgTextOption"/>
          </div>
        </div>
        <template #footer>
          <div class="dialog-footer">
            <s-switch v-model="tgBotEnabled"/>
            <s-button :loading="settingLoading" type="primary" @click="tgBotSave">{{ $t('save') }}</s-button>
          </div>
        </template>
      </s-modal>

      <!-- Dialog 7: Third Email -->
      <s-modal v-model="thirdEmailShow" :title="$t('otherEmail')" size="md">
        <div class="forward-set-body">
          <div class="forward-head">
            <s-tooltip :content="$t('otherEmailDesc')">
              <Icon class="warning" icon="fe:warning" width="18" height="18"/>
            </s-tooltip>
          </div>
          <s-input-tag tag-type="warning" :placeholder="$t('otherEmailInputDesc')" v-model="forwardEmail" @add-tag="emailAddTag"/>
        </div>
        <template #footer>
          <div class="dialog-footer">
            <s-switch v-model="forwardEnabled"/>
            <s-button :loading="settingLoading" type="primary" @click="forwardEmailSave">{{ $t('save') }}</s-button>
          </div>
        </template>
      </s-modal>

      <!-- Dialog 8: Forward Rules -->
      <s-modal v-model="forwardRulesShow" :title="$t('forwardingRules')" size="md">
        <div class="forward-set-body">
          <div class="forward-head">
            <s-tooltip :content="$t('forwardingRulesDesc')">
              <Icon class="warning" icon="fe:warning" width="18" height="18"/>
            </s-tooltip>
          </div>
          <s-input-tag :placeholder="$t('ruleEmailsInputDesc')" tag-type="success" v-model="ruleEmail" @add-tag="ruleEmailAddTag"/>
        </div>
        <template #footer>
          <div class="dialog-footer">
            <s-radio-group v-model="ruleType" :options="[{label:$t('forwardAll'),value:0},{label:$t('rules'),value:1}]"/>
            <s-button :loading="settingLoading" type="primary" @click="ruleEmailSave">{{ $t('save') }}</s-button>
          </div>
        </template>
      </s-modal>

      <!-- Dialog 9: Resend List -->
      <s-modal v-model="showResendList" :title="$t('resendTokenList')" size="md">
        <s-table :columns="resendColumns" :data="resendList" rowKey="key"/>
      </s-modal>

      <!-- Dialog 10: Reg Verify Count -->
      <s-modal v-model="regVerifyCountShow" :title="$t('rulesVerifyTitle',{count: regVerifyCount})" size="sm" @close="regVerifyCount = setting.regVerifyCount">
        <div class="s-form">
          <s-input-number v-model="regVerifyCount" :min="1"/>
          <s-button type="primary" block :loading="settingLoading" @click="saveRegVerifyCount">{{ $t('save') }}</s-button>
        </div>
      </s-modal>

      <!-- Dialog 11: Add Verify Count -->
      <s-modal v-model="addVerifyCountShow" :title="$t('rulesVerifyTitle',{count: addVerifyCount})" size="sm" @close="addVerifyCount = setting.addVerifyCount">
        <div class="s-form">
          <s-input-number v-model="addVerifyCount" :min="1"/>
          <s-button type="primary" block :loading="settingLoading" @click="saveAddVerifyCount">{{ $t('save') }}</s-button>
        </div>
      </s-modal>

      <!-- Dialog 12: Notice Popup -->
      <s-modal v-model="noticePopupShow" :title="$t('noticePopup')" size="xl" @close="resetNoticeForm">
        <div class="s-form">
          <s-input v-model="noticeForm.noticeTitle" :placeholder="t('titleDesc')"/>
          <div class="notice-line-item">
            <div class="s-form-item">
              <label>{{ $t('icon') }}</label>
              <s-select v-model="noticeForm.noticeType" :options="noticeTypeOptions"/>
            </div>
            <div class="s-form-item">
              <label>{{ $t('position') }}</label>
              <s-select v-model="noticeForm.noticePosition" :options="noticePositionOptions"/>
            </div>
            <div class="s-form-item">
              <label>{{ $t('width') }} (px)</label>
              <s-input-number v-model="noticeForm.noticeWidth"/>
            </div>
            <div class="s-form-item">
              <label>{{ $t('offset') }} (px)</label>
              <s-input-number v-model="noticeForm.noticeOffset"/>
            </div>
            <div class="s-form-item">
              <label>{{ $t('duration') }} (ms)</label>
              <s-input-number v-model="noticeForm.noticeDuration"/>
            </div>
          </div>
          <div class="notice-popup-item">
            <s-input v-model="noticeForm.noticeContent" type="textarea" :rows="15" :placeholder="t('noticeContentDesc')"/>
          </div>
        </div>
        <template #footer>
          <div class="dialog-footer">
            <s-switch v-model="noticeEnabled"/>
            <div>
              <s-button @click="previewNoticePopup">{{ $t('preview') }}</s-button>
              <s-button :loading="settingLoading" type="primary" @click="saveNoticePopup">{{ $t('save') }}</s-button>
            </div>
          </div>
        </template>
      </s-modal>

      <!-- Dialog 13: S3 Config -->
      <s-modal v-model="addS3Show" :title="t('s3Configuration')" size="sm" @close="resetAddS3Form">
        <div class="s-form">
          <s-input type="text" placeholder="Bucket" v-model="s3.bucket"/>
          <s-input type="text" placeholder="Endpoint" v-model="s3.endpoint"/>
          <s-input type="text" placeholder="Region" v-model="s3.region"/>
          <s-input type="text" :placeholder="setting.s3AccessKey || 'Access Key'" v-model="s3.s3AccessKey"/>
          <s-input type="text" :placeholder="setting.s3SecretKey || 'Secret Key'" v-model="s3.s3SecretKey"/>
          <div class="force-path-style">
            <div class="force-path-style-left">
              <span>ForcePathStyle</span>
              <s-tooltip :content="$t('forcePathStyleDesc')">
                <Icon class="warning" icon="fe:warning" width="18" height="18"/>
              </s-tooltip>
            </div>
            <s-switch v-model="forcePathStyleBool"/>
          </div>
          <div class="s3-button">
            <s-button :loading="clearS3Loading" @click="clearS3">{{ t('clear') }}</s-button>
            <s-button type="primary" :loading="settingLoading && !clearS3Loading" @click="saveS3">{{ t('save') }}</s-button>
          </div>
        </div>
      </s-modal>

      <!-- Dialog 14: Email Prefix -->
      <s-modal v-model="emailPrefixShow" :title="t('emailPrefix')" size="sm" @close="resetEmailPrefix">
        <div class="email-prefix">
          <div>{{ t('atLeast') }}</div>
          <s-input-number v-model="minEmailPrefix" :min="1" :max="20" style="width: 150px"/>
        </div>
        <div class="prefix-filter">
          <div style="margin-bottom: 10px;">{{ t('mustNotContain') }}</div>
          <s-input-tag style="margin-bottom: 10px;" v-model="emailPrefixFilter"/>
        </div>
        <s-button type="primary" block :loading="settingLoading" @click="saveEmailPrefix">{{ $t('save') }}</s-button>
      </s-modal>

      <!-- Dialog 15: Black List -->
      <s-modal v-model="blackFormShow" :title="$t('blackList')" size="md" @close="resetBlackList">
        <div class="forward-head" style="margin-bottom:12px">
          <s-tooltip :content="$t('blackListDesc')">
            <Icon class="warning" icon="fe:warning" width="18" height="18"/>
          </s-tooltip>
        </div>
        <div class="s-form">
          <div class="s-form-item">
            <label>{{ t('blackFromDesc') }}</label>
            <s-input-tag v-model="blackListForm.blackFrom" @add-tag="banEmailAddTag"/>
          </div>
          <div class="s-form-item">
            <label>{{ t('blackSubjectDesc') }}</label>
            <s-input-tag v-model="blackListForm.blackSubject"/>
          </div>
          <div class="s-form-item">
            <label>{{ t('blackContentDesc') }}</label>
            <s-input-tag v-model="blackListForm.blackContent"/>
          </div>
          <s-button type="primary" block :loading="settingLoading" @click="saveBlackList">{{ $t('save') }}</s-button>
        </div>
      </s-modal>

      <!-- Dialog 16: AI Code Filter -->
      <s-modal v-model="aiCodeFilterShow" :title="$t('codeRecognitionRules')" size="md" @close="resetAiCodeFilter">
        <div class="forward-head" style="margin-bottom:12px">
          <s-tooltip :content="$t('codeRecognitionRulesDesc')">
            <Icon class="warning" icon="fe:warning" width="18" height="18"/>
          </s-tooltip>
        </div>
        <div class="s-form">
          <div class="s-form-item">
            <label>{{ t('senderRules') }}</label>
            <s-input-tag v-model="aiCodeFilter" @add-tag="aiCodeFilterAddTag"/>
          </div>
          <s-button type="primary" block :loading="settingLoading" @click="saveAiCodeFilter">{{ $t('save') }}</s-button>
        </div>
      </s-modal>
    </div>
  </div>
</template>

<script setup>
import {computed, defineOptions, nextTick, reactive, ref} from "vue";
import {deleteBackground, setBackground, setBlackList, settingQuery, settingSet} from "@/request/setting.js";
import {useSettingStore} from "@/store/setting.js";
import {useUiStore} from "@/store/ui.js";
import {useUserStore} from "@/store/user.js";
import {useAccountStore} from "@/store/account.js";
import {Icon} from "@iconify/vue";
import {cvtR2Url} from "@/utils/convert.js";
import {storeToRefs} from "pinia";
import {debounce} from 'lodash-es'
import {isDomain, isEmail} from "@/utils/verify-utils.js";
import loading from "@/components/loading/index.vue";
import {getTextWidth} from "@/utils/text.js";
import {fileToBase64} from "@/utils/file-utils.js"
import {useI18n} from 'vue-i18n';
import axios from "axios";
import {toast} from '@/components/ui/toast.js';
import {confirm} from '@/components/ui/confirm.js';

defineOptions({
  name: 'sys-setting'
})

const currentVersion = 'v3.0.0'
const hasUpdate = ref(false)
let getUpdateErrorCount = 1;
const {t, locale} = useI18n();
const firstLoading = ref(true)
const settingReady = ref(false)
const backgroundImage = ref('')
const localUpShow = ref(false)
const accountStore = useAccountStore();
const userStore = useUserStore();
const editTitleShow = ref(false)
const resendTokenFormShow = ref(false)
const blackFormShow = ref(false)
const aiCodeFilterShow = ref(false)
const r2DomainShow = ref(false)
const turnstileShow = ref(false)
const tgSettingShow = ref(false)
const noticePopupShow = ref(false)
const thirdEmailShow = ref(false)
const forwardRulesShow = ref(false)
const emailPrefixShow = ref(false)
const showResendList = ref(false)
const settingStore = useSettingStore();
const uiStore = useUiStore();
const {settings: setting} = storeToRefs(settingStore);
const editTitle = ref('')
const settingLoading = ref(false)
const clearS3Loading = ref(false)
const r2DomainInput = ref('')
const loginOpacity = ref(0)
const loginDarkenFactor = ref(0)
const minEmailPrefix = ref(0)
const emailPrefixFilter = ref([])
const backgroundUrl = ref('')
let backgroundFile = {}
const showSetBackground = ref(false)
let regVerifyCount = ref(1)
let addVerifyCount = ref(1)
let backup = '{}'
const addS3Show = ref(false)
const addVerifyCountShow = ref(false)
const regVerifyCountShow = ref(false)
const resendTokenForm = reactive({
  domain: '',
  token: '',
})
const turnstileForm = reactive({
  siteKey: '',
  secretKey: ''
})

const s3 = reactive({
  bucket: '',
  endpoint: '',
  region: '',
  s3AccessKey: '',
  s3SecretKey: '',
  forcePathStyle: 1
})

const noticeForm = reactive({
  noticeTitle: '',
  noticeContent: '',
  noticeType: '',
  noticeDuration: '',
  noticePosition: '',
  noticeOffset: 0,
  notice: 0,
  noticeWidth: 0
})

const regKeyOptions = computed(() => [
  {label: t('enable'), value: 0},
  {label: t('disable'), value: 1},
  {label: t('optional'), value: 2},
])

const verifyOptions = computed(() => [
  {label: t('enable'), value: 0},
  {label: t('disable'), value: 1},
  {label: t('rulesVerify'), value: 2},
])

const blackListForm = ref({
  blackSubject: [],
  blackContent: [],
  blackFrom: []
})
const aiCodeFilter = ref([])

const authRefreshOptions = computed(() => [
  {label: t('disable'), value: 0},
  {label: '3s', value: 3},
  {label: '5s', value: 5},
  {label: '10s', value: 10},
  {label: '15s', value: 15},
  {label: '20s', value: 20},
])

const domainSelectOptions = computed(() => settingStore.domainList.map(d => ({label: d, value: d})))

const noticeTypeOptions = computed(() => [
  {label: 'None', value: 'none'},
  {label: 'Primary', value: 'primary'},
  {label: 'Success', value: 'success'},
  {label: 'Warning', value: 'warning'},
  {label: 'Info', value: 'info'}
])

const noticePositionOptions = computed(() => [
  {label: t('topLeft'), value: 'top-left'},
  {label: t('topRight'), value: 'top-right'},
  {label: t('bottomLeft'), value: 'bottom-left'},
  {label: t('bottomRight'), value: 'bottom-right'}
])

const tgChatId = ref([])
const customDomain = ref('')
const tgBotStatus = ref(0)
const tgBotToken = ref('')
const forwardEmail = ref([])
const forwardStatus = ref(0)
const emailColumnWidth = ref(0)
const tokenColumnWidth = ref(0)
const ruleType = ref(0)
const ruleEmail = ref([])
const tgMsgFrom = ref('')
const tgMsgTo = ref('')
const tgMsgText = ref('')

const tgMsgFromOption = [{label: t('show'), value: 'show'}, {label: t('hide'), value: 'hide'}, {label: t('onlyName'), value:'only-name'}]
const tgMsgToOption = [{label: t('show'), value: 'show'}, {label: t('hide'), value: 'hide'}]
const tgMsgTextOption = [{label: t('show'), value: 'show'}, {label: t('hide'), value: 'hide'}]
const tgMsgLabelWidth = computed(() => locale.value === 'en' ? '120px' : '100px');

// Boolean computed properties for s-switch (0=enabled, 1=disabled)
const registerBool = computed({get: () => setting.value.register === 0, set: v => { setting.value.register = v ? 0 : 1 }})
const loginDomainBool = computed({get: () => setting.value.loginDomain === 1, set: v => { setting.value.loginDomain = v ? 1 : 0 }})
const addEmailBool = computed({get: () => setting.value.addEmail === 0, set: v => { setting.value.addEmail = v ? 0 : 1 }})
const manyEmailBool = computed({get: () => setting.value.manyEmail === 0, set: v => { setting.value.manyEmail = v ? 0 : 1 }})
const receiveBool = computed({get: () => setting.value.receive === 0, set: v => { setting.value.receive = v ? 0 : 1 }})
const sendBool = computed({get: () => setting.value.send === 0, set: v => { setting.value.send = v ? 0 : 1 }})
const noRecipientBool = computed({get: () => setting.value.noRecipient === 0, set: v => { setting.value.noRecipient = v ? 0 : 1 }})
const aiCodeBool = computed({get: () => setting.value.aiCode === 0, set: v => { setting.value.aiCode = v ? 0 : 1 }})
const tgBotEnabled = computed({get: () => tgBotStatus.value === 0, set: v => { tgBotStatus.value = v ? 0 : 1 }})
const forwardEnabled = computed({get: () => forwardStatus.value === 0, set: v => { forwardStatus.value = v ? 0 : 1 }})
const noticeEnabled = computed({get: () => noticeForm.notice === 0, set: v => { noticeForm.notice = v ? 0 : 1 }})
const forcePathStyleBool = computed({get: () => s3.forcePathStyle === 0, set: v => { s3.forcePathStyle = v ? 0 : 1 }})

const resendColumns = computed(() => [
  {prop: 'key', label: t('domain'), width: emailColumnWidth.value ? emailColumnWidth.value + 'px' : undefined},
  {prop: 'value', label: 'Token', width: tokenColumnWidth.value ? tokenColumnWidth.value + 'px' : undefined}
])

getSettings()
getUpdate()

function onToggleChange() {
  if (!settingReady.value || settingLoading.value) return
  backupSetting()
  change()
}

function onAiCodeToggle() {
  if (!settingReady.value || settingLoading.value) return
  backupSetting()
  changeField('aiCode', setting.value.aiCode)
}

function getSettings() {
  settingReady.value = false
  settingQuery().then(settingData => {
    setting.value = settingData
    settingStore.domainList = settingData.domainList;
    resendTokenForm.domain = setting.value.domainList[0]
    loginOpacity.value = setting.value.loginOpacity
    loginDarkenFactor.value = normalizeFactor(setting.value.loginDarkenFactor)
    minEmailPrefix.value = setting.value.minEmailPrefix
    firstLoading.value = false
    backgroundUrl.value = setting.value.background?.startsWith('http') ? setting.value.background : ''
    editTitle.value = setting.value.title
    r2DomainInput.value = setting.value.r2Domain
    addVerifyCount.value = setting.value.addVerifyCount
    regVerifyCount.value = setting.value.regVerifyCount
    resetNoticeForm()
    resetAddS3Form()
    resetEmailPrefix()
    resetBlackList()
    resetAiCodeFilter()
    nextTick(() => {
      settingReady.value = true
    })
  })
}


function openNoticePopup() {
  uiStore.showNotice()
}

function openAddVerifyCount() {
  if (settingLoading.value) return
  addVerifyCountShow.value = true
}

function openRegVerifyCount() {
  if (settingLoading.value) return
  regVerifyCountShow.value = true
}

function resetAddS3Form() {
  s3.bucket = setting.value.bucket
  s3.endpoint = setting.value.endpoint
  s3.region = setting.value.region
  s3.s3AccessKey = ''
  s3.s3SecretKey = ''
  s3.forcePathStyle = setting.value.forcePathStyle
}

const resendList = computed(() => {

  let list = Object.keys(setting.value.resendTokens).map(key => {
    return {
      key: key,
      value: setting.value.resendTokens[key]
    };
  })

  if (list.length > 0) {

    const key = list.reduce((a, b) => compareByLengthAndUpperCase(a, b, 'key')).key;
    emailColumnWidth.value = getTextWidth(key) + 30;

    const value = list.reduce((a, b) => compareByLengthAndUpperCase(a, b, 'value')).value;
    tokenColumnWidth.value = getTextWidth(value) + 30;

  }

  return list;
});

function getUpdate() {
  if (getUpdateErrorCount > 5 || !getUpdateErrorCount) return
  axios.get('https://api.github.com/repos/sixzjd/smail/releases/latest').then(({data}) => {
    hasUpdate.value = data.name !== currentVersion
    getUpdateErrorCount = 0
  }).catch(e => {
    getUpdateErrorCount++
    setTimeout(() => {
      getUpdate()
    }, 2000)
    console.error('检查更新失败：', e)
  })
}

function saveAddVerifyCount() {
  if (!addVerifyCount.value) {
    addVerifyCount.value = 1
  }
  editSetting({addVerifyCount: addVerifyCount.value})
}

function saveRegVerifyCount() {
  if (!regVerifyCount.value) {
    regVerifyCount.value = 1
  }
  editSetting({regVerifyCount: regVerifyCount.value})
}

const compareByLengthAndUpperCase = (a, b, key) => {
  const getUpperCaseCount = (str) => (str.match(/[A-Z]/g) || []).length;
  if (a[key].length === b[key].length) {
    return getUpperCaseCount(a[key]) > getUpperCaseCount(b[key]) ? a : b;
  }
  return a[key].length > b[key].length ? a : b;
};


function closedSetBackground() {
  backgroundImage.value = ''
  localUpShow.value = false
  backgroundUrl.value = setting.value.background?.startsWith('http') ? setting.value.background : ''
}

function openTgSetting() {
  tgBotStatus.value = setting.value.tgBotStatus
  tgBotToken.value = ''
  customDomain.value = setting.value.customDomain
  tgMsgFrom.value = setting.value.tgMsgFrom
  tgMsgText.value = setting.value.tgMsgText
  tgMsgTo.value = setting.value.tgMsgTo
  tgChatId.value = []
  if (setting.value.tgChatId) {
    const list = setting.value.tgChatId.split(',')
    tgChatId.value.push(...list)
  }
  tgSettingShow.value = true
}

function openNoticePopupSetting() {
  noticePopupShow.value = true
}

function openResendList() {
  showResendList.value = true
}

function resetNoticeForm() {
  noticeForm.notice = setting.value.notice
  noticeForm.noticeContent = setting.value.noticeContent
  noticeForm.noticeDuration = setting.value.noticeDuration
  noticeForm.noticeTitle = setting.value.noticeTitle
  noticeForm.noticePosition = setting.value.noticePosition
  noticeForm.noticeType = setting.value.noticeType
  noticeForm.noticeOffset = setting.value.noticeOffset
  noticeForm.noticeWidth = setting.value.noticeWidth
}

function saveNoticePopup() {
  noticeForm.noticeOffset = noticeForm.noticeOffset || 0
  noticeForm.noticeWidth = noticeForm.noticeWidth || 0
  noticeForm.noticeDuration = noticeForm.noticeDuration || 0
  editSetting({...noticeForm})
}

function previewNoticePopup() {
  uiStore.previewNotice({...noticeForm})
}

function openThirdEmailSetting() {
  forwardEmail.value = []
  forwardStatus.value = setting.value.forwardStatus
  if (setting.value.forwardEmail) {
    const list = setting.value.forwardEmail.split(',')
    forwardEmail.value.push(...list)
  }
  thirdEmailShow.value = true
}

function openEmailPrefix() {
  emailPrefixShow.value = true
}

function openForwardRules() {
  ruleType.value = setting.value.ruleType
  ruleEmail.value = []
  if (setting.value.ruleEmail) {
    const list = setting.value.ruleEmail.split(',')
    ruleEmail.value.push(...list)
  }
  forwardRulesShow.value = true
}

function emailAddTag(val) {
  const emails = Array.from(new Set(
      val.split(/[,，]/).map(item => item.trim()).filter(item => item)
  ));

  forwardEmail.value.splice(forwardEmail.value.length - 1, 1)

  emails.forEach(email => {
    if (isEmail(email) && !forwardEmail.value.includes(email)) {
      forwardEmail.value.push(email)
    }
  })
}

function ruleEmailAddTag(val) {
  const emails = Array.from(new Set(
      val.split(/[,，]/).map(item => item.trim()).filter(item => item)
  ));

  ruleEmail.value.splice(ruleEmail.value.length - 1, 1)

  emails.forEach(email => {
    if (isEmail(email) && !ruleEmail.value.includes(email)) {
      ruleEmail.value.push(email)
    }
  })
}

function addChatTag(val) {

  const chatIds = Array.from(new Set(
      val.split(/[,，]/).map(item => item.trim()).filter(item => item)
  ));

  tgChatId.value.splice(tgChatId.value.length - 1, 1)

  chatIds.forEach(id => {
    if (!isNaN(Number(id))) {
      tgChatId.value.push(id)
    }
  })
}

function clearS3() {

  const form = {
    bucket: '',
    endpoint: '',
    region: '',
    s3AccessKey: '',
    s3SecretKey: '',
    forcePathStyle: 1
  }
  clearS3Loading.value = true
  editSetting(form)
}

function saveS3() {

  const form = {
    bucket: s3.bucket,
    endpoint: s3.endpoint,
    region: s3.region,
    forcePathStyle: s3.forcePathStyle
  }

  if (s3.s3AccessKey) form.s3AccessKey = s3.s3AccessKey
  if (s3.s3SecretKey) form.s3SecretKey = s3.s3SecretKey

  editSetting(form)
}

function tgBotSave() {
  const form = {
    customDomain: customDomain.value,
    tgBotStatus: tgBotStatus.value,
    tgChatId: tgChatId.value + '',
    tgMsgFrom: tgMsgFrom.value,
    tgMsgText: tgMsgText.value,
    tgMsgTo: tgMsgTo.value
  }
  if (tgBotToken.value) form.tgBotToken = tgBotToken.value
  editSetting(form)
}

function forwardEmailSave() {
  const form = {
    forwardStatus: forwardStatus.value,
    forwardEmail: forwardEmail.value + ''
  }
  editSetting(form)
}


function ruleEmailSave() {
  const form = {
    ruleEmail: ruleEmail.value + '',
    ruleType: ruleType.value
  }
  editSetting(form)
}

function doOpacityChange() {
  if (!settingReady.value) return
  const form = {}
  form.loginOpacity = loginOpacity.value
  editSetting(form, true)
}

function normalizeFactor(value) {
  const factor = Number(value ?? 0)
  if (Number.isNaN(factor)) return 0
  return Math.min(1, Math.max(0, factor))
}

function doDarkenChange() {
  if (!settingReady.value) return
  const form = {}
  form.loginDarkenFactor = normalizeFactor(loginDarkenFactor.value)
  editSetting(form, true)
}

function resetEmailPrefix() {
  minEmailPrefix.value = setting.value.minEmailPrefix
  emailPrefixFilter.value = setting.value.emailPrefixFilter
}

function resetBlackList() {
  blackListForm.value.blackFrom = setting.value.blackFrom ? setting.value.blackFrom.split(',') : []
  blackListForm.value.blackContent = setting.value.blackContent ? setting.value.blackContent.split(',') : []
  blackListForm.value.blackSubject = setting.value.blackSubject ? setting.value.blackSubject.split(',') : []
}

function resetAiCodeFilter() {
  aiCodeFilter.value = setting.value.aiCodeFilter ? setting.value.aiCodeFilter.split(',') : []
}

function saveEmailPrefix() {
  const form = {}
  form.minEmailPrefix = minEmailPrefix.value
  form.emailPrefixFilter = emailPrefixFilter.value
  editSetting(form, true)
}

function saveAiCodeFilter() {
  editSetting({aiCodeFilter: aiCodeFilter.value + ''})
}

const opacityChange = debounce(doOpacityChange, 1000, {
  leading: false,
  trailing: true
})

const darkenChange = debounce(doDarkenChange, 1000, {
  leading: false,
  trailing: true
})

function saveBlackList() {

  let form = {
    blackContent: blackListForm.value.blackContent + '',
    blackSubject: blackListForm.value.blackSubject + '',
    blackFrom: blackListForm.value.blackFrom + ''
  }

  settingLoading.value = true

  setBlackList(form).then(() => {
    getSettings()
    toast(t('setSuccess'), 'success')
    blackFormShow.value = false;
  }).finally(() => {
    settingLoading.value = false;
  })
}

function banEmailAddTag(val) {
  const emails = Array.from(new Set(
      val.split(/[,，]/).map(item => item.trim()).filter(item => item)
  ));

  blackListForm.value.blackFrom.splice(blackListForm.value.blackFrom.length - 1, 1)

  emails.forEach(email => {
    if ((isEmail(email) || isDomain(email)) && !blackListForm.value.blackFrom.includes(email)) {
      blackListForm.value.blackFrom.push(email)
    }
  })
}

function aiCodeFilterAddTag(val) {
  const emails = Array.from(new Set(
      val.split(/[,，]/).map(item => item.trim()).filter(item => item)
  ));

  aiCodeFilter.value.splice(aiCodeFilter.value.length - 1, 1)

  emails.forEach(email => {
    if ((isEmail(email) || isDomain(email)) && !aiCodeFilter.value.includes(email)) {
      aiCodeFilter.value.push(email)
    }
  })
}


async function delBackground() {
  const ok = await confirm(t('delBackgroundConfirm'))
  if (ok) {
    deleteBackground().then(() => {
      backgroundUrl.value = ''
      setting.value.background = null
      toast(t('delSuccessMsg'), 'success')
    })
  }
}

function saveTurnstileKey() {
  const settingForm = {}
  settingForm.siteKey = turnstileForm.siteKey
  settingForm.secretKey = turnstileForm.secretKey
  editSetting(settingForm)
}

async function saveBackground() {

  let image = ''

  if (localUpShow.value) {
    image = await fileToBase64(backgroundFile, true);
  } else {
    if (backgroundUrl.value && !backgroundUrl.value.startsWith('http')) {
      toast(t('imageLinkErrorMsg'), 'error')
      return
    }
    image = backgroundUrl.value
  }
  settingLoading.value = true

  setBackground(image).then(key => {
    setting.value.background = key
    showSetBackground.value = false
    toast(t('saveSuccessMsg'), 'success')
    localUpShow.value = false
    backgroundImage.value = ''
  }).finally(() => {
    settingLoading.value = false
  })

}

function openSetBackground() {
  showSetBackground.value = true
}

function openCut() {
  const doc = document.createElement('input')
  doc.setAttribute('type', 'file')
  doc.setAttribute('accept', 'image/*')
  doc.click()
  doc.onchange = async (e) => {
    backgroundFile = e.target.files[0]
    backgroundImage.value = URL.createObjectURL(e.target.files[0])
    localUpShow.value = true
  }
}

function saveR2domain() {
  const settingForm = {r2Domain: r2DomainInput.value}
  editSetting(settingForm)
}

function openResendForm() {
  resendTokenFormShow.value = true
}

function openBlackListForm() {
  blackFormShow.value = true
}

function openAiCodeFilter() {
  aiCodeFilterShow.value = true
}

function saveResendToken() {
  const settingForm = {
    resendTokens: {}
  }
  const domain = resendTokenForm.domain.slice(1)
  settingForm.resendTokens[domain] = resendTokenForm.token
  editSetting(settingForm)
}

function backupSetting() {
  const settingForm = {...setting.value}
  delete settingForm.resendTokens
  delete settingForm.siteKey
  delete settingForm.secretKey
  backup = JSON.stringify(setting.value)
}

function cleanResendTokenForm() {
  resendTokenForm.token = ''
}

function change(e) {
  if (!settingReady.value) return
  const settingForm = {...setting.value}
  delete settingForm.siteKey
  delete settingForm.secretKey
  delete settingForm.s3AccessKey
  delete settingForm.s3SecretKey
  delete settingForm.tgBotToken
  delete settingForm.resendTokens
  editSetting(settingForm, false)
}

function changeField(key, value) {
  if (!settingReady.value) return
  setting.value[key] = value
  editSetting({[key]: value}, false)
}

function saveTitle() {
  editSetting({title: editTitle.value})
}

function jump(href) {
  const doc = document.createElement('a')
  doc.href = href
  doc.target = '_blank'
  doc.click()
}

function editSetting(settingForm, refreshStatus = true) {
  if (settingLoading.value) return
  settingLoading.value = true

  settingSet(settingForm).then(() => {
    settingLoading.value = false
    toast(t('saveSuccessMsg'), 'success')
    if (setting.value.manyEmail === 1) {
      accountStore.currentAccountId = userStore.user.account.accountId;
    }
    if (refreshStatus) {
      getSettings()
    }
    editTitleShow.value = false
    r2DomainShow.value = false
    resendTokenFormShow.value = false
    turnstileShow.value = false
    tgSettingShow.value = false
    thirdEmailShow.value = false
    forwardRulesShow.value = false
    addVerifyCountShow.value = false
    regVerifyCountShow.value = false
    noticePopupShow.value = false
    addS3Show.value = false
    emailPrefixShow.value = false
    aiCodeFilterShow.value = false
  }).catch((e) => {
    loginOpacity.value = setting.value.loginOpacity
    loginDarkenFactor.value = normalizeFactor(setting.value.loginDarkenFactor)
    setting.value = {...setting.value, ...JSON.parse(backup)}
  }).finally(() => {
    settingLoading.value = false
    clearS3Loading.value = false
  })
}
</script>

<style scoped>
.settings-container {
  height: 100%;
  background: var(--s-body);
  position: relative;
  font-family: var(--s-font-body);
  color: var(--s-ink);

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    z-index: 2;
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
  }

  .loading-show {
    transition: all 200ms ease 200ms;
    opacity: 1;
  }

  .loading-hide {
    transition: opacity 200ms ease;
    pointer-events: none;
    opacity: 0;
  }
}

.scroll {
  width: 100%;
  min-height: 100%;
  overflow-y: auto;
  height: 100%;

  .scroll-body {
    min-height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(440px, 1fr));
  padding: 20px;
  gap: 16px;
  @media (max-width: 500px) {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
  @media (max-width: 1023px) {
    gap: 14px;
    padding: 15px;
  }
}

.settings-card {
  background: var(--s-paper);
  border-radius: var(--s-radius-lg);
  border: 1px solid var(--s-line);
  transition: box-shadow var(--s-ease);

  &:hover {
    box-shadow: var(--s-shadow-sm);
  }
}

.card-title {
  font-size: 14px;
  font-weight: 700;
  font-family: var(--s-font-display);
  padding: 12px 20px;
  border-bottom: 1px solid var(--s-line);
  color: var(--s-ink);
  letter-spacing: -0.01em;
}

.card-content {
  padding: 16px 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  font-weight: normal;
  font-size: 14px;
  align-items: center;

  > div:first-child {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  > div:last-child {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: normal;
  }
}

.r2domain-item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  font-size: 14px;
  align-items: center;
  > div:first-child {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  > div:last-child {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.warning {
  margin-left: 2px;
  color: var(--s-muted);
  cursor: pointer;
}

.background {
  width: 249px;
  height: 140px;
  border-radius: var(--s-radius);
  border: 1px solid var(--s-line);
  object-fit: cover;
  @media (max-width: 500px) {
    width: 160px;
    height: 90px;
  }
}

.background-btn {
  display: flex;
  gap: 8px;
  flex-direction: column;
}

.bot-verify-select {
  margin-left: 8px;
}

.bot-verify {
  display: grid;
  grid-template-columns: 1fr auto;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  span {
    display: flex;
    align-items: center;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    min-width: 0;
  }
}

.forward {
  span {
    display: flex;
    align-items: center;
  }
}

.opt-button {
  width: fit-content !important;
  margin-left: 8px;
}

.setting-item .s-select {
  margin-right: 16px;
}

.email-title {
  font-weight: normal !important;
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr auto;
  align-items: center;

  span {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}

.r2domain {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;

  .storage-type {
    margin-right: 3px;
  }

  span {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}

.personalized {
  align-items: start;

  > div:last-child {
    display: flex;
    justify-content: end;
  }
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notice-line-item {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  > * { width: 100%; }
  @media (max-width: 840px) { grid-template-columns: 1fr 1fr; }
  @media (max-width: 580px) { grid-template-columns: 1fr; }
}

.notice-popup-item {
  margin-top: 12px;
}

.background-url {
  width: min(calc(100vw - 70px), 500px);
}

.cropper {
  border-radius: var(--s-radius);
  border: 1px solid var(--s-line);
  height: 397px;
  width: 705px;
  object-fit: cover;
  @media (max-width: 767px) {
    width: calc(100vw - 60px);
    height: calc((100vw - 60px) * 9 / 16);
  }
}

.cut-button {
  padding-top: 16px;
  width: 100%;
  display: flex;
  justify-content: space-between;
}

.forward-set-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.forward-head {
  display: flex;
  align-items: center;
}

.email-prefix {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.prefix-filter {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
}

.s3-button {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 12px;
}

.force-path-style {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  .force-path-style-left {
    padding-left: 2px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 5px;
  }
}

.concerning-item {
  display: flex;
  align-items: center;
  font-size: 14px;

  .community {
    display: flex;
    row-gap: 10px;
    flex-wrap: wrap;
    gap: 8px;
  }

  > span:first-child {
    font-weight: 600;
    padding-right: 16px;
    white-space: nowrap;
    color: var(--s-muted);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
}

.tg-msg-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  .s-select { width: v-bind(tgMsgLabelWidth); }
}

.s-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.s-form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.s-form-item label {
  font-size: 12px;
  font-weight: 600;
  color: var(--s-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>
