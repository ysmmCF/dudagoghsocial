# 🌟 GUIA DE CONFIGURAÇÃO PASSO A PASSO
## Migração do Supabase para Google Drive, Google Sheets e Google Apps Script

Este guia ensina exatamente como configurar a nova infraestrutura 100% gratuita no ecossistema Google.
O site **não entrará em pausa por inatividade** e continuará funcionando normalmente mesmo após semanas ou meses sem acessos.

---

## 📋 Resumo dos Componentes

1. **Google Sheets (Planilha)**: Funciona como banco de dados relacionando Usuários, Publicações, Curtidas e Comentários.
2. **Google Drive**: Armazena as fotos e vídeos em pastas privadas organizadas (`Fotos`, `Videos`, `Avatares`).
3. **Google Apps Script**: API backend que valida o token Google dos usuários e realiza as operações com segurança.
4. **Google Identity Services (OAuth 2.0)**: Autentica os convidados com suas contas Google de forma moderna e segura, sem necessidade de criação de senhas.
5. **GitHub Pages**: Hospeda o frontend estático do site.

---

## 🚀 PASSO 1: Criar a Planilha Google (Banco de Dados)

1. Acesse **[sheets.google.com](https://sheets.google.com)** e crie uma **Planilha em branco**.
2. Dê o nome para a planilha: `Banco de Dados - Festa Eduarda 15 Anos`.
3. No menu superior da planilha, clique em **Extensões** > **Apps Script**.
4. Uma nova aba será aberta com o editor do Google Apps Script.
5. Renomeie o projeto do Apps Script para: `API Mural Eduarda 15 Anos`.

---

## 🛠️ PASSO 2: Instalar o Código do Backend no Apps Script

1. No editor do Apps Script, você verá um arquivo chamado `Código.gs` (ou `Code.gs`).
2. Apague qualquer código existente nele.
3. Abra o arquivo `google-backend/Code.gs` deste repositório, **copie todo o seu conteúdo** e **cole** dentro do editor do Apps Script.
4. No menu lateral esquerdo do Apps Script, clique no ícone de engrenagem **Configurações do Projeto** e marque a opção:
   `Mostrar arquivo de manifesto "appsscript.json" no editor`.
5. Volte para o Editor de código (ícone `<>`), clique no arquivo `appsscript.json` que apareceu, substitua seu conteúdo pelo conteúdo do arquivo `google-backend/appsscript.json` deste repositório e salve (ícone de disquete ou Ctrl+S).
6. Volte ao arquivo `Code.gs`. Na barra superior de ferramentas do Apps Script:
   - No seletor de funções, selecione a função **`setupDatabase`**.
   - Clique em **Executar**.
   - O Google solicitará que você autorize as permissões para a planilha e o Google Drive.
   - Clique em **Revisar permissões** > selecione sua conta Google > clique em **Avançado** > clique em **Acessar API Mural Eduarda 15 Anos (não seguro)** > clique em **Permitir**.
7. Após a execução, abra a aba da sua Planilha Google:
   - Você verá que as abas `Usuarios`, `Publicacoes`, `Curtidas`, `Comentarios` e `Configuracoes` foram criadas e formatadas com as cores do tema Noite Estrelada!
   - Acesse o seu Google Drive: uma pasta chamada `Mural Eduarda 15 Anos (Privado)` com as subpastas `Fotos`, `Videos` e `Avatares` foi criada automaticamente!

---

Após atualizar o código, execute `setupDatabase()` na conta que controla o álbum. Isso garante que `yasmim.2009ferreira@gmail.com` esteja ativa na aba `Convidados` com o papel `admin`.

## 🌐 PASSO 3: Implantar o Apps Script como Aplicativo da Web (Web App)

1. No canto superior direito do editor do Apps Script, clique no botão azul **Implantar** (Deploy) > **Nova implantação** (New deployment).
2. Clique no ícone de engrenagem ao lado de "Selecione o tipo" e escolha **Aplicativo da Web** (Web app).
3. Preencha as configurações **exatamente** como abaixo:
   - **Descrição**: `Produção v1`
   - **Executar como**: **Eu (seu-email@gmail.com)** *(MUITO IMPORTANTE: Garante que o script acesse a planilha e o Drive sem exigir que os convidados tenham permissões de edição diretas na planilha).*
   - **Quem tem acesso**: **Qualquer pessoa** (Anyone) *(MUITO IMPORTANTE: Permite que o frontend no GitHub Pages chame a API).*
4. Clique em **Implantar**.
5. O Google gerará a **URL do aplicativo da Web** (termina em `/exec`).
   - Exemplo: `https://script.google.com/macros/s/AKfycbx.../exec`
6. **Copie e guarde esta URL!** Ela será colocada no frontend.

> **Dica**: Sempre que fizer alterações futuras no `Code.gs`, clique em **Implantar** > **Gerenciar implantações** > Editar (ícone de lápis) > Versão: **Nova versão** > **Implantar** para atualizar a versão publicada.

---

## 🔑 PASSO 4: Criar o Client ID do Google Identity Services (OAuth)

Para que o botão "Entrar com Google" funcione no site sem o Supabase:

1. Acesse o **[Google Cloud Console](https://console.cloud.google.com/)**.
2. Faça login com sua conta Google e clique no seletor de projetos no topo para **Criar Novo Projeto** (ex: `festa-duda-15-anos`).
3. No menu lateral, acesse **APIs e Serviços** > **Tela de consentimento OAuth**:
   - Escolha o tipo de usuário: **Externo** e clique em **Criar**.
   - **Nome do app**: `Eduarda 15 Anos - Mural de Fotos`
   - **E-mail de suporte do usuário**: Seu e-mail
   - **E-mail do desenvolvedor**: Seu e-mail
   - Clique em **Salvar e continuar** até finalizar.
   - Na aba "Público do teste" (ou Publicação), publique o app ou adicione seus e-mails de teste.
4. No menu lateral, acesse **APIs e Serviços** > **Credenciais**:
   - Clique em **+ Criar Credenciais** > **ID do cliente OAuth**.
   - **Tipo de aplicativo**: **Aplicativo da Web** (Web application).
   - **Nome**: `Frontend Mural Eduarda`.
   - Em **Origens JavaScript autorizadas**, adicione as URLs onde o site pode ser acessado:
     - `http://localhost:3000` (para testes locais)
     - `http://localhost:5500` (caso use Live Server do VS Code)
     - `http://127.0.0.1:5500`
     - `https://SEU_USUARIO.github.io` (a URL oficial do seu GitHub Pages)
   - Clique em **Criar**.
5. O Google exibirá o seu **ID do Cliente** (Client ID).
   - Exemplo: `123456789012-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com`
6. **Copie e guarde esse Client ID!**

---

## 📋 PASSO 5: Preencher a Planilha Google (Configurações e Convidados)

### 1. Colar o Client ID na aba `Configuracoes`:
1. Abra a sua Planilha Google e clique na aba **`Configuracoes`** no rodapé.
2. Localize a linha onde a coluna `chave` é **`GOOGLE_CLIENT_ID`** (linha 6).
3. Na coluna `valor` (coluna B), cole o seu **ID do Cliente OAuth** (ex: `123456...apps.googleusercontent.com`).

### 2. Cadastrar os Convidados Autorizados na aba `Convidados`:
1. Clique na aba **`Convidados`**.
2. Preencha a lista com as contas Google autorizadas a acessar o mural:
   - **email**: E-mail da conta Google do convidado (ex: `maria@gmail.com`).
   - **nome**: Nome de exibição do convidado (ex: `Maria Clara`).
   - **papel**: `convidado` (ou `admin` para quem pode moderar o álbum).
   - **status**: `ativo` (ou deixe em branco; se quiser bloquear alguém no futuro, mude para `inativo`).
3. O e-mail do proprietário da planilha já é considerado administrador automaticamente.

### 3. Autorizar outros administradores

Administradores autenticados podem adicionar e-mails no painel `indexadministrador.html`. O e-mail é incluído/atualizado na aba `Convidados` com papel `admin` e status `ativo`. Esses usuários entram pelo botão Google do painel.

### 4. Sincronizar Permissões das Pastas do Google Drive (Opcional, mas Recomendado):
1. No Apps Script, selecione a função **`syncFolderPermissions`** e clique em **Executar**.
2. Ela concederá permissão de leitura às pastas privadas do Drive para todos os convidados cadastrados de uma vez só!

---

## 🔗 PASSO 6: Conectar o Client ID nos Arquivos do Frontend

A URL do Web App já foi configurada no projeto:
`https://script.google.com/macros/s/AKfycbxU0MJHAyk1UKylOOdoaoKIHbIsy0tBN9970fhstzZljqWJb5kXqJL2dvEO2vrWgPiGwA/exec`

Agora, basta colocar o **Client ID** nos arquivos `index.html` e `indexadministrador.html`:

```javascript
window.GOOGLE_CONFIG = {
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxU0MJHAyk1UKylOOdoaoKIHbIsy0tBN9970fhstzZljqWJb5kXqJL2dvEO2vrWgPiGwA/exec',
  GOOGLE_CLIENT_ID: 'SEU_CLIENT_ID_AQUI.apps.googleusercontent.com'
};
```

O Client ID é uma configuração de implantação e não aparece nas preferências do mural. Para login manual, cada pessoa deve usar um e-mail previamente cadastrado e ativo na aba `Convidados`; no primeiro acesso, escolha **Criar conta** e defina uma senha com pelo menos 8 caracteres. O hash e o salt ficam na aba `Usuarios`.

---

## 🛡️ PASSO 6: Segurança, Privacidade e Quotas do Google

- **Privacidade dos Arquivos**: A pasta do Google Drive permanece privada. Quando um convidado faz login com Google no site, o backend adiciona o e-mail dele como `Leitor (Viewer)` na pasta do Drive. Assim, apenas convidados autenticados conseguem visualizar os arquivos, e ninguém de fora consegue acessar links de mídia sem autorização.
- **Limitações do Google Apps Script & Drive**:
  - **Tamanho máximo de vídeos**: O sistema possui verificação para vídeos de até **25 MB** (vídeos curtos gravados no celular). Vídeos maiores são bloqueados pelo frontend com aviso amigável, prevenindo timeouts de execução do Apps Script.
  - **Compactação automática de fotos**: As fotos são compactadas no navegador para **WebP** antes do envio (tamanho médio de 150KB a 400KB), consumindo pouquíssima banda e quota do Drive.
  - **Miniaturas integradas**: Cada foto gera uma miniatura leve (~20KB) que é enviada no feed principal, fazendo com que o mural carregue de forma instantânea sem precisar baixar arquivos pesados do Drive a cada visualização.
  - **Inatividade**: O Google Drive, Google Sheets e Apps Script **nunca hibernam ou são pausados por falta de acesso**. O site pode ficar 30, 60 ou 180 dias sem visitas e, no momento em que um convidado entrar, responderá imediatamente.

---

## ✅ Checklist de Testes

1. Abra o site no navegador.
2. Clique em **Entrar com Google**. Escolha sua conta.
3. Verifique se o seu nome e foto de perfil do Google são exibidos no cabeçalho e na aba "Minhas".
4. Toque em **Publicar Foto**, envie uma imagem com legenda e confirme o disparo de confetes.
5. Verifique a nova foto no mural, clique no coração para curtir e clique no botão de comentários para enviar uma mensagem.
6. Feche todas as abas do navegador, abra novamente o site e verifique se sua sessão continua ativa (sem precisar repetir login).
7. Acesse `indexadministrador.html`, verifique os contadores e teste a exclusão de uma foto de teste.
