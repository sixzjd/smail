<p align="center">
  <img src="web/public/smail-icon.png" width="64" height="64" alt="smail logo" style="vertical-align: middle; margin-right: 12px;">
  <span style="font-size: 2.5em; font-weight: bold; vertical-align: middle;">smail</span>
</p>

<p align="center">
  <strong>基于 Cloudflare 全家桶的临时邮箱服务</strong><br/>
  <sub>从 Node.js/Express 整体迁移至 Cloudflare Workers，全球边缘部署，零功能损失</sub>
</p>

<p align="center">
  <a href="README.md">中文</a> · <a href="README.en.md">English</a>
</p>

<p align="center">
  <a href="https://mail.sixzjd.sbs" target="_blank">
    <img src="web/public/try-online-btn.svg" alt="快速体验" width="220" />
  </a>
</p>

<p align="center">
  <sub>无需部署，直接体验完整功能</sub>
</p>

<p align="center">
  <a href="https://mail.sixzjd.sbs/doc"><img src="https://img.shields.io/badge/%E6%96%87%E6%A1%A3%E7%BD%91%E7%AB%99-%E5%9C%A8%E7%BA%BF%E6%9F%A5%E7%9C%8B-3b82f6" alt="文档网站" /></a>
  <img src="https://img.shields.io/badge/Frontend-Vue%203%20%2B%20Vite%207-42b883" alt="Frontend" />
  <img src="https://img.shields.io/badge/Backend-Hono%20on%20Workers-f38020" alt="Backend" />
  <img src="https://img.shields.io/badge/ORM-Drizzle-ffc518" alt="ORM" />
  <img src="https://img.shields.io/badge/Database-Cloudflare%20D1-f6821f" alt="Database" />
  <img src="https://img.shields.io/badge/Storage-R2%20%7C%20S3%20Compatible-f6821f" alt="Storage" />
  <img src="https://img.shields.io/badge/PWA-Supported-5A0FC8" alt="PWA" />
</p>

---

## 目录

