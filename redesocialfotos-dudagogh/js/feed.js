// =========================================================================
// GESTÃO DO FEED, PUBLICAÇÕES, CURTIDAS, LIGHTBOX & PERFIL
// =========================================================================

let photosList = [];
let sortMode = 'recent';
let editingCaptionPhotoId = null;

async function loadPhotos() {
  const feed = document.getElementById('photosFeed');
  if (feed && photosList.length === 0) {
    feed.innerHTML = `
      <div class="col-span-full py-16 text-center text-slate-400">
        <div class="inline-block w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p class="text-xs">Carregando memórias...</p>
      </div>
    `;
  }

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        photosList = data.map(item => ({
          id: item.id,
          url: item.image_url || item.url,
          author: item.author_name || item.author || 'Convidado',
          caption: item.caption || '',
          likes: item.likes_count || item.likes || 0,
          likedBy: item.liked_by || [],
          created_at: item.created_at || new Date().toISOString(),
          sessionId: item.session_id || item.user_id || 'legacy'
        }));
        localStorage.setItem('duda15_photos', JSON.stringify(photosList));
        renderFeed();
        return;
      }
    } catch (e) {
      console.warn('Erro ao carregar do Supabase:', e);
    }
  }

  const localData = localStorage.getItem('duda15_photos');
  if (localData) {
    try { photosList = JSON.parse(localData); } catch (e) {}
  }
  renderFeed();
}

