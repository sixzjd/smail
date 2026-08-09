<template>
  <div class="doc-page">
    <!-- Header -->
    <header class="doc-header">
      <div class="doc-header-inner">
        <div class="doc-logo">
          <img src="/smail-icon.svg" alt="smail" class="doc-logo-img">
          <span class="doc-logo-text">smail</span>
        </div>
        <a href="https://github.com/sixzjd/smail" target="_blank" class="doc-github-btn">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
          GitHub
        </a>
      </div>
    </header>

    <!-- Hero -->
    <section class="doc-hero">
      <div class="doc-hero-badge">Serverless Email Service</div>
      <h1>A CALMER <span>INBOX</span></h1>
      <p class="doc-subtitle">基于 Cloudflare 构建的低成本 Serverless 邮箱服务，无需维护服务器，全球边缘节点加速，让你的邮件管理更从容。</p>
      <div class="doc-hero-actions">
        <a href="#deploy" class="doc-btn-primary">快速部署</a>
        <a href="https://mail.sixzjd.sbs" target="_blank" class="doc-btn-outline">在线体验</a>
      </div>
    </section>

    <!-- Core Features -->
    <section class="doc-section" id="features">
      <div class="doc-section-header">
        <h2>核心功能</h2>
        <p>完整的邮箱管理能力，覆盖日常所需</p>
      </div>
      <div class="doc-grid">
        <div class="doc-card">
          <div class="doc-card-icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          <h3>邮件收发</h3>
          <p>完整的 IMAP/SMTP 邮件收发能力，支持富文本编辑器、草稿保存、批量操作</p>
        </div>
        <div class="doc-card">
          <div class="doc-card-icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
          </div>
          <h3>邮件转发</h3>
          <p>新邮件自动转发至指定邮箱或 Telegram，重要消息不遗漏</p>
        </div>
        <div class="doc-card">
          <div class="doc-card-icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
          </div>
          <h3>附件管理</h3>
          <p>基于 R2 存储的附件上传与下载，支持大文件，S3 兼容接口</p>
        </div>
        <div class="doc-card">
          <div class="doc-card-icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <h3>邮件收藏</h3>
          <p>一键收藏重要邮件，分类标记，快速检索</p>
        </div>
        <div class="doc-card">
          <div class="doc-card-icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </div>
          <h3>数据分析</h3>
          <p>ECharts 可视化图表展示收发趋势、邮件统计，数据一目了然</p>
        </div>
        <div class="doc-card">
          <div class="doc-card-icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h3>RBAC 权限</h3>
          <p>管理员创建角色、分配权限，精细控制每位用户的操作范围</p>
        </div>
      </div>
    </section>

    <!-- Highlights -->
    <section class="doc-section doc-section-alt" id="highlights">
      <div class="doc-section-header">
        <h2>亮点特性</h2>
        <p>为什么选择 smail</p>
      </div>
      <div class="doc-highlights-grid">
        <div class="doc-highlight-item">
          <div class="doc-highlight-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <div>
            <h4>Serverless 架构</h4>
            <p>无需维护服务器，自动扩缩容，全球边缘节点加速访问</p>
          </div>
        </div>
        <div class="doc-highlight-item">
          <div class="doc-highlight-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div>
            <h4>极低成本</h4>
            <p>基于 Cloudflare 免费额度，个人使用几乎零成本运行</p>
          </div>
        </div>
        <div class="doc-highlight-item">
          <div class="doc-highlight-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          </div>
          <div>
            <h4>响应式设计</h4>
            <p>完美适配桌面与移动端，随时随地管理邮件</p>
          </div>
        </div>
        <div class="doc-highlight-item">
          <div class="doc-highlight-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
          </div>
          <div>
            <h4>完全开源</h4>
            <p>代码托管在 GitHub，可自由 fork 和定制化改造</p>
          </div>
        </div>
        <div class="doc-highlight-item">
          <div class="doc-highlight-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <h4>数据自主</h4>
            <p>所有数据存储在 Cloudflare D1/KV/R2，完全可控不依赖第三方</p>
          </div>
        </div>
        <div class="doc-highlight-item">
          <div class="doc-highlight-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <div>
            <h4>现代技术栈</h4>
            <p>Vue 3 + Hono + Drizzle ORM，开发体验优秀，性能出众</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Architecture -->
    <section class="doc-section" id="architecture">
      <div class="doc-section-header">
        <h2>技术架构</h2>
        <p>基于 Cloudflare 全栈构建，简洁而强大</p>
      </div>
      <div class="doc-arch-diagram">
        <div class="arch-layer arch-layer-top">
          <div class="arch-node arch-frontend">
            <div class="arch-node-label">Frontend</div>
            <div class="arch-node-tags">
              <span>Vue 3</span>
              <span>Element Plus</span>
              <span>Vite</span>
              <span>PWA</span>
            </div>
          </div>
        </div>
        <div class="arch-connector">
          <div class="arch-line"></div>
          <div class="arch-dot"></div>
        </div>
        <div class="arch-layer arch-layer-mid">
          <div class="arch-node arch-worker">
            <div class="arch-node-label">Cloudflare Worker</div>
            <div class="arch-node-tags">
              <span>Hono</span>
              <span>Router</span>
              <span>Middleware</span>
              <span>Worker Assets</span>
            </div>
          </div>
        </div>
        <div class="arch-connector">
          <div class="arch-line"></div>
          <div class="arch-dots-row">
            <div class="arch-dot"></div>
            <div class="arch-dot"></div>
            <div class="arch-dot"></div>
          </div>
        </div>
        <div class="arch-layer arch-layer-bottom">
          <div class="arch-node arch-d1">
            <div class="arch-node-label">D1</div>
            <div class="arch-node-desc">邮件 · 用户 · 角色</div>
            <div class="arch-node-tags"><span>Drizzle ORM</span></div>
          </div>
          <div class="arch-node arch-kv">
            <div class="arch-node-label">KV</div>
            <div class="arch-node-desc">Session · 配置缓存</div>
            <div class="arch-node-tags"><span>高速读写</span></div>
          </div>
          <div class="arch-node arch-r2">
            <div class="arch-node-label">R2</div>
            <div class="arch-node-desc">附件 · 背景图</div>
            <div class="arch-node-tags"><span>S3 兼容</span></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Deploy Tutorial -->
    <section class="doc-section doc-section-alt" id="deploy">
      <div class="doc-section-header">
        <h2>部署教程</h2>
        <p>5 步完成部署，快速拥有你的专属邮箱服务</p>
      </div>
      <div class="doc-steps">
        <div class="doc-step">
          <div class="step-number">1</div>
          <div class="step-content">
            <h3>Fork 仓库</h3>
            <p>访问 <a href="https://github.com/sixzjd/smail" target="_blank">github.com/sixzjd/smail</a>，点击右上角 <strong>Fork</strong> 按钮，将仓库复制到你自己的 GitHub 账户。</p>
            <div class="step-img-placeholder">截图位置：GitHub 仓库页面 Fork 按钮</div>
          </div>
        </div>
        <div class="doc-step">
          <div class="step-number">2</div>
          <div class="step-content">
            <h3>配置 Cloudflare 资源</h3>
            <p>在 Cloudflare Dashboard 中创建以下资源：</p>
            <ul>
              <li><strong>Domain</strong> — 添加你的域名（如 mail.example.com）</li>
              <li><strong>D1 数据库</strong> — 创建数据库，记录 database_id</li>
              <li><strong>KV 命名空间</strong> — 创建 KV namespace，记录 id</li>
              <li><strong>R2 存储桶</strong> — 创建 bucket（如 cloudmail）</li>
              <li><strong>Resend API 密钥</strong> — 在 resend.com 注册并获取 API key</li>
            </ul>
            <div class="step-img-placeholder">截图位置：Cloudflare Dashboard 资源列表</div>
          </div>
        </div>
        <div class="doc-step">
          <div class="step-number">3</div>
          <div class="step-content">
            <h3>配置 wrangler.toml</h3>
            <p>克隆 fork 的仓库，修改 <code>wrangler.toml</code> 中的配置：</p>
            <pre><code>name = "smail"
