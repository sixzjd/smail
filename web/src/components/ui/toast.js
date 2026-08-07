import { createApp, ref } from 'vue'

let container = null
let toasts = []

export const toast = (message, type = 'info', duration = 3000) => {
  if (!container) {
    container = document.createElement('div')
    container.className = 's-toast-container'
    document.body.appendChild(container)
  }

  const toastEl = document.createElement('div')
  toastEl.className = `s-toast s-toast--${type}`
  toastEl.textContent = message
  container.appendChild(toastEl)

  setTimeout(() => {
    toastEl.style.opacity = '0'
    toastEl.style.transform = 'translateX(20px)'
    setTimeout(() => toastEl.remove(), 200)
  }, duration)
}

export const SToast = {
  install(app) {
    app.config.globalProperties.$toast = toast
  }
}