function renderFeed() {
  const feed = document.getElementById('photosFeed');
  const emptyState = document.getElementById('emptyState');
  const myProfile = document.getElementById('myProfile');
  if (!feed) return;

  if (sortMode === 'my-photos') {
    feed.classList.add('hidden');
    if (emptyState) emptyState.classList.add('hidden');
    if (myProfile) {
      myProfile.classList.remove('hidden');
      renderMyProfile();
    }
    return;
  }

  if (myProfile) myProfile.classList.add('hidden');
  feed.classList.remove('hidden');

  let filtered = [...photosList];
  if (sortMode === 'highlights') {
    filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  } else {
    filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }

  if (filtered.length === 0) {
    feed.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  const guest = isGuestUser();

  feed.innerHTML = filtered.map(p => {
    const isLiked = (p.likedBy || []).includes(currentSessionId);

    return `
      <article class="group relative rounded-2xl overflow-hidden glass-card transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-1 gpu-accelerated">
        <div class="relative aspect-square overflow-hidden bg-slate-950 cursor-pointer" onclick="openLightbox('${p.id}')">
          <img src="${escapeHtml(p.url)}" alt="${escapeHtml(p.caption || 'Foto da festa')}" loading="lazy" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        
        <div class="p-3.5 flex flex-col gap-2">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0 cursor-pointer" onclick="openPublicProfile('${escapeHtml(p.sessionId)}')">
              <div class="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 flex items-center justify-center text-[10px] font-bold text-slate-950 shrink-0">
                ${escapeHtml((p.author || 'C')[0].toUpperCase())}
              </div>
              <span class="text-xs font-semibold text-slate-200 truncate hover:text-amber-300 transition-colors">${escapeHtml(p.author || 'Convidado')}</span>
            </div>
            
            <button onclick="toggleLike('${p.id}')" class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isLiked ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60'} transition-all active:scale-95">
              <svg class="w-3.5 h-3.5 ${isLiked ? 'fill-rose-400 stroke-rose-400' : 'stroke-current fill-none'}" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
              <span>${p.likes || 0}</span>
            </button>
          </div>
          
          ${p.caption ? `<p class="text-xs text-slate-300 line-clamp-2 font-light leading-relaxed">${escapeHtml(p.caption)}</p>` : ''}
          
          <div class="flex items-center justify-between pt-1 text-[10px] text-slate-400 border-t border-slate-800/40">
            <span>${formatTimeAgo(p.created_at)}</span>
            <div class="flex items-center gap-2">
              ${p.sessionId === currentSessionId ? `
                <button onclick="openEditCaptionModal('${p.id}')" class="hover:text-amber-300 transition-colors">Editar</button>
                <button onclick="confirmDeletePhoto('${p.id}')" class="hover:text-rose-400 transition-colors">Excluir</button>
              ` : ''}
            </div>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function renderMyProfile() {
  const container = document.getElementById('myProfileContent');
  if (!container) return;

  const myPhotos = photosList.filter(p => p.sessionId === currentSessionId);
  const guest = isGuestUser();

  const authorName = rememberedAuthor || 'Convidado';
  const totalLikes = myPhotos.reduce((acc, curr) => acc + (curr.likes || 0), 0);

  let avatarHtml = `<div class="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 flex items-center justify-center text-2xl font-bold text-slate-950 shadow-xl border-2 border-amber-300/50">${escapeHtml(authorName[0].toUpperCase())}</div>`;
  if (profilePhoto) {
    avatarHtml = `<img src="${escapeHtml(profilePhoto)}" alt="Perfil" class="w-20 h-20 rounded-full object-cover shadow-xl border-2 border-amber-300/50" />`;
  }

  container.innerHTML = `
    <div class="p-6 rounded-3xl glass-panel border border-amber-500/20 shadow-2xl mb-8 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
      <div class="relative group cursor-pointer" onclick="openProfilePhotoModal()">
        ${avatarHtml}
        <div class="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-xs text-white font-medium">Alterar</div>
      </div>
      
      <div class="flex-1">
        <div class="flex items-center justify-center sm:justify-start gap-2">
          <h2 class="text-xl font-bold text-slate-100">${escapeHtml(authorName)}</h2>
          <button onclick="openProfilePhotoModal()" class="text-amber-400 hover:text-amber-300 text-xs font-medium underline">Editar Nome</button>
        </div>
        <div class="flex items-center justify-center sm:justify-start gap-6 mt-3 text-xs text-slate-300">
          <div><strong class="text-amber-300 text-sm font-semibold">${myPhotos.length}</strong> publicações</div>
          <div><strong class="text-rose-400 text-sm font-semibold">${totalLikes}</strong> curtidas</div>
        </div>
      </div>
    </div>

    ${guest ? `
      <div class="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 text-center mb-6">
        <h4 class="text-sm font-semibold text-amber-300 mb-1">Você está no Modo Convidado Rápido</h4>
        <p class="text-xs text-slate-300 mb-3 font-light">Crie uma conta para salvar permanentemente suas fotos e personalizar seu perfil completo!</p>
        <button onclick="showIdentityIfNeeded(true)" class="px-5 py-2 rounded-xl gold-button text-xs font-semibold shadow-lg">Conectar / Criar Conta</button>
      </div>
    ` : ''}

    <h3 class="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
      <span>Minhas Publicações</span>
      <span class="text-xs font-normal text-slate-400">(${myPhotos.length})</span>
    </h3>

    ${myPhotos.length === 0 ? `
      <div class="text-center py-12 glass-panel rounded-2xl border border-slate-800/40 text-slate-400">
        <p class="text-xs">Você ainda não compartilhou nenhuma foto.</p>
      </div>
    ` : `
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        ${myPhotos.map(p => `
          <div class="relative aspect-square rounded-xl overflow-hidden glass-card group cursor-pointer" onclick="openLightbox('${p.id}')">
            <img src="${escapeHtml(p.url)}" alt="Minha foto" loading="lazy" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-xs text-white">
              <span class="flex items-center gap-1"><svg class="w-4 h-4 fill-rose-400" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>${p.likes || 0}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `}
  `;
}

async function toggleLike(id) {
  const p = photosList.find(x => x.id === id);
  if (!p) return;

  if (!p.likedBy) p.likedBy = [];
  const index = p.likedBy.indexOf(currentSessionId);

  if (index > -1) {
    p.likedBy.splice(index, 1);
    p.likes = Math.max(0, (p.likes || 1) - 1);
  } else {
    p.likedBy.push(currentSessionId);
    p.likes = (p.likes || 0) + 1;
    addNotification('Publicação Curtida', `Você curtiu a publicação de ${p.author || 'um convidado'}!`, 'like');
  }

  localStorage.setItem('duda15_photos', JSON.stringify(photosList));
  renderFeed();

  if (supabaseClient) {
    try {
      await supabaseClient.from('photos').update({
        likes_count: p.likes,
        liked_by: p.likedBy
      }).eq('id', id);
    } catch (e) {
      console.warn('Erro ao atualizar curtida no Supabase:', e);
    }
  }
}

async function uploadPhoto(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (isGuestUser()) {
    showToast('Recurso Restrito', 'Convidados podem apenas curtir e visualizar. Crie uma conta para publicar!', 'info');
    showIdentityIfNeeded(true);
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    showToast('Arquivo Muito Grande', 'Por favor escolha uma foto com menos de 10MB.', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = async function(e) {
    const dataUrl = e.target.result;
    const newPhoto = {
      id: 'photo_' + Date.now(),
      url: dataUrl,
      author: rememberedAuthor || 'Convidado',
      caption: '',
      likes: 0,
      likedBy: [],
      created_at: new Date().toISOString(),
      sessionId: currentSessionId
    };

    photosList.unshift(newPhoto);
    localStorage.setItem('duda15_photos', JSON.stringify(photosList));
    renderFeed();
    addNotification('Publicação Carregada', 'Sua foto foi compartilhada com sucesso no mural!', 'upload');

    if (supabaseClient) {
      try {
        await supabaseClient.from('photos').insert([{
          image_url: dataUrl,
          author_name: rememberedAuthor || 'Convidado',
          caption: '',
          likes_count: 0,
          liked_by: [],
          session_id: currentSessionId
        }]);
      } catch (err) {
        console.warn('Erro ao salvar foto no Supabase:', err);
      }
    }
  };
  reader.readAsDataURL(file);
}

function openLightbox(id) {
  const p = photosList.find(x => x.id === id);
  if (!p) return;

  const modal = document.getElementById('lightboxModal');
  const img = document.getElementById('lightboxImg');
  const author = document.getElementById('lightboxAuthor');
  const caption = document.getElementById('lightboxCaption');
  const time = document.getElementById('lightboxTime');

  if (img) img.src = p.url;
  if (author) author.textContent = p.author || 'Convidado';
  if (caption) caption.textContent = p.caption || '';
  if (time) time.textContent = formatTimeAgo(p.created_at);

  if (modal) modal.classList.remove('hidden');
}

function closeLightbox() {
  const modal = document.getElementById('lightboxModal');
  if (modal) modal.classList.add('hidden');
}

function openEditCaptionModal(id) {
  editingCaptionPhotoId = id;
  const p = photosList.find(x => x.id === id);
  if (!p) return;

  const modal = document.getElementById('editCaptionModal');
  const input = document.getElementById('editCaptionInput');
  if (input) input.value = p.caption || '';
  if (modal) modal.classList.remove('hidden');
}

function closeEditCaptionModal() {
  const modal = document.getElementById('editCaptionModal');
  if (modal) modal.classList.add('hidden');
  editingCaptionPhotoId = null;
}

async function saveCaption() {
  if (!editingCaptionPhotoId) return;
  const input = document.getElementById('editCaptionInput');
  const newCaption = (input ? input.value : '').trim();

  const p = photosList.find(x => x.id === editingCaptionPhotoId);
  if (p) {
    p.caption = newCaption;
    localStorage.setItem('duda15_photos', JSON.stringify(photosList));
    renderFeed();
    showToast('Legenda Atualizada', 'Sua legenda foi salva com sucesso.', 'success');

    if (supabaseClient) {
      try {
        await supabaseClient.from('photos').update({ caption: newCaption }).eq('id', editingCaptionPhotoId);
      } catch (e) {
        console.warn('Erro ao atualizar legenda no Supabase:', e);
      }
    }
  }
  closeEditCaptionModal();
}

function confirmDeletePhoto(id) {
  showConfirmModal('Excluir Publicação', 'Tem certeza de que deseja remover esta foto permanentemente?', () => {
    deletePhotoConfirmed(id);
  });
}

async function deletePhotoConfirmed(id) {
  photosList = photosList.filter(p => p.id !== id);
  localStorage.setItem('duda15_photos', JSON.stringify(photosList));
  renderFeed();
  addNotification('Foto Removida', 'Uma foto foi deletada do mural.', 'delete');

  if (supabaseClient) {
    try {
      await supabaseClient.from('photos').delete().eq('id', id);
    } catch (e) {
      console.warn('Erro ao deletar no Supabase:', e);
    }
  }
}

function openProfilePhotoModal() {
  const modal = document.getElementById('profilePhotoModal');
  const nameInput = document.getElementById('profileNameInput');
  const photoInput = document.getElementById('profilePhotoUrlInput');
  if (nameInput) nameInput.value = rememberedAuthor || '';
  if (photoInput) photoInput.value = profilePhoto || '';
  if (modal) modal.classList.remove('hidden');
}

function closeProfilePhotoModal() {
  const modal = document.getElementById('profilePhotoModal');
  if (modal) modal.classList.add('hidden');
}

async function saveProfilePhoto() {
  const nameInput = document.getElementById('profileNameInput');
  const photoInput = document.getElementById('profilePhotoUrlInput');
  const nextName = (nameInput ? nameInput.value : '').trim();
  const nextPhoto = (photoInput ? photoInput.value : '').trim();

  if (nextName) {
    rememberedAuthor = nextName;
    localStorage.setItem('duda15_author', nextName);
  }

  if (nextPhoto !== profilePhoto) {
    profilePhoto = nextPhoto;
    localStorage.setItem('duda15_profile_photo', profilePhoto);
    addNotification('Foto de Perfil Carregada', 'Sua nova foto de perfil foi definida com sucesso!', 'profile');
  } else if (nextName) {
    addNotification('Perfil Atualizado', 'Seus dados de perfil foram atualizados com sucesso!', 'profile');
  }

  closeProfilePhotoModal();
  renderFeed();
}

function setSortMode(mode) {
  sortMode = mode;

  ['tabRecent', 'tabHighlights', 'tabMyPhotos'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.className = 'px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-400 hover:text-slate-200 transition-all';
  });

  if (mode === 'recent') {
    const el = document.getElementById('tabRecent'); if (el) el.className = 'px-3.5 py-1.5 rounded-full text-xs font-medium gold-button transition-all';
  } else if (mode === 'highlights') {
    const el = document.getElementById('tabHighlights'); if (el) el.className = 'px-3.5 py-1.5 rounded-full text-xs font-medium gold-button transition-all';
  } else if (mode === 'my-photos') {
    const el = document.getElementById('tabMyPhotos'); if (el) el.className = 'px-3.5 py-1.5 rounded-full text-xs font-medium gold-button transition-all';
  }

  ['navMural', 'navDestaques', 'navMinhas'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.className = 'flex flex-col items-center justify-center gap-0.5 p-1.5 text-slate-400 transition-colors';
  });

  if (mode === 'recent') {
    const el = document.getElementById('navMural'); if (el) el.className = 'flex flex-col items-center justify-center gap-0.5 p-1.5 text-amber-300 transition-colors';
  } else if (mode === 'highlights') {
    const el = document.getElementById('navDestaques'); if (el) el.className = 'flex flex-col items-center justify-center gap-0.5 p-1.5 text-amber-300 transition-colors';
  } else if (mode === 'my-photos') {
    const el = document.getElementById('navMinhas'); if (el) el.className = 'flex flex-col items-center justify-center gap-0.5 p-1.5 text-amber-300 transition-colors';
  }

  renderFeed();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function searchGuestProfiles() {
  const input = document.getElementById('guestSearchInput');
  const results = document.getElementById('guestSearchResults');
  if (!input || !results) return;

  const query = input.value.trim().toLowerCase();
  if (!query) {
    results.classList.add('hidden');
    return;
  }

  const profilesMap = new Map();
  photosList.forEach(p => {
    if (p.author && p.sessionId) {
      if (!profilesMap.has(p.sessionId)) {
        profilesMap.set(p.sessionId, { name: p.author, sessionId: p.sessionId, count: 1 });
      } else {
        profilesMap.get(p.sessionId).count++;
      }
    }
  });

  const matches = Array.from(profilesMap.values()).filter(p => p.name.toLowerCase().includes(query));
  if (matches.length === 0) {
    results.innerHTML = `<div class="p-3 text-xs text-slate-400 text-center">Nenhum convidado encontrado.</div>`;
  } else {
    results.innerHTML = matches.map(p => `
      <div onclick="selectGuestProfile('${escapeHtml(p.sessionId)}')" class="flex items-center justify-between p-2.5 hover:bg-slate-800/60 rounded-xl cursor-pointer transition-colors">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold flex items-center justify-center">${escapeHtml(p.name[0].toUpperCase())}</div>
          <span class="text-xs font-medium text-slate-200">${escapeHtml(p.name)}</span>
        </div>
        <span class="text-[10px] text-slate-400">${p.count} fotos</span>
      </div>
    `).join('');
  }
  results.classList.remove('hidden');
}

function selectGuestProfile(sessionId) {
  const input = document.getElementById('guestSearchInput');
  const results = document.getElementById('guestSearchResults');
  if (input) input.value = '';
  if (results) results.classList.add('hidden');
  openPublicProfile(sessionId);
}

function openPublicProfile(sessionId) {
  const userPhotos = photosList.filter(p => p.sessionId === sessionId);
  if (userPhotos.length === 0) return;

  const authorName = userPhotos[0].author || 'Convidado';
  const modal = document.getElementById('publicProfileModal');
  const title = document.getElementById('publicProfileTitle');
  const grid = document.getElementById('publicProfileGrid');

  if (title) title.textContent = `Publicações de ${authorName}`;
  if (grid) {
    grid.innerHTML = userPhotos.map(p => `
      <div class="relative aspect-square rounded-xl overflow-hidden glass-card cursor-pointer group" onclick="openLightbox('${p.id}')">
        <img src="${escapeHtml(p.url)}" alt="Foto" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
      </div>
    `).join('');
  }

  if (modal) modal.classList.remove('hidden');
}

function closePublicProfileModal() {
  const modal = document.getElementById('publicProfileModal');
  if (modal) modal.classList.add('hidden');
}

document.addEventListener('click', function(event) {
  const searchArea = document.getElementById('guestSearchInput');
  const results = document.getElementById('guestSearchResults');
  if (!searchArea || !results) return;
  if (event.target !== searchArea && !results.contains(event.target)) {
    results.classList.add('hidden');
  }
});

window.addEventListener('DOMContentLoaded', () => {
  if (typeof initStarryCanvas === 'function') {
    initStarryCanvas();
  }
});
