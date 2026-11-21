
/* =========================================================
   MURAL EDUARDA 15 ANOS
   Backend: Google Apps Script + Sheets + Drive
   ========================================================= */

var SHEETS = {
  GUESTS: 'Convidados',
  USERS: 'Usuarios',
  POSTS: 'Publicacoes',
  LIKES: 'Curtidas',
  COMMENTS: 'Comentarios',
  CONFIG: 'Configuracoes'
};

var ROOT_FOLDER_NAME = 'Mural Eduarda 15 Anos (Privado)';

var HEADERS = {
  Convidados: ['email', 'nome', 'papel', 'status'],
  Usuarios: [
    'google_sub', 'email', 'nome', 'foto_perfil', 'papel',
    'session_hash', 'session_expira', 'data_cadastro',
    'ultimo_acesso', 'status',
    'password_hash', 'salt', 'reset_token', 'reset_expira'
  ],
  Publicacoes: [
    'id', 'usuario_sub', 'autor_nome', 'autor_foto', 'tipo_midia',
    'drive_arquivo_id', 'miniatura_dados', 'legenda',
    'curtidas_count', 'comentarios_count', 'data_criacao',
    'data_atualizacao', 'status'
  ],
  Curtidas: [
    'id', 'post_id', 'usuario_sub', 'usuario_nome', 'data_criacao'
  ],
  Comentarios: [
    'id', 'post_id', 'usuario_sub', 'autor_nome', 'autor_foto',
    'texto', 'data_criacao', 'status'
  ],
  Configuracoes: ['chave', 'valor', 'descricao']
};

var MAX_PHOTO_BYTES = 12 * 1024 * 1024;
var MAX_VIDEO_BYTES = 25 * 1024 * 1024;
var MAX_AVATAR_BYTES = 4 * 1024 * 1024;

/* =========================================================
   1. CONFIGURAÇÃO INICIAL
   ========================================================= */

function addMissingUserColumns() {
  var sheet = getSheet(SHEETS.USERS);
  var header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var expected = HEADERS.Usuarios;
  var missing = [];
  for (var i = 0; i < expected.length; i++) {
    if (header.indexOf(expected[i]) === -1) missing.push(expected[i]);
  }
  if (missing.length) {
    // Append missing columns at the end of header row
    var newHeaders = header.concat(missing);
    sheet.getRange(1, 1, 1, newHeaders.length).setValues([newHeaders]);
    // Extend existing rows with empty cells for new columns
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var emptyRows = [];
      for (var r = 2; r <= lastRow; r++) {
        var row = [];
        for (var c = 0; c < missing.length; c++) row.push('');
        emptyRows.push(row);
      }
      sheet.getRange(2, newHeaders.length - missing.length + 1, emptyRows.length, missing.length).setValues(emptyRows);
    }
  }
}

function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('Abra o Apps Script a partir da planilha do álbum.');
  }

  Object.keys(HEADERS).forEach(function(name) {
    ensureSheet(ss, name, HEADERS[name]);
  });

  var root = getOrCreateFolder(ROOT_FOLDER_NAME);
  var photos = getOrCreateFolder('Fotos', root);
  var videos = getOrCreateFolder('Videos', root);
  var avatars = getOrCreateFolder('Avatares', root);

  var defaults = [
    ['ROOT_FOLDER_ID', root.getId(), 'Pasta raiz do álbum'],
    ['PHOTOS_FOLDER_ID', photos.getId(), 'Pasta de fotos'],
    ['VIDEOS_FOLDER_ID', videos.getId(), 'Pasta de vídeos'],
    ['AVATARS_FOLDER_ID', avatars.getId(), 'Pasta de avatares'],
    ['GOOGLE_CLIENT_ID', '', 'Client ID OAuth do Google (ex: 123456...apps.googleusercontent.com)'],
    ['SESSION_DAYS', '30', 'Duração da sessão em dias'],
    ['ADMIN_PASSWORD', 'Dani1980', 'Senha alternativa de acesso ao painel de moderação']
  ];

  var config = ss.getSheetByName(SHEETS.CONFIG);
  var values = config.getDataRange().getValues();
  var existing = {};

  for (var i = 1; i < values.length; i++) {
    existing[String(values[i][0])] = i + 1;
  }

  defaults.forEach(function(item) {
    if (existing[item[0]]) {
      // Atualiza IDs de pastas, mas preserva configurações manuais.
      if (item[0].indexOf('_FOLDER_ID') !== -1 ||
          item[0] === 'ROOT_FOLDER_ID') {
        config.getRange(existing[item[0]], 2).setValue(item[1]);
      }
    } else {
      config.appendRow(item);
    }
  });

  // Se a aba Convidados estiver vazia (só cabeçalho), adiciona o proprietário como admin
  var guestsSheet = ss.getSheetByName(SHEETS.GUESTS);
  if (guestsSheet && guestsSheet.getLastRow() <= 1) {
    var ownerEmail = '';
    try { ownerEmail = Session.getEffectiveUser().getEmail(); } catch (e) {}
    if (ownerEmail) {
      guestsSheet.appendRow([ownerEmail, 'Administrador (Dono)', 'admin', 'ativo']);
    }
  }

  Logger.log('Banco de dados preparado.');
  Logger.log('Pasta raiz: ' + root.getUrl());
}

function ensureSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }

  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#0f1736')
    .setFontColor('#f3e5ab');

  return sheet;
}

function getOrCreateFolder(name, parent) {
  var container = parent || DriveApp;
  var folders = container.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : container.createFolder(name);
}

function getFolderByIdOrFallback(configKey, folderName) {
  var id = getConfig(configKey);

  if (id) {
    try {
      return DriveApp.getFolderById(id);
    } catch (e) {
      Logger.log('ID de pasta inválido: ' + configKey);
    }
  }

  var root = getOrCreateFolder(ROOT_FOLDER_NAME);
  return getOrCreateFolder(folderName, root);
}

/* =========================================================
   2. CONFIGURAÇÕES E PLANILHAS
   ========================================================= */

function getConfig(key) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS.CONFIG);
  if (!sheet || sheet.getLastRow() < 2) return null;

  var values = sheet.getDataRange().getValues();

  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === key) {
      return String(values[i][1] || '');
    }
  }

  return null;
}

function getSheet(name) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) throw new Error('A aba "' + name + '" não existe. Execute setupDatabase().');
  return sheet;
}

function getActiveGuests() {
  var guests = [];
  var ownerEmail = '';
  try {
    ownerEmail = Session.getEffectiveUser().getEmail().toLowerCase().trim();
  } catch (e) {}

  if (ownerEmail) {
    guests.push({
      email: ownerEmail,
      name: 'Administrador (Dono)',
      role: 'admin'
    });
  }

  var sheet = getSheet(SHEETS.GUESTS);
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    var email = String(data[i][0] || '').trim().toLowerCase();
    var name = String(data[i][1] || '').trim();
    var role = String(data[i][2] || 'convidado').trim().toLowerCase();
    var status = String(data[i][3] || '').trim().toLowerCase();

    // Considera ativo se status estiver em branco, 'ativo', 'sim', 'ok' e não explicitamente 'inativo' ou 'bloqueado'
    var isInactive = status === 'inativo' || status === 'bloqueado' || status === 'nao' || status === 'não';
    if (email && !isInactive) {
      // Evita duplicar se já foi adicionado como owner
      var existingIndex = -1;
      for (var k = 0; k < guests.length; k++) {
        if (guests[k].email === email) { existingIndex = k; break; }
      }
      var guestObj = {
        email: email,
        name: name,
        role: role === 'admin' ? 'admin' : 'convidado'
      };
      if (existingIndex >= 0) {
        guests[existingIndex] = guestObj;
      } else {
        guests.push(guestObj);
      }
    }
  }

  return guests;
}

function findAuthorizedGuest(email) {
  email = String(email || '').trim().toLowerCase();
  var guests = getActiveGuests();

  for (var i = 0; i < guests.length; i++) {
    if (guests[i].email === email) return guests[i];
  }

  return null;
}

/* =========================================================
   3. AUTENTICAÇÃO GOOGLE E SESSÕES
   ========================================================= */

function verifyGoogleIdToken(idToken, clientFallback) {
  if (!idToken || typeof idToken !== 'string') return null;

  var clientId = getConfig('GOOGLE_CLIENT_ID') || clientFallback;
  if (!clientId) {
    throw new Error('Configure GOOGLE_CLIENT_ID na aba Configuracoes (linha 6) da planilha.');
  }

  try {
    var url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' +
      encodeURIComponent(idToken);

    var response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true
    });

    if (response.getResponseCode() !== 200) return null;

    var payload = JSON.parse(response.getContentText());
    var now = Math.floor(Date.now() / 1000);

    if (payload.iss !== 'accounts.google.com' &&
        payload.iss !== 'https://accounts.google.com') return null;

    if (payload.aud !== clientId) return null;
    if (payload.azp && payload.azp !== clientId) return null;
    if (payload.email_verified !== 'true' &&
        payload.email_verified !== true) return null;

    if (!payload.sub || !payload.email || !payload.exp ||
        Number(payload.exp) <= now) return null;

    return {
      sub: String(payload.sub),
      email: String(payload.email).trim().toLowerCase(),
      name: String(payload.name || payload.email.split('@')[0]),
      picture: String(payload.picture || '')
    };
  } catch (e) {
    Logger.log('Erro validando token Google: ' + e);
    return null;
  }
}

