// =========================================================================
// GESTÃO DE AUTENTICAÇÃO E SESSÃO (Supabase & Convidado Rápido)
// =========================================================================

let supabaseUrl = 'https://fmvucmpomfogfzfdpfln.supabase.co';
let supabaseAnonKey = 'sb_publishable_hJJu5Ytx26zgGbHhCLmh5A_aVIHoK6d';
let supabaseClient = null;

let currentSessionId = localStorage.getItem('duda15_session') || null;
let rememberedAuthor = localStorage.getItem('duda15_author') || '';
let profilePhoto = localStorage.getItem('duda15_profile_photo') || '';
let accountMode = 'guest';
let accountReady = false;
let supabaseUserSession = null;

// Inicializa cliente Supabase e registra listener imediatamente
if (supabaseUrl && supabaseAnonKey && typeof supabase !== 'undefined') {
  try {
    supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });

    // Listener global de autenticação
    supabaseClient.auth.onAuthStateChange((event, session) => {
      if (session && session.user) {
        setAccountSession(session.user);
      } else if (event === 'SIGNED_OUT') {
        supabaseUserSession = null;
        currentSessionId = null;
        localStorage.removeItem('duda15_session');
        localStorage.setItem('duda15_is_guest', 'false');
        if (typeof renderFeed === 'function') renderFeed();
      }
    });
  } catch (e) {
    console.error('Erro ao iniciar o Supabase:', e);
  }
}

// Verifica se o usuário atual é Convidado Rápido ou Conta Autenticada
function isGuestUser() {
  // 1. Se existe sessão do Supabase ativa com id de usuário
  if (supabaseUserSession && supabaseUserSession.id) {
    return false;
  }

  // 2. Se o currentSessionId é de um usuário real (não começa com 'guest_')
  if (currentSessionId && !currentSessionId.startsWith('guest_')) {
    if (localStorage.getItem('duda15_is_guest') === 'true') {
      localStorage.setItem('duda15_is_guest', 'false');
    }
    return false;
  }

  // 3. Checa a flag explícita de convidado
  const isGuestFlag = localStorage.getItem('duda15_is_guest');
  if (isGuestFlag === 'false') return false;
  if (isGuestFlag === 'true') return true;
  if (currentSessionId && currentSessionId.startsWith('guest_')) return true;

  return false;
}

function showIdentityIfNeeded(force = false) {
  if (accountReady && !force) return;
  const identityOverlay = document.getElementById('identityOverlay');
  if (identityOverlay) {
    identityOverlay.classList.remove('hidden');
    const input = document.getElementById('quickGuestName');
    if (input) setTimeout(() => input.focus(), 100);
  }
}

function closeIdentityModal() {
  const identityOverlay = document.getElementById('identityOverlay');
  if (identityOverlay) identityOverlay.classList.add('hidden');
}

async function initializeAccount() {
  if (supabaseClient) {
    try {
      const { data } = await supabaseClient.auth.getSession();
      if (data && data.session && data.session.user) {
        setAccountSession(data.session.user);
        if (typeof loadPhotos === 'function') loadPhotos();
        if (typeof updateNotificationBadge === 'function') updateNotificationBadge();
        return;
      }
    } catch (e) {
      console.warn('Erro ao verificar sessão Supabase:', e);
    }
  }

  if (currentSessionId && rememberedAuthor) {
    accountReady = true;
    closeIdentityModal();
  } else {
    showIdentityIfNeeded();
  }

  if (typeof loadPhotos === 'function') loadPhotos();
  if (typeof updateNotificationBadge === 'function') updateNotificationBadge();
}

function setAccountSession(user) {
  if (!user) return;
  supabaseUserSession = user;
  accountReady = true;
  currentSessionId = user.id;

  localStorage.setItem('duda15_session', currentSessionId);
  localStorage.setItem('duda15_is_guest', 'false');

  const metadata = user.user_metadata || {};
  const savedName = metadata.display_name || metadata.full_name || metadata.name || (user.email || '').split('@')[0];
  if (savedName) {
    rememberedAuthor = savedName;
    localStorage.setItem('duda15_author', savedName);
  }
  if (metadata.avatar_url || metadata.picture) {
    profilePhoto = metadata.avatar_url || metadata.picture;
    localStorage.setItem('duda15_profile_photo', profilePhoto);
  }

  closeIdentityModal();
  if (typeof loadPhotos === 'function') loadPhotos();
}

