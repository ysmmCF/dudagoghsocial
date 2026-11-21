// =========================================================================
// SISTEMA DE NOTIFICAÇÕES (Sino, Modal e badges)
// =========================================================================

let notificationsList = JSON.parse(localStorage.getItem('duda15_notifications') || '[]');

function addNotification(title, message, type = 'info') {
  const notif = {
    id: Date.now() + Math.random().toString(36).substring(2, 7),
    title,
    message,
    type,
    timestamp: new Date().toISOString(),
    read: false
  };

  notificationsList.unshift(notif);
  if (notificationsList.length > 50) notificationsList.pop();

  localStorage.setItem('duda15_notifications', JSON.stringify(notificationsList));
  updateNotificationBadge();
  showToast(title, message, type);
}

function updateNotificationBadge() {
  const badge = document.getElementById('notifBadge');
  if (!badge) return;

  const unreadCount = notificationsList.filter(n => !n.read).length;
  if (unreadCount > 0) {
    badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

function openNotificationsModal() {
  const modal = document.getElementById('notificationsModal');
  if (modal) {
    modal.classList.remove('hidden');
    renderNotifications();
  }
}

function closeNotificationsModal() {
  const modal = document.getElementById('notificationsModal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

function renderNotifications() {
  const listContainer = document.getElementById('notificationsList');
  if (!listContainer) return;

  if (notificationsList.length === 0) {
    listContainer.innerHTML = `
      <div class="text-center py-10 text-slate-400">
        <svg class="w-10 h-10 mx-auto stroke-1 opacity-50 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
        <p class="text-xs">Nenhuma notificação por enquanto.</p>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = notificationsList.map(n => {
    let iconSvg = `<svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
    if (n.type === 'upload') {
      iconSvg = `<svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>`;
    } else if (n.type === 'profile') {
      iconSvg = `<svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`;
    } else if (n.type === 'like') {
      iconSvg = `<svg class="w-4 h-4 text-rose-400 fill-rose-400" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
    } else if (n.type === 'delete') {
      iconSvg = `<svg class="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>`;
    }

    return `
      <div class="flex items-start gap-3 p-3 rounded-xl ${n.read ? 'bg-slate-800/30' : 'bg-amber-500/10 border border-amber-500/20'} transition-all">
        <div class="p-2 rounded-lg bg-slate-900/60 shrink-0 mt-0.5">${iconSvg}</div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2">
            <h5 class="text-xs font-semibold text-slate-100">${escapeHtml(n.title)}</h5>
            <span class="text-[10px] text-slate-400">${formatTimeAgo(n.timestamp)}</span>
          </div>
          <p class="text-[11px] text-slate-300 font-light mt-0.5">${escapeHtml(n.message)}</p>
        </div>
      </div>
    `;
  }).join('');
}

function markNotificationsAsRead() {
  notificationsList = notificationsList.map(n => ({ ...n, read: true }));
  localStorage.setItem('duda15_notifications', JSON.stringify(notificationsList));
  updateNotificationBadge();
  renderNotifications();
}

function clearAllNotifications() {
  notificationsList = [];
  localStorage.setItem('duda15_notifications', JSON.stringify([]));
  updateNotificationBadge();
  renderNotifications();
}
