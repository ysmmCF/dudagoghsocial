# 🌟 Rede Social de Fotos & Vídeos — Festa de 15 Anos da Eduarda

Aplicação web completa, responsiva e pronta para produção inspirada na obra **A Noite Estrelada (Vincent van Gogh)**.
Desenvolvida para que os convidados compartilhem fotos, vídeos, legendas, curtidas e comentários durante a festa de 15 anos da Eduarda.

Hospedada estaticamente no **GitHub Pages** e conectada ao ecossistema **Google (Google Identity Services, Google Drive, Google Sheets e Google Apps Script)**.

> **Importante**: O site **não entra em pausa ou suspensão por inatividade**, garantindo que continue funcionando perfeitamente mesmo após semanas ou meses sem acessos.

---

## 🎨 Identidade Visual (Noite Estrelada)

- **Cores**: Azul noturno profundo (`#040714`), azul marinho (`#0f1736`), detalhes em ouro cintilante (`#d4af37`), branco estelar.
- **Efeitos**: Fundo galáctico interativo com a obra oficial de Van Gogh, estrelas animadas via Canvas HTML5, cartões translúcidos em glassmorphism, tipografia sofisticada (`Playfair Display` + `Outfit`) e confetes cintilantes comemorativos.

---

## 🚀 Funcionalidades Principais

1. **Autenticação Segura com Google (Google Identity Services)**:
   - Login com um clique utilizando conta Google real.
   - Validação criptográfica do token no backend (Apps Script via Google OAuth2 tokeninfo).
   - Sessão persistida no navegador: o convidado não precisa repetir o login ao fechar e reabrir o site.
   - Sem senhas próprias para decorar e sem tela de senha geral para convidados.
2. **Armazenamento Privado no Google Drive**:
   - Fotos e vídeos organizados em pastas (`Fotos`, `Videos`, `Avatares`).
   - Acesso restrito a usuários autorizados (permissão de Leitor concedida aos convidados autenticados).
   - Compressão automática de imagens no cliente (WebP) para envios ultrarrápidos em 4G/5G.
   - Suporte a vídeos curtos gravados direto da câmera ou galeria do smartphone.
3. **Mural Social & Lightbox**:
   - Feed de memórias em grid responsivo com miniaturas ultra-leves para carregamento instantâneo.
   - Modal em tela cheia (Lightbox) com visualização em alta definição para fotos e player para vídeos.
4. **Sistema de Curtidas & Comentários**:
   - Curtidas em tempo real com deduplicação por convidado.
   - Sistema de mensagens e comentários com identificação do autor, avatar e data relativa.
5. **Filtro "Momentos em Destaque" & "Minhas Memórias"**:
   - Ordenação das memórias mais curtidas ou mais recentes.
   - Aba exclusiva "Minhas" com gerenciamento de perfil, edição de legendas e exclusão.
6. **Painel Administrativo (`indexadministrador.html`)**:
   - Acesso protegido por conta Google de administrador ou senha de moderação (`Dani1980` ou `duda15anos`).
   - Métricas completas: Total de Memórias, Curtidas, Comentários e Convidados.
   - Moderação com exclusão de fotos/vídeos e envio dos arquivos para a lixeira do Drive.

---

## 🛠️ Arquitetura Google

```
Frontend (GitHub Pages)
   │
   ├─► Google Identity Services (GIS) — Autentica o convidado com Google
   │
   └─► Google Apps Script (Web App API /exec)
         │
         ├── Google OAuth2 TokenInfo (Valida identidade com segurança)
         │
         ├── Google Sheets (Tabelas: Usuarios, Publicacoes, Curtidas, Comentarios)
         │
         └── Google Drive (Pastas privadas: Fotos, Videos, Avatares)
```

---

## 📁 Estrutura de Arquivos

- **`index.html`**: Aplicação principal do mural dos convidados.
- **`indexadministrador.html`**: Painel de moderação e estatísticas do administrador.
- **`js/google-api.js`**: Módulo cliente responsável pela comunicação com o Google Apps Script sem bloqueios de CORS, geração de miniaturas e compactação.
- **`google-backend/Code.gs`**: Código completo do backend para o Google Apps Script.
- **`google-backend/appsscript.json`**: Manifesto com os escopos OAuth necessários.
- **`google-backend/DATABASE_SETUP_GUIDE.md`**: Guia passo a passo com instruções detalhadas para configuração da Planilha Google, Google Cloud e Apps Script.

---

## ⚡ Como Configurar

Siga o passo a passo completo no arquivo:
👉 **[`google-backend/DATABASE_SETUP_GUIDE.md`](google-backend/DATABASE_SETUP_GUIDE.md)**

Em resumo:
1. Crie uma Planilha Google e acesse **Extensões** > **Apps Script**.
2. Cole o código de `google-backend/Code.gs` e execute a função `setupDatabase` para criar as tabelas e pastas no Google Drive.
3. Implante como **Aplicativo da Web** ("Executar como: Eu", "Quem tem acesso: Qualquer pessoa").
4. Crie um **ID do cliente OAuth 2.0** no Google Cloud Console com as origens autorizadas (GitHub Pages e localhost).
5. Atualize `GOOGLE_CONFIG` no topo de `index.html` e `indexadministrador.html` com o Client ID de implantação; ele não é editável nas preferências dos convidados.
6. Cadastre na aba `Convidados` somente as contas que terão acesso pelo Google. Qualquer pessoa pode criar uma conta manual pelo site; o cadastro adiciona automaticamente o e-mail à lista como convidado. Hashes e sessões ficam em `Usuarios`.