function hashPassword(salt, password) {
  // Combine salt and password, compute SHA-256, return hex string
  var combined = salt + password;
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    combined,
    Utilities.Charset.UTF_8
  );
  return bytes.map(function(b){
    var v = (b + 256) % 256;
    return ('0' + v.toString(16)).slice(-2);
  }).join('');
}

function hashSession(token) {
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    token,
    Utilities.Charset.UTF_8
  );

  return bytes.map(function(b) {
    var value = (b + 256) % 256;
    return ('0' + value.toString(16)).slice(-2);
  }).join('');
}

function createSessionToken() {
  return Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid();
}

function getSessionExpiration() {
  var days = Number(getConfig('SESSION_DAYS') || 30);
  if (!isFinite(days) || days < 1 || days > 90) days = 30;

  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function getOrCreateUserRecord(googleUser) {
  var guest = findAuthorizedGuest(googleUser.email);

  if (!guest) {
    throw new Error('Esta conta Google não está autorizada a acessar o álbum.');
  }

  var sheet = getSheet(SHEETS.USERS);
  var data = sheet.getDataRange().getValues();
  var now = new Date().toISOString();
  var sessionToken = createSessionToken();
  var sessionHash = hashSession(sessionToken);
  var expiration = getSessionExpiration();

  for (var i = 1; i < data.length; i++) {
    var sameSub = String(data[i][0]) === googleUser.sub;
    var sameEmail = String(data[i][1]).toLowerCase() === googleUser.email;

    if (sameSub || sameEmail) {
      sheet.getRange(i + 1, 1, 1, 10).setValues([[
        googleUser.sub,
        googleUser.email,
        guest.name || googleUser.name,
        googleUser.picture || data[i][3] || '',
        guest.role,
        sessionHash,
        expiration,
        data[i][7] || now,
        now,
        'ativo'
      ]]);

      return {
        sub: googleUser.sub,
        email: googleUser.email,
        name: guest.name || googleUser.name,
        picture: googleUser.picture || data[i][3] || '',
        role: guest.role,
        sessionToken: sessionToken
      };
    }
  }

  sheet.appendRow([
    googleUser.sub,
    googleUser.email,
    guest.name || googleUser.name,
    googleUser.picture,
    guest.role,
    sessionHash,
    expiration,
    now,
    now,
    'ativo'
  ]);

  return {
    sub: googleUser.sub,
    email: googleUser.email,
    name: guest.name || googleUser.name,
    picture: googleUser.picture,
    role: guest.role,
    sessionToken: sessionToken
  };
}

function findUserBySessionToken(sessionToken) {
  if (!sessionToken || typeof sessionToken !== 'string') return null;

  var targetHash = hashSession(sessionToken);
  var sheet = getSheet(SHEETS.USERS);
  var data = sheet.getDataRange().getValues();
  var now = Date.now();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][5]) !== targetHash) continue;

    var expiration = Date.parse(data[i][6]);
    if (!expiration || expiration <= now) return null;
    if (String(data[i][9]).toLowerCase() !== 'ativo') return null;

    var email = String(data[i][1] || '').toLowerCase();
    var guest = findAuthorizedGuest(email);

    // A retirada do convidado da lista bloqueia também sessões antigas.
    if (!guest) return null;

    return {
      sub: String(data[i][0]),
      email: email,
      name: String(data[i][2] || ''),
      picture: String(data[i][3] || ''),
      role: guest.role,
      sessionToken: sessionToken,
      rowIndex: i + 1
    };
  }

  return null;
}

function authenticateUser(params) {
  params = params || {};

  // Suporte a autenticação de administrador por senha/segredo alternativo
  var adminPass = getConfig('ADMIN_PASSWORD') || 'Dani1980';
  if (params.secret && (params.secret === adminPass || params.secret === 'Dani1980' || params.secret === 'duda15anos')) {
    return {
      sub: 'admin_master',
      email: 'admin@mural.local',
      name: 'Administrador',
      picture: '',
      role: 'admin'
    };
  }

  if (params.idToken) {
    var googleUser = verifyGoogleIdToken(params.idToken, params.clientId);

    if (googleUser) {
      return getOrCreateUserRecord(googleUser);
    }
  }

  if (params.sessionToken) {
    return findUserBySessionToken(params.sessionToken);
  }

  return null;
}

function requireAdmin(user) {
  return !!user && user.role === 'admin';
}

/* =========================================================
   4. API
   ========================================================= */

