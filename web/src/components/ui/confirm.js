import { createApp, ref } from 'vue'

export const confirm = (message, title = '确认') => {
  return new Promise((resolve) => {
    const mask = document.createElement('div')
    mask.className = 's-modal-mask'

    const modal = document.createElement('div')
    modal.className = 's-modal s-modal--sm'
    modal.innerHTML = `
      <div class="s-modal-header">
        <div class="s-confirm-title">${title}</div>
        <button class="s-modal-close" aria-label="关闭">×</button>
      </div>
      <div class="s-modal-body">
        <div class="s-confirm-body">${message}</div>
      </div>
      <div class="s-modal-footer">
        <button class="s-btn s-btn--secondary" data-action="cancel">取消</button>
        <button class="s-btn s-btn--primary" data-action="confirm">确认</button>
      </div>
    `

    mask.appendChild(modal)
    document.body.appendChild(mask)

    const close = (result) => {
      mask.style.opacity = '0'
      setTimeout(() => mask.remove(), 200)
      resolve(result)
    }

    mask.querySelector('.s-modal-close').onclick = () => close(false)
    mask.querySelector('[data-action="cancel"]').onclick = () => close(false)
    mask.querySelector('[data-action="confirm"]').onclick = () => close(true)
    mask.onclick = (e) => { if (e.target === mask) close(false) }
  })
}

export const SConfirm = {
  install(app) {
    app.config.globalProperties.$confirm = confirm
  }
}