main = "server/src/index.js"

[[routes]]
pattern = "mail.yourdomain.com"
zone_name = "yourdomain.com"
custom_domain = true

[[d1_databases]]
binding = "db"
database_name = "smail"
database_id = "你的D1数据库ID"

[[kv_namespaces]]
binding = "kv"
id = "你的KV命名空间ID"

[[r2_buckets]]
binding = "r2"
bucket_name = "你的R2存储桶名"

[vars]
domain = ["yourdomain.com"]
admin = "admin@yourdomain.com"
jwt_secret = "你的JWT密钥"</code></pre>
            <div class="step-img-placeholder">截图位置：wrangler.toml 配置示例</div>
          </div>
        </div>
        <div class="doc-step">
          <div class="step-number">4</div>
          <div class="step-content">
            <h3>部署</h3>
            <p>有两种部署方式：</p>
            <p><strong>方式 A：GitHub Actions（推荐）</strong></p>
            <p>在仓库 Settings → Secrets 中添加 Cloudflare API Token，push 到 main 分支自动部署。</p>
            <p><strong>方式 B：手动部署</strong></p>
            <pre><code># 安装依赖
cd server && npm install
cd ../web && npm install

# 构建前端
cd web && npx vite build --mode release

# 部署 Worker
cd .. && npx wrangler deploy</code></pre>
            <div class="step-img-placeholder">截图位置：部署成功的终端输出</div>
          </div>
        </div>
        <div class="doc-step">
          <div class="step-number">5</div>
          <div class="step-content">
            <h3>初始化数据库</h3>
            <p>部署成功后，访问以下 URL 初始化数据库：</p>
            <pre><code>https://mail.yourdomain.com/api/init/你的jwt_secret</code></pre>
            <p>看到 <code>success</code> 即表示初始化完成。</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Sponsor -->
    <section class="doc-section doc-sponsor" id="sponsor">
      <div class="doc-section-header">
        <h2>支持项目</h2>
        <p>如果 smail 对你有帮助，欢迎赞助支持项目的持续开发和维护</p>
      </div>
      <div class="doc-qr-row">
        <div class="doc-qr-item">
          <img src="/wechat-pay.png" alt="微信支付" class="doc-qr-img">
          <span class="doc-qr-label">微信支付</span>
        </div>
        <div class="doc-qr-item">
          <img src="/alipay.png" alt="支付宝" class="doc-qr-img">
          <span class="doc-qr-label">支付宝</span>
        </div>
      </div>
      <p class="doc-sponsor-thanks">感谢每一位支持者的鼓励</p>
    </section>

    <!-- Footer -->
    <footer class="doc-footer">
      <div class="doc-footer-inner">
        <div class="doc-footer-brand">
          <img src="/smail-icon.svg" alt="smail" class="doc-footer-logo">
          <span>smail</span>
        </div>
        <p class="doc-footer-tagline">A CALMER INBOX — Serverless Email Service</p>
        <div class="doc-footer-links">
          <a href="https://github.com/sixzjd/smail" target="_blank">GitHub</a>
          <span class="doc-footer-dot">·</span>
          <a href="https://mail.sixzjd.sbs" target="_blank">在线体验</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