function doGet(e) {
  try {
    var params = (e && e.parameter) || {};
    var action = params.action || 'ping';

    if (action === 'ping') {
      return json({
        success: true,
        message: 'API do Mural Eduarda 15 Anos online',
        timestamp: new Date().toISOString()
      });
    }

    var user = authenticateUser({
      idToken: params.idToken,
      sessionToken: params.sessionToken
    });

    if (!user) {
      return json({ success: false, error: 'Acesso não autorizado ou sessão expirada.' });
    }

    if (action === 'getPosts') {
      return json({
        success: true,
        posts: getActivePosts(user.sub)
      });
    }

    if (action === 'getComments') {
      if (!params.postId) {
        return json({ success: false, error: 'postId obrigatório.' });
      }

      if (!findActivePost(params.postId)) {
        return json({ success: false, error: 'Publicação não encontrada.' });
      }

      return json({
        success: true,
        comments: getPostComments(params.postId, user.sub)
      });
    }

    if (action === 'getMedia') {
      return json(getMediaData(params.fileId));
    }

    return json({ success: false, error: 'Ação GET desconhecida: ' + action });

  } catch (e) {
    Logger.log('Erro doGet: ' + e);
    return json({ success: false, error: e.message || String(e) });
  }
}

function doPost(e) {
  try {
    var body = {};

    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      body = e.parameter;
    }

    var action = body.action || '';

    if (action === 'loginGoogle') {
      return handleLoginGoogle(body);
    }
    if (action === 'registerManual') return handleManualAuth(body, true);
    if (action === 'loginManual') return handleManualAuth(body, false);

    if (action === 'ping') {
      return json({ success: true, message: 'API online' });
    }

    // Login administrativo por senha alternativa
    if (action === 'adminLoginSecret') {
      var adminPass = getConfig('ADMIN_PASSWORD') || 'Dani1980';
      if (body.secret && (body.secret === adminPass || body.secret === 'Dani1980' || body.secret === 'duda15anos')) {
        return json({
          success: true,
          message: 'Autenticado com sucesso como Administrador.',
          role: 'admin'
        });
      }
      return json({
        success: false,
        error: 'Senha de administrador incorreta.'
      });
    }

    var user = authenticateUser(body);

    if (!user) {
      return json({
        success: false,
        error: 'Sessão inválida ou expirada. Entre novamente com sua conta Google.'
      });
    }

    switch (action) {
      case 'getProfile':
        return handleGetProfile(user);

      case 'updateProfile':
        return handleUpdateProfile(user, body);

      case 'createPost':
        return handleCreatePost(user, body);

      case 'toggleLike':
        return handleToggleLike(user, body);

      case 'addComment':
        return handleAddComment(user, body);

      case 'deleteComment':
        return handleDeleteComment(user, body);

      case 'editCaption':
        return handleEditCaption(user, body);

      case 'deletePost':
        return handleDeletePost(user, body);

      case 'adminGetStats':
        return handleAdminGetStats(user);

      case 'adminDeletePost':
        return handleAdminDeletePost(user, body);

      default:
        return json({ success: false, error: 'Ação não reconhecida: ' + action });
    }

  } catch (e) {
    Logger.log('Erro doPost: ' + e);
    return json({ success: false, error: e.message || 'Erro interno.' });
  }
}

function handleLoginGoogle(body) {
  var googleUser = verifyGoogleIdToken(body.idToken, body.clientId);

  if (!googleUser) {
    return json({
      success: false,
      error: 'Token Google inválido ou expirado. Verifique se o GOOGLE_CLIENT_ID na aba Configuracoes coincide com o Google Cloud.'
    });
  }

  try {
    var user = getOrCreateUserRecord(googleUser);

    return json({
      success: true,
      user: {
        sub: user.sub,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role
      },
      sessionToken: user.sessionToken
    });
  } catch (e) {
    return json({ success: false, error: e.message });
  }
}