- [项目简介](#项目简介)
- [架构迁移说明](#架构迁移说明)
- [技术架构](#技术架构)
- [功能清单](#功能清单)
- [项目结构](#项目结构)
- [本地开发](#本地开发)
- [部署指南](#部署指南)
- [配置参考](#配置参考)
- [设计系统](#设计系统)

## 项目简介

smail 是一个**完全运行在 Cloudflare Edge** 上的临时邮箱服务，提供完整的邮件收发、管理、分析能力。

项目最初基于 **Node.js + Express** 构建，使用本地 SQLite 文件系统存储。为获得全球边缘部署、低延迟、免运维的能力，整个项目被完整迁移至 **Cloudflare Workers** 架构——后端从 Express 重写为 Hono，数据库从 better-sqlite3 迁移到 Cloudflare D1，文件存储迁移到 R2，会话缓存迁移到 KV。全部 **19 个功能模块完整保留**，零功能损失。

**核心特性：**
- 🌍 **全球边缘运行** — Workers/D1/KV/R2 全部部署在 Cloudflare 边缘节点，就近响应请求
- 📬 **完整邮件能力** — 收件（Workers Email Handler）、发件（Cloudflare Email / Resend）、转发、附件、收藏
- 🏗️ **前后端一体部署** — 前端由 Workers Assets 托管，后端由 Workers Runtime 处理，单次 `wrangler deploy` 完成
- 🔐 **细粒度权限** — JWT + RBAC 角色权限体系，支持域名级别控制
- 📊 **数据分析** — 收发件统计、趋势图表（ECharts），定时缓存刷新
- 🤖 **AI 集成** — 可选的 Cloudflare AI 验证码提取
- 🌙 **Editorial 设计** — 温暖的纸质质感设计系统，完整深色模式
- 📱 **PWA 支持** — 可安装为桌面/移动应用

## 架构迁移说明

```
  ┌─────────────────────────────────┐         ┌─────────────────────────────────────┐
  │     Before: Node.js 架构         │         │     After: Cloudflare 架构            │
  │                                  │         │                                      │
  │  Vue 3 ──► Nginx 静态托管        │         │  Vue 3 (Vite build)                   │
  │                                  │         │    └──► Workers Assets 边缘托管        │
  │  Express                         │         │                                      │
  │    └──► 本地路由/中间件           │    ──►  │  Hono                                │
  │                                  │         │    └──► Workers Runtime API 处理       │
  │  better-sqlite3 (文件)           │         │                                      │
  │    └──► 本地 SQLite              │    ──►  │  Cloudflare D1 (Drizzle ORM)          │
  │                                  │         │                                      │
  │  本地文件系统 (附件/缓存)        │         │  Cloudflare R2 (附件)                 │
  │                                  │    ──►  │  Cloudflare KV (会话/缓存)            │
  │                                  │         │                                      │
  │  Nodemailer (SMTP 发件)         │         │  CF Email Handler / Resend API        │
  │                                  │    ──►  │  (边缘直接发件，无需 SMTP 服务器)      │
  │  单机部署                        │         │                                      │
  │                                  │    ──►  │  全球 300+ 边缘节点自动调度            │
  └─────────────────────────────────┘         └─────────────────────────────────────┘
```

**迁移收益：**
- 无需管理服务器，零运维成本
- 全球边缘部署，请求就近响应
- D1/KV/R2 按量计费，低成本运行
- 自动扩缩容，无需担心并发

## 技术架构

```
┌──────────────────────────────────────────────────────────────┐
│                    Cloudflare Workers                         │
│                                                               │
│  ┌──────────────────────┐    ┌─────────────────────────────┐ │
│  │   Workers Assets      │    │   Hono (API Runtime)        │ │
│  │                       │    │                              │ │
│  │   Vue 3 SPA           │    │   ┌──────────┐ ┌─────────┐ │ │
│  │   (Vite 7 构建产物)   │    │   │ API 路由  │ │Security │ │ │
│  │                       │    │   │ (18 模块) │ │中间件    │ │ │
│  │   前端静态资源        │    │   └────┬─────┘ └─────────┘ │ │
│  │   由 Workers 直接     │    │        │                    │ │
│  │   边缘托管 (SPA)      │    │   ┌────▼───────────────┐   │ │
│  └──────────────────────┘    │   │   Service 层         │   │ │
│                               │   │  email / account     │   │ │
│                               │   │  user / role / perm  │   │ │
│                               │   │  analysis / ai       │   │ │
│                               │   │  setting / telegram  │   │ │
│                               │   │  r2 / s3 / resend    │   │ │
│                               │   └────┬───────────────┘   │ │
│                               │        │                    │ │
│                               │   ┌────▼───────────────┐   │ │
│                               │   │   Data Layer        │   │ │
│                               │   │  Drizzle ORM → D1   │   │ │
│                               │   │  KV (会话/缓存)     │   │ │
│                               │   │  R2 (附件/背景图)   │   │ │
│                               │   └──────────────────┘   │ │
│                               └─────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Email Handler          │  Cron Triggers                 │ │
│  │  收件入口 (PostalMime)  │  */30 min → 刷新分析缓存       │ │
│  │  黑名单过滤             │  每日 16:00 → 清理验证记录      │ │
│  │  AI 验证码提取          │           → 重置每日发件计数    │ │
│  │  邮件转发               │           → 完成未完成收件      │ │
│  │  TG 通知推送            │           → 清理未绑定 OAuth    │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### 核心依赖

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| **前端框架** | Vue 3 | 3.5+ | 组合式 API |
| **构建工具** | Vite 7 | 7.1+ | ES2022 构建目标 |
| **状态管理** | Pinia | 3.0+ | 含持久化插件 |
| **路由** | Vue Router | 4.5+ | History 模式 + NProgress |
| **图表** | ECharts | 5.6+ | 数据分析可视化 |
| **HTTP** | Axios | 1.15+ | API 请求 |
| **PWA** | vite-plugin-pwa | 1.0+ | Service Worker |
| **国际化** | vue-i18n | 11.1+ | 中/英双语 |
| **本地数据库** | Dexie | 4.0+ | IndexedDB 客户端缓存 |
| **后端框架** | Hono | 4.6+ | 轻量边缘 Web 框架 |
| **ORM** | Drizzle | 0.38+ | D1 兼容的类型安全 ORM |
| **邮件解析** | PostalMime | 2.4+ | 收件 MIME 解析 |
| **HTML 解析** | linkedom | 0.18+ | 邮件内容图片 CID 替换 |
| **发件服务** | Resend | 6.4+ | 外部邮件发送 |
| **S3 兼容** | @aws-sdk/client-s3 | 3.88+ | 可选的 S3 存储后端 |
| **日期处理** | dayjs | 1.11+ | 轻量日期库 |
| **AI** | Cloudflare AI | — | 验证码提取等 |

## 功能清单

### 📬 邮件核心

| 功能 | 说明 |
|------|------|
| **收件** | Cloudflare Email Handler 实时接收，PostalMime 解析 MIME，支持 HTML/纯文本/CC/BCC |
| **发件** | 双通道支持：Cloudflare Email（优先）或 Resend API，支持回复邮件线程 |
| **站内互发** | 同域邮箱之间直接写入数据库，无需经过外部发件服务 |
| **转发** | 收到邮件后自动转发到指定邮箱（支持多个，逗号分隔） |
| **附件** | 收件附件自动存储到 R2，发件支持普通附件 + 内嵌图片（CID 替换） |
| **收藏** | 邮件标记收藏，独立收藏列表页 |
| **草稿** | 写信草稿自动保存 |
| **批量操作** | 批量删除邮件，按条件筛选批量清理 |
| **黑名单** | 按主题/内容/发件人地址（含域名级别）过滤垃圾邮件 |
| **未读标记** | 邮件未读/已读状态管理 |
| **邮件搜索** | 按发件人名字、邮箱地址、主题搜索 |

### 👤 账户与用户系统

| 功能 | 说明 |
|------|------|
| **多账户** | 每个用户可创建多个邮箱地址，独立管理 |
| **用户注册/登录** | JWT 认证，KV 存储会话，支持多设备登录 |
| **角色权限 (RBAC)** | 角色管理 + 细粒度权限控制（20+ 权限项） |
| **域名权限** | 按角色控制可用域名范围 |
| **发件限制** | 按角色设置发件次数限制（总量/每日），支持内部发件限制 |
| **收件控制** | 按角色禁用特定发件人、控制域名使用 |
| **OAuth** | 第三方 OAuth 登录集成 |
| **注册密钥** | 邀请码注册控制（开放/关闭/可选三种模式） |
| **验证机制** | 注册/添加邮箱时的验证记录（按次数触发） |
| **用户管理** | 管理员可查看/禁用/恢复/删除用户，重置发件计数 |

### 📊 数据分析

| 功能 | 说明 |
|------|------|
| **ECharts 面板** | 收发件统计图表，趋势分析 |
| **缓存机制** | 每 30 分钟自动刷新分析缓存 |
| **每日统计** | KV 记录每日发件量，自动过期清理 |
| **全局邮件管理** | 管理员视角查看所有邮件（收件/发件/删除/无收件人） |

### ⚙️ 系统设置

| 功能 | 说明 |
|------|------|
| **全局开关** | 注册/收件/发件/添加邮箱/多邮箱 等功能独立开关 |
| **网站配置** | 标题、背景图（R2 存储）、登录页域名显示控制 |
| **发件服务** | Resend Token 按域名配置，Cloudflare Email 可选 |
| **存储配置** | R2 / S3 兼容存储切换，自定义 R2 域名 |
| **Telegram 通知** | Bot Token + Chat ID 配置，新邮件实时推送 |
| **AI 功能** | 验证码自动提取，可配置过滤规则 |
| **Turnstile** | Cloudflare Turnstile 人机验证集成 |
| **通知系统** | 登录页公告（标题/内容/类型/时长/位置/宽度/偏移） |
| **登录页定制** | 背景透明度、暗化系数可调 |
| **邮件前缀过滤** | 限制邮箱前缀最小长度 |

### 🎨 前端特性

| 功能 | 说明 |
|------|------|
| **Editorial 设计系统** | 25+ 自定义 UI 组件，纸质温暖质感 |
| **深色模式** | 完整的 Light/Dark 主题，CSS 变量驱动 |
| **PWA** | 可安装为桌面/移动应用 |
| **移动端适配** | 响应式布局，触摸目标优化，侧边栏自适应 |
| **IndexedDB 缓存** | Dexie 本地数据库，减少重复请求 |
| **图片压缩** | Compressor.js 上传前自动压缩 |
| **路由守卫** | NProgress 进度条，Token 鉴权守卫 |
| **文档页面** | `/doc` 路由提供项目文档（无需登录） |

### ⏰ 定时任务

| 触发时间 | 任务 |
|----------|------|
| `*/30 * * * *` | 刷新 ECharts 分析缓存 |
| `0 16 * * *` (每日 UTC) | 清理过期验证记录 |
| | 重置用户每日发件计数 |
| | 完成所有 SAVING 状态的收件（异常恢复） |
| | 清理未绑定的 OAuth 用户 |
| | 刷新 ECharts 分析缓存 |

## 项目结构

```
smail/
├── web/                            # ── 前端 (Vue 3 + Vite 7) ──
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                 # Editorial 设计系统 (25 个基础组件)
│   │   │   │   ├── s-button.vue    #   按钮 (primary/secondary/outline/danger/ghost)
│   │   │   │   ├── s-input.vue     #   输入框 (含 label/error/group)
│   │   │   │   ├── s-modal.vue     #   模态框 (sm/md/lg/xl)
│   │   │   │   ├── s-table.vue     #   数据表格 (排序/选择/分页)
│   │   │   │   ├── s-select.vue    #   下拉选择 (含标签多选)
│   │   │   │   ├── s-switch.vue    #   开关
│   │   │   │   ├── s-tabs.vue      #   标签页
│   │   │   │   ├── s-pagination.vue#   分页器
│   │   │   │   ├── toast.js        #   消息提示
│   │   │   │   ├── confirm.js      #   确认对话框
│   │   │   │   └── ...             #   avatar/badge/checkbox/radio/skeleton/tag/tooltip/tree...
│   │   │   ├── email-scroll/       # 邮件滚动加载组件
│   │   │   ├── hamburger/          # 汉堡菜单
│   │   │   ├── loading/            # 加载状态
│   │   │   ├── send-percent/       # 发件进度
│   │   │   ├── shadow-html/        # 邮件内容 Shadow DOM 渲染
│   │   │   └── tiny-editor/        # 富文本编辑器
│   │   ├── views/                  # 页面视图 (16 个模块)
│   │   │   ├── email/              #   收件箱 (默认首页)
│   │   │   ├── content/            #   邮件详情/阅读
│   │   │   ├── setting/            #   个人设置
│   │   │   ├── star/               #   收藏邮件
│   │   │   ├── login/              #   登录/注册
│   │   │   ├── doc/                #   项目文档页
│   │   │   ├── all-email/          #   [管理] 全局邮件管理
│   │   │   ├── analysis/           #   [管理] 数据分析面板
│   │   │   ├── user/               #   [管理] 用户管理
│   │   │   ├── role/               #   [管理] 角色权限管理
│   │   │   ├── sys-setting/        #   [管理] 系统设置
│   │   │   ├── reg-key/            #   [管理] 注册密钥管理
│   │   │   ├── send/               #   发件视图
│   │   │   ├── draft/              #   草稿
│   │   │   ├── test/               #   测试页
│   │   │   └── 404/                #   404 页面
│   │   ├── layout/                 # 布局组件
│   │   │   ├── index.vue           #   主布局 (侧边栏 + 顶栏 + 内容区)
│   │   │   ├── aside/              #   侧边栏 (账户列表/导航)
│   │   │   ├── header/             #   顶部导航栏
│   │   │   ├── write/              #   写信浮层
│   │   │   ├── account/            #   账户选择器
│   │   │   └── main/               #   主内容区
│   │   ├── store/                  # Pinia 状态管理 (9 个 store)
│   │   │   ├── account.js          #   账户状态
│   │   │   ├── email.js            #   邮件列表状态
│   │   │   ├── user.js             #   用户信息
│   │   │   ├── setting.js          #   系统设置
│   │   │   ├── ui.js               #   UI 状态 (侧边栏/主题)
│   │   │   ├── draft.js            #   草稿
│   │   │   ├── send.js             #   发件状态
│   │   │   ├── role.js             #   角色
│   │   │   └── writer.js           #   写信窗口状态
│   │   ├── request/                # API 请求封装 (12 个模块)
│   │   ├── i18n/                   # 国际化 (zh/en)
│   │   ├── styles/
│   │   │   └── editorial.css       # Editorial 设计系统 (CSS 变量 + 组件样式)
│   │   ├── router/                 # Vue Router (路由守卫 + NProgress)
│   │   ├── db/                     # Dexie IndexedDB 本地数据库
│   │   ├── echarts/                # ECharts 图表配置
│   │   ├── enums/                  # 前端枚举常量
│   │   ├── icons/                  # 图标 (Iconify)
│   │   ├── perm/                   # 前端权限控制
│   │   └── utils/                  # 工具函数
│   ├── public/                     # 静态资源
│   │   ├── smail-icon.svg          #   红底白信封 Logo
│   │   ├── favicon.png             #   站点图标
│   │   ├── mail-pwa.png            #   PWA 图标
│   │   ├── wechat-pay.png          #   微信收款码
│   │   └── alipay.png              #   支付宝收款码
│   └── vite.config.js              # Vite 配置 (PWA + 别名 + 构建)
│
├── server/                         # ── 后端 (Hono on Workers) ──
│   ├── src/
│   │   ├── index.js                # Workers 入口 (fetch/email/scheduled)
│   │   ├── routes.js               # 路由注册 (18 个 API 模块)
│   │   ├── hono.js                 # Hono 实例 (CORS + 全局错误处理)
│   │   ├── api/                    # API 路由层 (18 个模块)
│   │   │   ├── email-api.js        #   邮件收发/删除/收藏/搜索
│   │   │   ├── account-api.js      #   邮箱账户 CRUD
│   │   │   ├── user-api.js         #   用户管理
│   │   │   ├── login-api.js        #   登录/注册
│   │   │   ├── setting-api.js      #   系统设置
│   │   │   ├── role-api.js         #   角色权限
│   │   │   ├── all-email-api.js    #   全局邮件管理
│   │   │   ├── analysis-api.js     #   数据分析
│   │   │   ├── star-api.js         #   收藏
│   │   │   ├── resend-api.js       #   Resend 发件回调
│   │   │   ├── r2-api.js           #   R2 文件上传
│   │   │   ├── my-api.js           #   个人中心
│   │   │   ├── reg-key-api.js      #   注册密钥
│   │   │   ├── oauth-api.js        #   OAuth 登录
│   │   │   ├── public-api.js       #   公开 API (Token 认证)
│   │   │   ├── init-api.js         #   初始化
│   │   │   └── telegram-api.js     #   Telegram Webhook
│   │   ├── service/                # 业务逻辑层 (20 个服务)
│   │   │   ├── email-service.js    #   邮件核心逻辑 (收发/搜索/批量)
│   │   │   ├── account-service.js  #   账户管理
│   │   │   ├── user-service.js     #   用户管理
│   │   │   ├── login-service.js    #   认证逻辑
│   │   │   ├── setting-service.js  #   设置管理 (KV 缓存)
│   │   │   ├── role-service.js     #   角色权限
│   │   │   ├── perm-service.js     #   权限校验
│   │   │   ├── analysis-service.js #   分析统计
│   │   │   ├── star-service.js     #   收藏
│   │   │   ├── att-service.js      #   附件管理
│   │   │   ├── r2-service.js       #   R2 存储操作
│   │   │   ├── s3-service.js       #   S3 兼容存储
│   │   │   ├── kv-obj-service.js   #   KV 对象存储
│   │   │   ├── ai-service.js       #   AI 验证码提取
│   │   │   ├── telegram-service.js #   TG 消息推送
│   │   │   ├── resend-service.js   #   Resend 发件
│   │   │   ├── oauth-service.js    #   OAuth 逻辑
│   │   │   ├── reg-key-service.js  #   注册密钥
│   │   │   ├── turnstile-service.js#   Turnstile 验证
│   │   │   └── verify-record-service.js # 验证记录
│   │   ├── entity/                 # Drizzle ORM 实体定义
│   │   │   ├── orm.js              #   ORM 初始化 (D1 适配)
│   │   │   ├── email.js            #   邮件表
│   │   │   ├── account.js          #   账户表
│   │   │   ├── user.js             #   用户表
│   │   │   ├── att.js              #   附件表
│   │   │   ├── star.js             #   收藏表
│   │   │   ├── setting.js          #   设置表
│   │   │   ├── role.js / perm.js   #   角色/权限表
│   │   │   ├── oauth.js            #   OAuth 表
│   │   │   ├── reg-key.js          #   注册密钥表
│   │   │   └── verify-record.js    #   验证记录表
│   │   ├── dao/                    # 数据访问层
│   │   ├── middleware/             # 中间件
│   │   ├── security/               # 安全层
│   │   │   ├── security.js         #   JWT 认证 + 权限中间件
│   │   │   └── user-context.js     #   用户上下文
│   │   ├── modules/
│   │   │   └── email/email.js      # Email Handler (收件入口)
│   │   ├── template/               # 邮件模板 (HTML/纯文本/MIME)
│   │   ├── i18n/                   # 后端国际化 (i18next)
│   │   ├── const/                  # 常量定义
│   │   ├── model/                  # 数据模型 (统一响应格式)
│   │   ├── error/                  # 业务异常 (BizError)
│   │   └── utils/                  # 工具函数 (加密/JWT/文件/日期/域名/邮箱)
│   └── package.json
│
├── data/                           # ── 本地开发数据 ──
│   ├── db/smail.db                 # D1 SQLite 数据库 (本地)
│   ├── cache/kv-store.json         # KV 本地模拟
│   └── storage/                    # R2 本地模拟
│
├── wrangler.toml                   # Cloudflare 部署配置
├── .env.example                    # 环境变量模板
└── package.json                    # 根 package.json
```

> 💡 **新手推荐**：访问 [文档网站](https://mail.sixzjd.sbs/doc) 获取完整文档，或直接跳转 [快速部署教程](https://mail.sixzjd.sbs/doc#deploy) 从零开始搭建 smail 服务。

## 本地开发

### 环境要求

- **Node.js** >= 18
- **npm**

### 1. 克隆项目

```bash
git clone <repo-url> smail
cd smail
```

### 2. 安装依赖

```bash
# 前端依赖
cd web && npm install && cd ..

# 后端依赖
cd server && npm install && cd ..
```

### 3. 配置环境变量

复制 `.env.example` 并按需修改：

```bash
cp .env.example .env
```

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 开发服务端口 | `8787` |
| `DOMAIN` | 邮箱域名（用于收件） | `localhost` |
| `ADMIN` | 管理员邮箱地址 | `admin@localhost` |
| `JWT_SECRET` | JWT 签名密钥（**生产环境必须修改**） | `smail-secret-change-me-in-production` |
| `SMTP_HOST` | SMTP 服务器（可选） | — |
| `SMTP_PORT` | SMTP 端口 | `587` |
| `SMTP_USER` | SMTP 用户名 | — |
| `SMTP_PASS` | SMTP 密码 | — |

### 4. 启动开发服务器

```bash
# 在项目根目录执行
npx wrangler dev
```

本地开发模式下：
- **D1** → `data/db/smail.db` (本地 SQLite)
- **KV** → `data/cache/kv-store.json` (JSON 文件模拟)
- **R2** → `data/storage/` (文件系统模拟)
- 前端通过 Workers Assets 代理，支持热更新

### 5. 首次初始化

访问 `http://localhost:8787` 后，系统会引导完成数据库初始化（创建表结构、默认设置、管理员账户）。

## 部署指南

> 📖 更详细的部署步骤请参考 [文档网站](https://mail.sixzjd.sbs/doc)，或直接查看 [快速部署教程](https://mail.sixzjd.sbs/doc#deploy)。
>
> <a href="https://mail.sixzjd.sbs/doc#deploy"><img src="https://img.shields.io/badge/%E5%BF%AB%E9%80%9F%E9%83%A8%E7%BD%B2%E6%95%99%E7%A8%8B-%E7%82%B9%E6%AD%A4%E6%9F%A5%E7%9C%8B-22c55e" alt="快速部署教程" /></a>

### 前置条件

1. 拥有 Cloudflare 账户并已安装 [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
2. 已绑定自定义域名到 Cloudflare
3. 已创建 D1 数据库、KV 命名空间、R2 存储桶

### 1. 配置 wrangler.toml

```toml
name = "smail"
main = "server/src/index.js"
compatibility_date = "2025-06-04"

# 自定义域名路由
[[routes]]
pattern = "mail.your-domain.com"
zone_name = "your-domain.com"
custom_domain = true

# D1 数据库
[[d1_databases]]
binding = "db"
database_name = "cloud-mail"
database_id = "<your-d1-database-id>"

# KV 命名空间
[[kv_namespaces]]
binding = "kv"
id = "<your-kv-namespace-id>"

# R2 存储桶
[[r2_buckets]]
binding = "r2"
bucket_name = "<your-r2-bucket-name>"

# [可选] Cloudflare Email 发件
# [[send_email]]
# name = "email"

# AI 绑定
[ai]
binding = "ai"

# 前端静态资源
[assets]
binding = "assets"
directory = "./web/dist"
not_found_handling = "single-page-application"
run_worker_first = true

# 环境变量
[vars]
domain = ["your-domain.com"]           # 邮箱域名列表
admin = "admin@your-domain.com"        # 管理员邮箱
jwt_secret = "<your-strong-secret>"    # JWT 密钥（务必修改）
```

### 2. 构建前端

```bash
cd web && npx vite build --mode release && cd ..
```

构建产物输出到 `web/dist/`，由 Workers Assets 边缘托管。

### 3. 部署到 Cloudflare

```bash
npx wrangler deploy
```

### 4. 初始化数据库

部署完成后，访问你的域名，系统会引导完成初始化。

### 5. 配置邮件收发（可选）

**收件**：在 Cloudflare Dashboard → Email → Email Routing 中，将域名的 MX 记录指向 Workers，并配置 Email Worker 触发器。

**发件**：
- **方式 A**：启用 Cloudflare Email（在 wrangler.toml 中取消 `[[send_email]]` 注释）
- **方式 B**：配置 Resend API Token（在系统设置中按域名配置）

## 配置参考

### 系统设置项

| 设置 | 说明 | 可选值 |
|------|------|--------|
| `register` | 注册开关 | 开放 / 关闭 |
| `regKey` | 注册密钥模式 | 开放 / 关闭 / 可选 |
| `receive` | 收件开关 | 开放 / 关闭 |
| `send` | 发件开关 | 开放 / 关闭 |
| `addEmail` | 添加邮箱开关 | 开放 / 关闭 |
| `manyEmail` | 多邮箱开关 | 开放 / 关闭 |
| `registerVerify` | 注册验证 | 开放 / 关闭 / 按次数 |
| `addEmailVerify` | 添加邮箱验证 | 开放 / 关闭 / 按次数 |
| `forwardStatus` | 邮件转发 | 开放 / 关闭 |
| `tgBotStatus` | Telegram 通知 | 开放 / 关闭 |
| `ruleType` | 收件规则 | 全部 / 指定规则 |
| `noRecipient` | 无收件人处理 | 开放 / 关闭 |
| `kvStorage` | KV 存储模式 | 开放 / 关闭 |
| `aiCode` | AI 验证码提取 | 开放 / 关闭 |

### 权限项列表

| 权限 Key | 控制范围 |
|----------|----------|
| `email:send` | 发送邮件 |
| `email:delete` | 删除邮件 |
| `account:add/query/delete` | 邮箱账户管理 |
| `user:query/add/delete/reset-send/set-pwd/set-status/set-type` | 用户管理 |
| `role:add/set/query/delete` | 角色管理 |
| `all-email:query/delete` | 全局邮件管理 |
| `setting:query/set` | 系统设置 |
| `analysis:query` | 数据分析 |
| `reg-key:add/query/delete` | 注册密钥管理 |
| `my:delete` | 个人中心 |

## 设计系统

项目采用 **Editorial 设计系统**，灵感来自纸质出版物的温暖质感：

| 元素 | 说明 |
|------|------|
| **主题色** | `#d9543e` 珊瑚红（深色模式 `#e06850`） |
| **标题字体** | Plus Jakarta Sans — 圆润现代的无衬线体 |
| **正文字体** | DM Sans — 清晰易读的无衬线体 |
| **背景** | `#fbf6ee` 暖色纸质纹理（Light）/ `#231e1a` 深棕（Dark） |
| **圆角** | 8px 基础 / 6px 小 / 12px 大 / 16px 超大 |
| **阴影** | 暖色调半透明阴影，营造纸张层次感 |
| **动画** | 200ms ease 基础过渡，淡入/缩放/滑入关键帧 |
| **组件** | 25+ 基础组件：button, input, modal, table, select, switch, tabs, pagination, toast, confirm, dropdown, tree... |

## License

MIT
