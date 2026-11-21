// ==============================================================================
// CLIENTE DE INTEGRAÇÃO COM GOOGLE IDENTITY SERVICES, DRIVE E SHEETS (APPS SCRIPT)
// ==============================================================================

const GOOGLE_API = (function () {
  // Configuração padrão. Pode ser sobrescrita pelo usuário em GOOGLE_CONFIG ou no localStorage.
  const config = {
    appsScriptUrl: localStorage.getItem('duda15_apps_script_url') || (window.GOOGLE_CONFIG && window.GOOGLE_CONFIG.APPS_SCRIPT_URL) || '',
    clientId: localStorage.getItem('duda15_google_client_id') || (window.GOOGLE_CONFIG && window.GOOGLE_CONFIG.GOOGLE_CLIENT_ID) || '',
  };

  // Cache em memória para mídias carregadas
  const mediaCache = new Map();

  function setConfig(newConfig) {
    if (newConfig.appsScriptUrl) {
      config.appsScriptUrl = newConfig.appsScriptUrl.trim();
      localStorage.setItem('duda15_apps_script_url', config.appsScriptUrl);
    }
    if (newConfig.clientId) {
      config.clientId = newConfig.clientId.trim();
      localStorage.setItem('duda15_google_client_id', config.clientId);
    }
  }

  function getConfig() {
    return { ...config };
  }

  function isConfigured() {
    return Boolean(config.appsScriptUrl && config.appsScriptUrl.startsWith('http') && !config.appsScriptUrl.includes('SEU_SCRIPT_ID'));
  }

  // Recupera token da sessão atual
  function getAuthTokens() {
    return {
      idToken: localStorage.getItem('duda15_google_token') || '',
      sessionToken: localStorage.getItem('duda15_session_token') || '',
      userSub: localStorage.getItem('duda15_session') || '',
    };
  }

  /**
   * Executa chamada à API do Google Apps Script.
   * Envia POST com corpo em text/plain para EVITAR pré-voo CORS (OPTIONS),
   * garantindo funcionamento impecável no GitHub Pages e navegadores mobile.
   */
  async function callApi(action, payload = {}, method = 'POST') {
    if (!isConfigured()) {
      console.warn('[Google API] URL do Google Apps Script ainda não configurada.');
      return { success: false, error: 'CONFIG_MISSING', message: 'Configure a URL do Apps Script.' };
    }

    const auth = getAuthTokens();
    const finalPayload = {
      action,
      idToken: auth.idToken,
      sessionToken: auth.sessionToken,
      userSub: auth.userSub,
      ...payload
    };

    try {
      if (method === 'GET') {
        const queryParams = new URLSearchParams();
        Object.keys(finalPayload).forEach(k => {
          if (finalPayload[k] !== undefined && finalPayload[k] !== null && typeof finalPayload[k] !== 'object') {
            queryParams.append(k, finalPayload[k]);
          }
        });
        const url = `${config.appsScriptUrl}?${queryParams.toString()}`;
        const res = await fetch(url, { method: 'GET', mode: 'cors' });
        return await res.json();
      }

      // POST com text/plain
      const res = await fetch(config.appsScriptUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(finalPayload)
      });

      return await res.json();
    } catch (err) {
      console.error(`[Google API Error] Falha na ação ${action}:`, err);
      return { success: false, error: 'NETWORK_ERROR', message: err.message || 'Erro de rede' };
    }
  }

  /**
   * Realiza login com o Google ID Token
   */
  async function manualAuth(action, credentials) {
    const res = await callApi(action, credentials, 'POST');
    if (res && res.success && res.user) {
      localStorage.setItem('duda15_session_token', res.sessionToken || '');
      localStorage.setItem('duda15_session', res.user.sub || '');
      localStorage.setItem('duda15_author', res.user.name || '');
      localStorage.setItem('duda15_profile_photo', res.user.picture || '');
      localStorage.setItem('duda15_user_role', res.user.role || 'convidado');
      localStorage.setItem('duda15_user_email', res.user.email || '');
    }
    return res;
  }

  async function loginGoogle(idToken) {
    const res = await callApi('loginGoogle', { idToken, clientId: config.clientId }, 'POST');
    if (res && res.success && res.user) {
      localStorage.setItem('duda15_google_token', idToken);
      localStorage.setItem('duda15_session_token', res.sessionToken || '');
      localStorage.setItem('duda15_session', res.user.sub);
      localStorage.setItem('duda15_author', res.user.name || '');
      localStorage.setItem('duda15_profile_photo', res.user.picture || '');
      localStorage.setItem('duda15_user_role', res.user.role || 'convidado');
      localStorage.setItem('duda15_user_email', res.user.email || '');
    }
    return res;
  }

  /**
   * Obtém lista de publicações ativas
   */
  async function getPosts() {
    const auth = getAuthTokens();
    const res = await callApi('getPosts', { userSub: auth.userSub }, 'GET');
    return res;
  }

  /**
   * Carrega mídia (foto em alta resolução ou dados de vídeo) com autenticação
   */
  async function getMedia(fileId) {
    if (!fileId) return null;
    if (mediaCache.has(fileId)) {
      return mediaCache.get(fileId);
    }
    const res = await callApi('getMedia', { fileId }, 'GET');
    if (res && res.success) {
      mediaCache.set(fileId, res);
    }
    return res;
  }

  /**
   * Cria nova publicação
   */
  async function createPost({ mediaType, caption, fileBase64, thumbnailBase64, mimeType, fileName }) {
    return await callApi('createPost', {
      mediaType,
      caption,
      fileBase64,
      thumbnailBase64,
      mimeType,
      fileName
    }, 'POST');
  }

  /**
   * Alterna curtida
   */
  async function toggleLike(postId) {
    return await callApi('toggleLike', { postId }, 'POST');
  }

  /**
   * Busca comentários de uma publicação
   */
  async function getComments(postId) {
    return await callApi('getComments', { postId }, 'GET');
  }

  /**
   * Adiciona comentário
   */
  async function addComment(postId, text) {
    return await callApi('addComment', { postId, text }, 'POST');
  }

  /**
   * Exclui comentário
   */
  async function deleteComment(commentId) {
    return await callApi('deleteComment', { commentId }, 'POST');
  }

  /**
   * Edita legenda da foto
   */
  async function editCaption(postId, caption) {
    return await callApi('editCaption', { postId, caption }, 'POST');
  }

  /**
   * Exclui publicação
   */
  async function deletePost(postId) {
    return await callApi('deletePost', { postId }, 'POST');
  }

  /**
   * Atualiza perfil (nome e/ou avatar)
   */
  async function updateProfile(name, avatarBase64) {
    return await callApi('updateProfile', { name, avatarBase64 }, 'POST');
  }

  /**
   * Estatísticas e moderação de fotos (Painel Admin)
   */
  async function adminGetStats() {
    return await callApi('adminGetStats', {}, 'POST');
  }

  async function adminAddGuest(email, name) {
    return await callApi('adminAddGuest', { email, name }, 'POST');
  }

  async function adminDeletePost(postId) {
    return await callApi('adminDeletePost', { postId }, 'POST');
  }

  /**
   * Desconecta sessão
   */
  function logout() {
    localStorage.removeItem('duda15_google_token');
    localStorage.removeItem('duda15_session_token');
    localStorage.removeItem('duda15_session');
    localStorage.removeItem('duda15_author');
    localStorage.removeItem('duda15_profile_photo');
    localStorage.removeItem('duda15_user_role');
    localStorage.removeItem('duda15_user_email');
    mediaCache.clear();
  }

  /**
   * Utilitário para compactar fotos no navegador
   */
  let heicConverterPromise = null;

  function loadHeicConverter() {
    if (window.HeicTo) return Promise.resolve(window.HeicTo);
    if (heicConverterPromise) return heicConverterPromise;
    heicConverterPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/heic-to@1.6.7/dist/iife/heic-to.js';
      script.async = true;
      script.onload = () => window.HeicTo ? resolve(window.HeicTo) : reject(new Error('O conversor HEIC não carregou corretamente.'));
      script.onerror = () => { heicConverterPromise = null; reject(new Error('Não foi possível carregar o conversor de fotos HEIC. Verifique sua conexão e tente novamente.')); };
      document.head.appendChild(script);
    });
    return heicConverterPromise;
  }

  async function isHeicImage(file) {
    if (/\.(heic|heif)$/i.test(file.name || '') || /image\/(heic|heif)/i.test(file.type || '')) return true;
    try {
      const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
      const brand = String.fromCharCode(...bytes.slice(8, 12)).toLowerCase();
      return ['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'].includes(brand);
    } catch (_) { return false; }
  }

  async function compressImage(file, maxDimension = 1920, quality = 0.85) {
    let sourceFile = file;
    if (await isHeicImage(file)) {
      try {
        const convertHeic = await loadHeicConverter();
        const jpegBlob = await convertHeic({ blob: file, type: 'image/jpeg', quality: 0.92 });
        if (!(jpegBlob instanceof Blob) || !jpegBlob.size) throw new Error('A conversão não gerou uma imagem válida.');
        const outputName = (file.name || 'foto').replace(/\.(heic|heif)$/i, '') + '.jpg';
        sourceFile = new File([jpegBlob], outputName, { type: 'image/jpeg', lastModified: file.lastModified || Date.now() });
      } catch (error) {
        throw new Error(error?.message || 'Não foi possível converter esta foto HEIC. Tente novamente ou salve-a como JPG.');
      }
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error(reader.error?.message || 'O navegador não conseguiu ler o arquivo escolhido. Tente salvar a imagem como JPG ou PNG e enviar novamente.'));
      reader.onabort = () => reject(new Error('A leitura da imagem foi cancelada. Selecione o arquivo novamente.'));
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error('Este formato de imagem não é compatível com o navegador. Salve a foto como JPG ou PNG e tente novamente.'));
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          if (w > maxDimension || h > maxDimension) {
            if (w > h) {
              h = Math.round((h * maxDimension) / w);
              w = maxDimension;
            } else {
              w = Math.round((w * maxDimension) / h);
              h = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Não foi possível preparar a imagem neste navegador. Tente novamente ou use outro navegador.'));
          ctx.drawImage(img, 0, 0, w, h);

          // Gera versão principal WebP
          const mainDataUrl = canvas.toDataURL('image/webp', quality);

          // Gera miniatura ultra leve (400px, 70% qualidade) para o feed carregar em milissegundos
          let thumbW = w;
          let thumbH = h;
          const maxThumb = 400;
          if (thumbW > maxThumb || thumbH > maxThumb) {
            if (thumbW > thumbH) {
              thumbH = Math.round((thumbH * maxThumb) / thumbW);
              thumbW = maxThumb;
            } else {
              thumbW = Math.round((thumbW * maxThumb) / thumbH);
              thumbH = maxThumb;
            }
          }
          const thumbCanvas = document.createElement('canvas');
          thumbCanvas.width = thumbW;
          thumbCanvas.height = thumbH;
          const thumbCtx = thumbCanvas.getContext('2d');
          if (!thumbCtx) return reject(new Error('Não foi possível preparar a miniatura da imagem. Tente novamente.'));
          thumbCtx.drawImage(img, 0, 0, thumbW, thumbH);
          const thumbDataUrl = thumbCanvas.toDataURL('image/webp', 0.70);

          resolve({
            mainDataUrl,
            thumbDataUrl,
            width: w,
            height: h
          });
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(sourceFile);
    });
  }

  return {
    setConfig,
    getConfig,
    isConfigured,
    getAuthTokens,
    loginGoogle,
    manualAuth,
    getPosts,
    getMedia,
    createPost,
    toggleLike,
    getComments,
    addComment,
    deleteComment,
    editCaption,
    deletePost,
    updateProfile,
    adminGetStats,
    adminAddGuest,
    adminDeletePost,
    logout,
    compressImage
  };
})();

// Expõe globalmente
window.GOOGLE_API = GOOGLE_API;