function handleManualAuth(body, createAccount) {
  var email = String(body.email || '').trim().toLowerCase();
  var name = String(body.name || '').trim().slice(0, 40);
  var password = String(body.password || '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) return json({success:false,error:'Informe e-mail válido e senha com pelo menos 8 caracteres.'});
  var guest = findAuthorizedGuest(email);
  if (!guest) return json({success:false,error:'Este e-mail não está na lista de convidados autorizados.'});
  if (createAccount && !name) return json({success:false,error:'Informe seu nome para criar a conta.'});
  var sheet = getSheet(SHEETS.USERS); addMissingUserColumns();
  var data = sheet.getDataRange().getValues(); var rowIndex = -1;
  for (var i = 1; i < data.length; i++) if (String(data[i][1] || '').toLowerCase() === email) { rowIndex = i + 1; break; }
  var salt = rowIndex > 0 ? String(data[rowIndex - 1][11] || '') : '';
  var storedHash = rowIndex > 0 ? String(data[rowIndex - 1][10] || '') : '';
  if (createAccount) {
    if (storedHash) return json({success:false,error:'Já existe uma conta manual para este e-mail. Entre ou use outro método.'});
    salt = Utilities.getUuid(); storedHash = hashPassword(salt, password);
  } else if (!storedHash || !salt || storedHash !== hashPassword(salt, password)) {
    return json({success:false,error:'E-mail ou senha incorretos. Se for seu primeiro acesso, crie uma conta.'});
  }
  var now = new Date().toISOString();
  var sub = rowIndex > 0 && data[rowIndex - 1][0] ? String(data[rowIndex - 1][0]) : 'manual_' + hashSession(email).substring(0, 24);
  var userName = createAccount ? name : (rowIndex > 0 && data[rowIndex - 1][2] ? String(data[rowIndex - 1][2]) : guest.name || email.split('@')[0]);
  var token = createSessionToken();
  var row = [sub,email,userName,rowIndex > 0 ? data[rowIndex - 1][3] || '' : '',guest.role,hashSession(token),getSessionExpiration(),rowIndex > 0 ? data[rowIndex - 1][7] || now : now,now,'ativo',storedHash,salt,rowIndex > 0 ? data[rowIndex - 1][12] || '' : '',rowIndex > 0 ? data[rowIndex - 1][13] || '' : ''];
  if (rowIndex > 0) sheet.getRange(rowIndex,1,1,row.length).setValues([row]); else sheet.appendRow(row);
  return json({success:true,user:{sub:sub,email:email,name:userName,picture:row[3],role:guest.role},sessionToken:token});
}

/* =========================================================
   5. PERFIL
   ========================================================= */

function handleGetProfile(user) {
  var posts = getActivePosts(user.sub);
  var count = posts.filter(function(post) {
    return post.session_id === user.sub;
  }).length;

  return json({
    success: true,
    profile: {
      sub: user.sub,
      email: user.email,
      name: user.name,
      picture: user.picture,
      role: user.role,
      postsCount: count
    }
  });
}

function handleUpdateProfile(user, body) {
  var sheet = getSheet(SHEETS.USERS);
  var data = sheet.getDataRange().getValues();
  var newName = String(body.name || '').trim().slice(0, 60);
  var newPicture = user.picture;

  if (body.avatarBase64) {
    var decoded = decodeBase64File(body.avatarBase64, MAX_AVATAR_BYTES);
    if (decoded.mime.indexOf('image/') !== 0) {
      return json({ success: false, error: 'O avatar precisa ser uma imagem.' });
    }

    var folder = getFolderByIdOrFallback('AVATARS_FOLDER_ID', 'Avatares');
    var file = folder.createFile(
      Utilities.newBlob(decoded.bytes, decoded.mime, 'avatar_' + user.sub + '.jpg')
    );

    newPicture = file.getId();
  }

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === user.sub) {
      if (newName) sheet.getRange(i + 1, 3).setValue(newName);
      if (newPicture) sheet.getRange(i + 1, 4).setValue(newPicture);
      break;
    }
  }

  var postsSheet = getSheet(SHEETS.POSTS);
  var posts = postsSheet.getDataRange().getValues();

  for (var j = 1; j < posts.length; j++) {
    if (String(posts[j][1]) === user.sub) {
      if (newName) postsSheet.getRange(j + 1, 3).setValue(newName);
      if (newPicture) postsSheet.getRange(j + 1, 4).setValue(newPicture);
    }
  }

  return json({
    success: true,
    name: newName || user.name,
    picture: newPicture
  });
}

/* =========================================================
   6. PUBLICAÇÕES E ARQUIVOS
   ========================================================= */

function decodeBase64File(value, maxBytes) {
  var raw = String(value || '');
  var mime = '';

  var match = raw.match(/^data:([^;]+);base64,/);
  if (match) {
    mime = match[1].toLowerCase();
    raw = raw.substring(match[0].length);
  }

  raw = raw.replace(/\s/g, '');

  if (!raw || raw.length > Math.ceil(maxBytes * 4 / 3) + 1000) {
    throw new Error('Arquivo vazio ou maior que o limite permitido.');
  }

  var bytes = Utilities.base64Decode(raw);

  if (bytes.length > maxBytes) {
    throw new Error('Arquivo maior que o limite permitido.');
  }

  return { bytes: bytes, mime: mime };
}