function submitGuestIdentity(nameInput) {
  const name = (nameInput || '').trim();
  if (!name) {
    showToast('Nome Obrigatório', 'Por favor, digite seu nome.', 'error');
    return;
  }
  rememberedAuthor = name;
  localStorage.setItem('duda15_author', name);
  localStorage.setItem('duda15_is_guest', 'true');
  if (!currentSessionId || !currentSessionId.startsWith('guest_')) {
    currentSessionId = 'guest_' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('duda15_session', currentSessionId);
  }
  accountReady = true;
  closeIdentityModal();
  if (typeof loadPhotos === 'function') loadPhotos();
  showToast('Bem-vindo ao Mural', `Olá ${name}! Você está no modo Convidado Rápido.`, 'success');
}

function setAccountTab(mode) {
  accountMode = mode;
  const guestTab = document.getElementById('tabAuthGuest');
  const accountTab = document.getElementById('tabAuthAccount');
  const guestForm = document.getElementById('guestFormSection');
  const accountForm = document.getElementById('accountFormSection');

  if (mode === 'guest') {
    if (guestTab) guestTab.className = 'flex-1 py-2 text-xs font-semibold rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30';
    if (accountTab) accountTab.className = 'flex-1 py-2 text-xs font-medium rounded-xl text-slate-400 hover:text-slate-200';
    if (guestForm) guestForm.classList.remove('hidden');
    if (accountForm) accountForm.classList.add('hidden');
  } else {
    if (guestTab) guestTab.className = 'flex-1 py-2 text-xs font-medium rounded-xl text-slate-400 hover:text-slate-200';
    if (accountTab) accountTab.className = 'flex-1 py-2 text-xs font-semibold rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30';
    if (guestForm) guestForm.classList.add('hidden');
    if (accountForm) accountForm.classList.remove('hidden');
  }
}

function toggleAccountMode() {
  const signup = accountMode === 'signup';
  accountMode = signup ? 'signin' : 'signup';
  const name = document.getElementById('welcomeNameInput');
  const password = document.getElementById('accountPassword');
  const title = document.getElementById('accountAuthTitle');
  const btn = document.getElementById('accountAuthSubmitBtn');
  const toggle = document.getElementById('accountAuthToggleText');

  if (name) {
    name.classList.toggle('hidden', signup);
    name.required = !signup;
  }
  if (password) {
    password.autocomplete = !signup ? 'new-password' : 'current-password';
    password.placeholder = !signup ? 'Crie uma senha (mínimo 6 caracteres)' : 'Sua senha';
  }
  if (title) title.textContent = !signup ? 'Criar Nova Conta' : 'Acessar Sua Conta';
  if (btn) btn.textContent = !signup ? 'Criar Conta' : 'Entrar';
  if (toggle) toggle.innerHTML = !signup ? 'Já tem conta? <span class="text-amber-400 underline cursor-pointer">Entrar</span>' : 'Não tem conta? <span class="text-amber-400 underline cursor-pointer">Cadastrar</span>';
}

async function submitAccountAuth(e) {
  e.preventDefault();
  if (!supabaseClient) {
    showToast('Modo Local', 'Supabase não inicializado.', 'info');
    const name = document.getElementById('welcomeNameInput')?.value || '';
    if (name) submitGuestIdentity(name);
    return;
  }

  const email = document.getElementById('accountEmail')?.value;
  const password = document.getElementById('accountPassword')?.value;
  const name = document.getElementById('welcomeNameInput')?.value;

  if (accountMode === 'signup') {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: { data: { display_name: name || rememberedAuthor || 'Usuário' } }
    });
    if (error) {
      showToast('Erro no Cadastro', error.message, 'error');
      return;
    }
    if (data && data.user) {
      setAccountSession(data.user);
      showToast('Conta Criada', `Bem-vindo, ${name || 'Usuário'}!`, 'success');
    }
  } else {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      showToast('Erro no Login', error.message, 'error');
      return;
    }
    if (data && data.session) {
      setAccountSession(data.session.user);
      showToast('Login Efetuado', 'Bem-vindo de volta!', 'success');
    }
  }
}

async function signInWithGoogle() {
  if (!supabaseClient) {
    showToast('Serviço Indisponível', 'O serviço de contas não está disponível.', 'error');
    return;
  }
  localStorage.setItem('duda15_is_guest', 'false');

  const redirectTo = window.location.href.split('#')[0].split('?')[0];
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: redirectTo }
  });
  if (error) {
    console.error('Erro no login com Google:', error);
    showToast('Erro no Google Login', error.message, 'error');
  }
}

function dismissEntrance() {
  const overlay = document.getElementById('entranceOverlay');
  if (overlay) overlay.remove();
}

// Executa verificação inicial de conta
initializeAccount();
setTimeout(dismissEntrance, 2000);