</script>

<style scoped>
/* ── Variables ── */
:root {
  --c-primary: #d9543e;
  --c-primary-hover: #c44835;
  --c-primary-10: rgba(217, 84, 62, 0.10);
  --c-primary-08: rgba(217, 84, 62, 0.08);
  --c-primary-06: rgba(217, 84, 62, 0.06);
  --c-bg: #FAFAFA;
  --c-bg-alt: #F4F1EE;
  --c-surface: #FFFFFF;
  --c-text: #1a1a1a;
  --c-text-secondary: #5a5a5a;
  --c-text-muted: #8a8a8a;
  --c-border: rgba(0,0,0,0.06);
  --radius: 14px;
  --radius-sm: 10px;
  --shadow-card: 0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03);
  --shadow-card-hover: 0 4px 12px rgba(217,84,62,0.08), 0 8px 32px rgba(0,0,0,0.06);
  --max-w: 960px;
  --font-body: 'DM Sans', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}


/* ── Base ── */
.doc-page {
  min-height: 100vh;
  background: var(--c-bg);
  color: var(--c-text);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
}

/* ── Header ── */
.doc-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(250, 250, 250, 0.88);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--c-border);
}

.doc-header-inner {
  max-width: var(--max-w);
  margin: 0 auto;
  padding: 14px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.doc-logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.doc-logo-img {
  width: 30px;
  height: 30px;
  border-radius: 7px;
}

.doc-logo-text {
  font-size: 19px;
  font-weight: 700;
  color: var(--c-primary);
  letter-spacing: -0.5px;
}

.doc-github-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 18px;
  border-radius: 9px;
  background: var(--c-primary);
  color: #fff;
  text-decoration: none;
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: 0.01em;
  transition: background 0.2s, transform 0.15s;
}