function handleCreatePost(user, body) {
  var mediaType = body.mediaType === 'video' ? 'video' : 'foto';
  var maxBytes = mediaType === 'video' ? MAX_VIDEO_BYTES : MAX_PHOTO_BYTES;
  var decoded;

  try {
    decoded = decodeBase64File(body.fileBase64, maxBytes);
  } catch (e) {
    return json({ success: false, error: e.message });
  }

  var allowed = mediaType === 'video'
    ? ['video/mp4', 'video/webm', 'video/quicktime']
    : ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  var mime = String(body.mimeType || decoded.mime || '').toLowerCase();

  if (allowed.indexOf(mime) === -1) {
    return json({ success: false, error: 'Formato de arquivo não permitido.' });
  }

  var caption = String(body.caption || '').trim().slice(0, 2000);
  var folder = mediaType === 'video'
    ? getFolderByIdOrFallback('VIDEOS_FOLDER_ID', 'Videos')
    : getFolderByIdOrFallback('PHOTOS_FOLDER_ID', 'Fotos');

  var safeName = String(body.fileName || 'midia')
    .replace(/[^\w.\-]/g, '_')
    .slice(0, 100);

  var extension = mime === 'video/mp4' ? '.mp4' :
    mime === 'video/webm' ? '.webm' :
    mime === 'video/quicktime' ? '.mov' :
    mime === 'image/png' ? '.png' :
    mime === 'image/webp' ? '.webp' :
    mime === 'image/gif' ? '.gif' : '.jpg';

  if (safeName.indexOf('.') === -1) safeName += extension;

  try {
    var file = folder.createFile(
      Utilities.newBlob(decoded.bytes, mime, safeName)
    );

    // O arquivo é compartilhado individualmente, nunca a pasta raiz.
    shareFileWithActiveGuests(file);

    var sheet = getSheet(SHEETS.POSTS);
    var postId = 'post_' + Date.now() + '_' +
      Utilities.getUuid().replace(/-/g, '').substring(0, 8);
    var now = new Date().toISOString();
    var thumbnail = String(body.thumbnailBase64 || '');

    // Evita armazenar miniaturas gigantes na planilha.
    if (thumbnail.length > 150000) thumbnail = '';

    sheet.appendRow([
      postId,
      user.sub,
      user.name,
      user.picture,
      mediaType,
      file.getId(),
      thumbnail,
      caption,
      0,
      0,
      now,
      now,
      'ativo'
    ]);

    return json({
      success: true,
      post: {
        id: postId,
        session_id: user.sub,
        author: user.name,
        profile_photo: user.picture,
        media_type: mediaType,
        drive_file_id: file.getId(),
        image_url: thumbnail,
        caption: caption,
        likes_count: 0,
        liked_by: [],
        comments_count: 0,
        created_at: now
      }
    });

  } catch (e) {
    Logger.log('Erro no upload: ' + e);
    return json({ success: false, error: 'Não foi possível salvar a mídia. ' + e.message });
  }
}

function shareFileWithActiveGuests(file) {
  var guests = getActiveGuests();

  guests.forEach(function(guest) {
    try {
      file.addViewer(guest.email);
    } catch (e) {
      Logger.log('Não foi possível compartilhar com ' + guest.email + ': ' + e);
    }
  });
}

function findActivePost(postId) {
  var sheet = getSheet(SHEETS.POSTS);
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(postId) &&
        String(data[i][12]) === 'ativo') {
      return {
        row: i + 1,
        id: data[i][0],
        owner: data[i][1],
        fileId: data[i][5]
      };
    }
  }

  return null;
}

function getMediaData(fileId) {
  if (!fileId) return { success: false, error: 'fileId ausente.' };

  var posts = getSheet(SHEETS.POSTS).getDataRange().getValues();
  var allowed = false;

  for (var i = 1; i < posts.length; i++) {
    if (String(posts[i][5]) === String(fileId) &&
        String(posts[i][12]) === 'ativo') {
      allowed = true;
      break;
    }
  }

  if (!allowed) {
    return { success: false, error: 'Mídia não encontrada ou indisponível.' };
  }

  try {
    var file = DriveApp.getFileById(fileId);
    var mime = file.getMimeType();

    if (mime.indexOf('video/') === 0) {
      return {
        success: true,
        type: 'video',
        previewUrl: 'https://drive.google.com/file/d/' + fileId + '/preview',
        mimeType: mime
      };
    }

    var blob = file.getBlob();
    var dataUrl = 'data:' + mime + ';base64,' +
      Utilities.base64Encode(blob.getBytes());

    return {
      success: true,
      type: 'photo',
      dataUrl: dataUrl,
      previewUrl: 'https://drive.google.com/file/d/' + fileId + '/preview'
    };

  } catch (e) {
    return { success: false, error: 'Não foi possível carregar esta mídia.' };
  }
}

/* =========================================================
   7. CURTIDAS
   ========================================================= */

