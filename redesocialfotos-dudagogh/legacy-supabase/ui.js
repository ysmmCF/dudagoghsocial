// =========================================================================
// UI HELPERS, TOASTS, CONFIRM MODAL, UTILITIES & CANVAS
// =========================================================================

function escapeHtml(str) {
  return (str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatTimeAgo(isoString) {
  if (!isoString) return 'agora';
  const diff = Math.floor((new Date().getTime() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return 'agora mesmo';
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  return new Date(isoString).toLocaleDateString('pt-BR');
}

// Toast Popup System
function showToast(title, message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl glass-panel border border-amber-500/30 shadow-2xl transition-all duration-300 transform -translate-y-2 opacity-0';

  let iconColor = 'text-amber-400';
  let iconSvg = `<svg class="w-5 h-5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;

  if (type === 'success' || type === 'upload') {
    iconColor = 'text-emerald-400';
    iconSvg = `<svg class="w-5 h-5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
  } else if (type === 'error' || type === 'delete') {
    iconColor = 'text-rose-400';
    iconSvg = `<svg class="w-5 h-5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`;
  } else if (type === 'like') {
    iconColor = 'text-rose-400';
    iconSvg = `<svg class="w-5 h-5 fill-rose-400 stroke-rose-400" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
  }

  toast.innerHTML = `
    <div class="shrink-0 ${iconColor} mt-0.5">${iconSvg}</div>
    <div class="flex-1 min-w-0">
      <h5 class="text-xs font-semibold text-slate-100">${escapeHtml(title)}</h5>
      <p class="text-[11px] text-slate-300 font-light mt-0.5 leading-snug">${escapeHtml(message)}</p>
    </div>
    <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-slate-200 text-xs p-1">✕</button>
  `;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('-translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('-translate-y-2', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Modal de Confirmação Customizado
let confirmModalCallback = null;

function showConfirmModal(title, message, onConfirm) {
  const modal = document.getElementById('confirmModal');
  const titleEl = document.getElementById('confirmModalTitle');
  const msgEl = document.getElementById('confirmModalMessage');
  const actionBtn = document.getElementById('confirmModalActionBtn');

  if (!modal || !titleEl || !msgEl || !actionBtn) {
    if (confirm(`${title}\n${message}`)) {
      if (typeof onConfirm === 'function') onConfirm();
    }
    return;
  }

  titleEl.textContent = title;
  msgEl.textContent = message;
  confirmModalCallback = onConfirm;

  actionBtn.onclick = function() {
    closeConfirmModal();
    if (typeof confirmModalCallback === 'function') {
      confirmModalCallback();
      confirmModalCallback = null;
    }
  };

  modal.classList.remove('hidden');
}

function closeConfirmModal() {
  const modal = document.getElementById('confirmModal');
  if (modal) modal.classList.add('hidden');
  confirmModalCallback = null;
}

// Animação do Fundo Estrelado (Starry Canvas)
function initStarryCanvas() {
  const canvas = document.getElementById('starryCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w = canvas.width = window.innerWidth;
  let h = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }, { passive: true });

  const colors = ['#d4af37', '#f3e5ab', '#ffffff', '#60a5fa'];
  const count = w < 640 ? 30 : 55;
  const stars = Array.from({ length: count }, () => ({
    x: Math.random() * w, y: Math.random() * h,
    r: Math.random() * 1.4 + 0.3,
    c: colors[Math.floor(Math.random() * colors.length)],
    a: Math.random() * 0.5 + 0.2,
    s: Math.random() * 0.012 + 0.004
  }));

  let frame = 0;
  function animate() {
    frame++;
    if (frame % 2 === 0) {
      ctx.clearRect(0, 0, w, h);
      stars.forEach(st => {
        st.a += st.s;
        if (st.a > 0.8 || st.a < 0.2) st.s = -st.s;
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fillStyle = st.c;
        ctx.globalAlpha = Math.max(0.1, Math.min(0.9, st.a));
        ctx.fill();
      });
    }
    requestAnimationFrame(animate);
  }
  animate();
}