.doc-github-btn:hover {
  background: var(--c-primary-hover);
  transform: translateY(-1px);
}

/* ── Hero ── */
.doc-hero {
  text-align: center;
  padding: 100px 24px 80px;
  max-width: var(--max-w);
  margin: 0 auto;
}

.doc-hero-badge {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 100px;
  background: var(--c-primary-10);
  color: var(--c-primary);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
  margin-bottom: 24px;
}

.doc-hero h1 {
  font-size: 52px;
  font-weight: 800;
  color: var(--c-text);
  margin: 0 0 20px;
  letter-spacing: -1.5px;
  line-height: 1.1;
}

.doc-hero h1 span {
  color: var(--c-primary);
}

.doc-subtitle {
  font-size: 17px;
  color: var(--c-text-secondary);
  margin: 0 auto;
  max-width: 560px;
  line-height: 1.7;
}

.doc-hero-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 36px;
}

.doc-btn-primary {
  display: inline-flex;
  align-items: center;
  padding: 12px 28px;
  border-radius: 10px;
  background: var(--c-primary);
  color: #fff;
  text-decoration: none;
  font-size: 15px;
  font-weight: 600;
  transition: background 0.2s, transform 0.15s;
}

.doc-btn-primary:hover {
  background: var(--c-primary-hover);
  transform: translateY(-1px);
}

.doc-btn-outline {
  display: inline-flex;
  align-items: center;
  padding: 12px 28px;
  border-radius: 10px;
  border: 1.5px solid var(--c-border);
  color: var(--c-text);
  text-decoration: none;
  font-size: 15px;
  font-weight: 600;
  background: var(--c-surface);
  transition: border-color 0.2s, transform 0.15s;
}

.doc-btn-outline:hover {
  border-color: var(--c-primary);
  color: var(--c-primary);
  transform: translateY(-1px);
}

/* ── Sections ── */
.doc-section {
  max-width: var(--max-w);
  margin: 0 auto;
  padding: 72px 24px;
}

.doc-section-alt {
  background: var(--c-bg-alt);
  max-width: 100%;
  padding-left: calc((100% - var(--max-w)) / 2 + 24px);
  padding-right: calc((100% - var(--max-w)) / 2 + 24px);
}

.doc-section-header {
  margin-bottom: 48px;
}

.doc-section-header h2 {
  font-size: 30px;
  font-weight: 700;
  color: var(--c-text);
  margin: 0 0 10px;
  letter-spacing: -0.5px;
}

.doc-section-header p {
  font-size: 16px;
  color: var(--c-text-muted);
  margin: 0;
}