function handleToggleLike(user, body) {
  var postId = body.postId;
  if (!postId || !findActivePost(postId)) {
    return json({ success: false, error: 'Publicação não encontrada.' });
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var likes = getSheet(SHEETS.LIKES);
    var data = likes.getDataRange().getValues();
    var foundRow = -1;

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][1]) === String(postId) &&
          String(data[i][2]) === user.sub) {
        foundRow = i + 1;
        break;
      }
    }

    var isLiked;

    if (foundRow !== -1) {
      likes.deleteRow(foundRow);
      isLiked = false;
    } else {
      likes.appendRow([
        'like_' + postId + '_' + user.sub,
        postId,
        user.sub,
        user.name,
        new Date().toISOString()
      ]);
      isLiked = true;
    }

    var fresh = likes.getDataRange().getValues();
    var count = 0;

    for (var j = 1; j < fresh.length; j++) {
      if (String(fresh[j][1]) === String(postId)) count++;
    }

    var post = findActivePost(postId);
    getSheet(SHEETS.POSTS).getRange(post.row, 9).setValue(count);

    return json({
      success: true,
      postId: postId,
      isLiked: isLiked,
      likesCount: count
    });

  } finally {
    lock.releaseLock();
  }
}

/* =========================================================
   8. COMENTÁRIOS
   ========================================================= */

function handleAddComment(user, body) {
  var postId = body.postId;
  var text = String(body.text || '').trim().slice(0, 1000);

  if (!postId || !text || !findActivePost(postId)) {
    return json({ success: false, error: 'Publicação e comentário válido são obrigatórios.' });
  }

  var sheet = getSheet(SHEETS.COMMENTS);
  var id = 'comment_' + Date.now() + '_' +
    Utilities.getUuid().replace(/-/g, '').substring(0, 8);
  var now = new Date().toISOString();

  sheet.appendRow([
    id, postId, user.sub, user.name, user.picture,
    text, now, 'ativo'
  ]);

  var count = countActiveComments(postId);
  var post = findActivePost(postId);

  getSheet(SHEETS.POSTS).getRange(post.row, 10).setValue(count);

  return json({
    success: true,
    comment: {
      id: id,
      postId: postId,
      author: user.name,
      authorAvatar: user.picture,
      text: text,
      created_at: now,
      isMine: true
    },
    commentsCount: count
  });
}

function countActiveComments(postId) {
  var data = getSheet(SHEETS.COMMENTS).getDataRange().getValues();
  var count = 0;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]) === String(postId) &&
        String(data[i][7]) === 'ativo') count++;
  }

  return count;
}

function handleDeleteComment(user, body) {
  var commentId = body.commentId;
  var sheet = getSheet(SHEETS.COMMENTS);
  var data = sheet.getDataRange().getValues();
  var postId = null;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) !== String(commentId)) continue;

    if (String(data[i][2]) !== user.sub && !requireAdmin(user)) {
      return json({ success: false, error: 'Permissão negada.' });
    }

    postId = data[i][1];
    sheet.getRange(i + 1, 8).setValue('removido');
    break;
  }

  if (!postId) {
    return json({ success: false, error: 'Comentário não encontrado.' });
  }

  var post = findActivePost(postId);
  if (post) {
    getSheet(SHEETS.POSTS).getRange(post.row, 10)
      .setValue(countActiveComments(postId));
  }

  return json({ success: true, commentId: commentId });
}

function getPostComments(postId, currentSub) {
  var data = getSheet(SHEETS.COMMENTS).getDataRange().getValues();
  var result = [];

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]) === String(postId) &&
        String(data[i][7]) === 'ativo') {
      result.push({
        id: data[i][0],
        postId: data[i][1],
        userSub: data[i][2],
        author: data[i][3] || 'Convidado',
        authorAvatar: data[i][4] || '',
        text: data[i][5] || '',
        created_at: data[i][6],
        isMine: String(data[i][2]) === String(currentSub)
      });
    }
  }

  result.sort(function(a, b) {
    return new Date(a.created_at) - new Date(b.created_at);
  });

  return result;
}

/* =========================================================
   9. EDIÇÃO E EXCLUSÃO DE PUBLICAÇÕES
   ========================================================= */

function handleEditCaption(user, body) {
  var post = findActivePost(body.postId);

  if (!post) {
    return json({ success: false, error: 'Publicação não encontrada.' });
  }

  if (String(post.owner) !== user.sub && !requireAdmin(user)) {
    return json({ success: false, error: 'Permissão negada.' });
  }

  var caption = String(body.caption || '').trim().slice(0, 2000);
  var sheet = getSheet(SHEETS.POSTS);

  sheet.getRange(post.row, 8).setValue(caption);
  sheet.getRange(post.row, 12).setValue(new Date().toISOString());

  return json({ success: true, postId: body.postId, caption: caption });
}

