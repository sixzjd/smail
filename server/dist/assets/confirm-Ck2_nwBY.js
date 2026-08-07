const n=(t,c="确认")=>new Promise(l=>{const a=document.createElement("div");a.className="s-modal-mask";const s=document.createElement("div");s.className="s-modal s-modal--sm",s.innerHTML=`
      <div class="s-modal-header">
        <div class="s-confirm-title">${c}</div>
        <button class="s-modal-close" aria-label="关闭">×</button>
      </div>
      <div class="s-modal-body">
        <div class="s-confirm-body">${t}</div>
      </div>
      <div class="s-modal-footer">
        <button class="s-btn s-btn--secondary" data-action="cancel">取消</button>
        <button class="s-btn s-btn--primary" data-action="confirm">确认</button>
      </div>
    `,a.appendChild(s),document.body.appendChild(a);const o=e=>{a.style.opacity="0",setTimeout(()=>a.remove(),200),l(e)};a.querySelector(".s-modal-close").onclick=()=>o(!1),a.querySelector('[data-action="cancel"]').onclick=()=>o(!1),a.querySelector('[data-action="confirm"]').onclick=()=>o(!0),a.onclick=e=>{e.target===a&&o(!1)}});export{n as c};