/* ── Feature Grid ── */
.doc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.doc-card {
  background: var(--c-surface);
  border-radius: var(--radius);
  padding: 28px;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--c-border);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.doc-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-card-hover);
}

.doc-card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--c-primary-10);
  color: var(--c-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.doc-card h3 {
  font-size: 17px;
  font-weight: 650;
  margin: 0 0 8px;
  color: var(--c-text);
}

.doc-card p {
  font-size: 14px;
  color: var(--c-text-secondary);
  line-height: 1.65;
  margin: 0;
}

/* ── Highlights ── */
.doc-highlights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.doc-highlight-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  border-radius: var(--radius-sm);
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  transition: border-color 0.2s;
}

.doc-highlight-item:hover {
  border-color: var(--c-primary-06);
}

.doc-highlight-icon {
  width: 40px;
  height: 40px;
  min-width: 40px;
  border-radius: 10px;
  background: var(--c-primary-10);
  color: var(--c-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.doc-highlight-item h4 {
  font-size: 15px;
  font-weight: 650;
  margin: 0 0 4px;
  color: var(--c-text);
}

.doc-highlight-item p {
  font-size: 13.5px;
  color: var(--c-text-secondary);
  line-height: 1.6;
  margin: 0;
}

/* ── Architecture ── */
.doc-arch-diagram {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

.arch-layer {
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

.arch-node {
  background: var(--c-surface);
  border-radius: var(--radius);
  padding: 22px 28px;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--c-border);
  text-align: center;
  min-width: 180px;
}

.arch-node-label {
  font-size: 15px;
  font-weight: 700;
  color: var(--c-text);
  margin-bottom: 6px;
}

.arch-node-desc {
  font-size: 13px;
  color: var(--c-text-muted);
  margin-bottom: 8px;
}

.arch-node-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
}

.arch-node-tags span {
  font-size: 11.5px;
  padding: 3px 10px;
  border-radius: 100px;
  background: var(--c-bg-alt);
  color: var(--c-text-secondary);
  font-weight: 500;
}

.arch-frontend { border-top: 3px solid #5B8DEF; }
.arch-worker { border-top: 3px solid var(--c-primary); }
.arch-d1 { border-top: 3px solid #4CAF50; }
.arch-kv { border-top: 3px solid #FF9800; }
.arch-r2 { border-top: 3px solid #9C27B0; }

.arch-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 40px;
  justify-content: center;
  gap: 4px;
}

.arch-line {
  width: 2px;
  height: 16px;
  background: var(--c-primary);
  opacity: 0.4;
}

.arch-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--c-primary);
  opacity: 0.5;
}

.arch-dots-row {
  display: flex;
  gap: 12px;
}

/* ── Steps ── */
.doc-steps {
  display: flex;
  flex-direction: column;
  gap: 36px;
}

.doc-step {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.step-number {
  width: 38px;
  height: 38px;
  min-width: 38px;
  background: var(--c-primary);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  margin-top: 2px;
}

.step-content {
  flex: 1;
}

.step-content h3 {
  font-size: 18px;
  font-weight: 650;
  margin: 0 0 10px;
  color: var(--c-text);
}

.step-content p {
  font-size: 14.5px;
  color: var(--c-text-secondary);
  line-height: 1.7;
  margin: 0 0 10px;
}

.step-content ul {
  margin: 8px 0;
  padding-left: 20px;
}

.step-content li {
  font-size: 14.5px;
  color: var(--c-text-secondary);
  line-height: 1.8;
}

.step-content code {
  background: var(--c-bg-alt);
  padding: 2px 7px;
  border-radius: 5px;
  font-size: 13px;
  color: var(--c-primary);
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.step-content pre {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 20px 24px;
  border-radius: var(--radius-sm);
  overflow-x: auto;
  margin: 12px 0;
  font-size: 13px;
  line-height: 1.65;
}

.step-content pre code {
  background: none;
  color: inherit;
  padding: 0;
  font-size: 13px;
}

.step-img-placeholder {
  background: var(--c-bg-alt);
  border: 1.5px dashed rgba(0,0,0,0.12);
  border-radius: var(--radius-sm);
  padding: 32px 20px;
  text-align: center;
  color: var(--c-text-muted);
  font-size: 13px;
  margin: 12px 0;
}

.step-content a {
  color: var(--c-primary);
  text-decoration: none;
  font-weight: 500;
}

.step-content a:hover {
  text-decoration: underline;
}

/* ── Sponsor ── */
.doc-sponsor {
  text-align: center;
}

.doc-qr-row {
  display: flex;
  justify-content: center;
  gap: 48px;
  flex-wrap: wrap;
}

.doc-qr-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.doc-qr-img {
  width: 200px;
  height: 200px;
  object-fit: contain;
  border-radius: var(--radius);
  background: var(--c-surface);
  padding: 12px;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--c-border);
}

.doc-qr-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--c-text-secondary);
}

.doc-sponsor-thanks {
  margin-top: 32px;
  font-size: 14px;
  color: var(--c-text-muted);
}

/* ── Footer ── */
.doc-footer {
  border-top: 1px solid var(--c-border);
  padding: 48px 24px;
}

.doc-footer-inner {
  max-width: var(--max-w);
  margin: 0 auto;
  text-align: center;
}

.doc-footer-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}

.doc-footer-logo {
  width: 24px;
  height: 24px;
  border-radius: 6px;
}

.doc-footer-brand span {
  font-size: 16px;
  font-weight: 700;
  color: var(--c-text);
}

.doc-footer-tagline {
  font-size: 13px;
  color: var(--c-text-muted);
  margin: 0 0 16px;
}

.doc-footer-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.doc-footer-links a {
  font-size: 13.5px;
  color: var(--c-primary);
  text-decoration: none;
  font-weight: 500;
}

.doc-footer-links a:hover {
  text-decoration: underline;
}

.doc-footer-dot {
  color: var(--c-text-muted);
  font-size: 13px;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .doc-hero {
    padding: 64px 20px 48px;
  }

  .doc-hero h1 {
    font-size: 34px;
    letter-spacing: -1px;
  }

  .doc-subtitle {
    font-size: 15px;
  }

  .doc-hero-actions {
    flex-direction: column;
    align-items: center;
  }

  .doc-section {
    padding: 48px 20px;
  }

  .doc-section-header h2 {
    font-size: 24px;
  }

  .doc-grid,
  .doc-highlights-grid {
    grid-template-columns: 1fr;
  }

  .doc-qr-row {
    gap: 24px;
  }

  .doc-qr-img {
    width: 160px;
    height: 160px;
  }

  .doc-step {
    flex-direction: column;
    gap: 12px;
  }

  .arch-layer-bottom {
    flex-direction: column;
    align-items: center;
  }

  .arch-node {
    width: 100%;
  }
}
</style>

<style>
/* Dark mode overrides for doc page — must be global */
html.dark .doc-page {
  --c-primary: #e06850;
  --c-primary-hover: #d05a44;
  --c-primary-10: rgba(224, 104, 80, 0.15);
  --c-primary-08: rgba(224, 104, 80, 0.10);
  --c-primary-06: rgba(224, 104, 80, 0.08);
  --c-bg: var(--s-body);
  --c-bg-alt: var(--s-soft);
  --c-surface: var(--s-white);
  --c-text: var(--s-ink);
  --c-text-secondary: var(--s-ink-secondary);
  --c-text-muted: var(--s-muted);
  --c-border: var(--s-line);
  --shadow-card: 0 1px 3px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.10);
  --shadow-card-hover: 0 4px 12px rgba(224,104,80,0.12), 0 8px 32px rgba(0,0,0,0.15);
}

html.dark .doc-header {
  background: color-mix(in srgb, var(--s-body, #231e1a) 88%, transparent) !important;
}

html.dark .step-content pre {
  background: #1a1614;
}

html.dark .step-img-placeholder {
  border-color: var(--s-line);
}
</style>