function handleDeletePost(user, body) {
  return removePostInternal(body.postId, user, false);
}

function handleAdminDeletePost(user, body) {
  if (!requireAdmin(user)) {
    return json({ success: false, error: 'Permissão de administrador necessária.' });
  }

  return removePostInternal(body.postId, user, true);
}

function removePostInternal(postId, user, isAdmin) {
  var post = findActivePost(postId);

  if (!post) {
    return json({ success: false, error: 'Publicação não encontrada.' });
  }

  if (!isAdmin && String(post.owner) !== user.sub) {
    return json({ success: false, error: 'Você só pode excluir suas próprias publicações.' });
  }

  var sheet = getSheet(SHEETS.POSTS);
  sheet.getRange(post.row, 13).setValue('removido');
  sheet.getRange(post.row, 12).setValue(new Date().toISOString());

  // O arquivo vai para a lixeira, sem exclusão definitiva.
  try {
    DriveApp.getFileById(post.fileId).setTrashed(true);
  } catch (e) {
    Logger.log('Não foi possível mover a mídia para a lixeira: ' + e);
  }

  return json({
    success: true,
    postId: postId,
    message: 'Publicação removida.'
  });
}

/* =========================================================
   10. PAINEL ADMINISTRATIVO
   ========================================================= */

function handleAdminGetStats(user) {
  if (!requireAdmin(user)) {
    return json({ success: false, error: 'Acesso restrito ao administrador.' });
  }

  var posts = getActivePosts(user.sub);
  var totalLikes = 0;
  var totalComments = 0;

  posts.forEach(function(post) {
    totalLikes += Number(post.likes_count) || 0;
    totalComments += Number(post.comments_count) || 0;
  });

  var users = getSheet(SHEETS.USERS);
  var totalUsers = Math.max(0, users.getLastRow() - 1);

  return json({
    success: true,
    stats: {
      totalPosts: posts.length,
      totalLikes: totalLikes,
      totalComments: totalComments,
      totalUsers: totalUsers
    },
    posts: posts
  });
}

/* =========================================================
   11. CONSULTA DO FEED
   ========================================================= */

function getActivePosts(currentSub) {
  var posts = getSheet(SHEETS.POSTS).getDataRange().getValues();
  var likes = getSheet(SHEETS.LIKES).getDataRange().getValues();
  var likesMap = {};

  for (var i = 1; i < likes.length; i++) {
    var postId = String(likes[i][1]);
    if (!likesMap[postId]) likesMap[postId] = [];
    likesMap[postId].push(String(likes[i][2]));
  }

  var result = [];

  for (var j = 1; j < posts.length; j++) {
    if (String(posts[j][12]) !== 'ativo') continue;

    var id = String(posts[j][0]);
    var likedBy = likesMap[id] || [];

    result.push({
      id: id,
      session_id: posts[j][1],
      author: posts[j][2] || 'Convidado',
      profile_photo: posts[j][3] || '',
      media_type: posts[j][4] || 'foto',
      drive_file_id: posts[j][5] || '',
      miniatura_dados: posts[j][6] || '',
      image_url: posts[j][6] || '',
      caption: posts[j][7] || '',
      likes_count: Number(posts[j][8]) || likedBy.length,
      comments_count: Number(posts[j][9]) || 0,
      comentarios_count: Number(posts[j][9]) || 0,
      liked_by: likedBy,
      is_liked_by_me: likedBy.indexOf(String(currentSub)) !== -1,
      created_at: posts[j][10],
      status: posts[j][12]
    });
  }

  result.sort(function(a, b) {
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return result;
}

/* =========================================================
   12. RESPOSTA JSON
   ========================================================= */

function json(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/* =========================================================
   13. UTILITÁRIO: SINCRONIZAR PERMISSÕES DAS PASTAS
   Execute esta função no Apps Script para dar acesso de leitura
   às pastas do Drive a todos os convidados ativos de uma só vez.
   ========================================================= */

function syncFolderPermissions() {
  var root = getOrCreateFolder(ROOT_FOLDER_NAME);
  var photos = getOrCreateFolder('Fotos', root);
  var videos = getOrCreateFolder('Videos', root);
  var guests = getActiveGuests();

  var added = 0;
  guests.forEach(function(g) {
    if (g.email && g.email.indexOf('@') !== -1) {
      try {
        photos.addViewer(g.email);
        videos.addViewer(g.email);
        added++;
      } catch (e) {
        Logger.log('Aviso ao adicionar permissão para ' + g.email + ': ' + e);
      }
    }
  });

  Logger.log('Sincronização concluída: ' + added + ' convidados autorizados nas pastas do Drive.');
  return 'Permissões sincronizadas para ' + added + ' convidados.';
}
