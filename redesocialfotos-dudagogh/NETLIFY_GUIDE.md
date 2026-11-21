# 🚀 PASSO A PASSO COMPLETO — PUBLICAR NO NETLIFY & CONFIGURAR BANCO DE DADOS

Este guia ensina exatamente como colocar a **Rede Social da Festa de 15 Anos da Eduarda** no ar usando o **Netlify** e conectar o banco de dados gratuito **Supabase** para salvar as fotos e fotos apagadas pelo administrador.

---

## 📁 ARQUIVOS DO PROJETO

- **`index.html`**: O site principal da festa onde os convidados visualizam o mural, publicam fotos, escrevem legendas, curtem e acompanham o contador de memórias.
- **`indexadministrador.html`**: A página secreta do administrador onde você pode visualizar todas as fotos enviadas e **excluir qualquer foto** dos convidados.
- **`lib/storage/schema.sql`**: O script SQL com o banco de dados e regras de armazenamento do Supabase.

---

## 🎨 PASSO 1: CRIAR O BANCO DE DADOS GRATUITO NO SUPABASE

1. Acesse **[supabase.com](https://supabase.com)** e clique em **"Start your project"**.
2. Faça login com sua conta do GitHub ou e-mail (é 100% gratuito).
3. Clique em **"New Project"**:
   - **Name**: `festa-duda-15anos`
   - **Database Password**: Escolha uma senha forte ou clique em gerar automaticamente.
   - **Region**: Selecione `Saõ Paulo (South America)` para ser ultra-rápido.
   - Clique em **"Create new project"** e aguarde 1 minuto.

4. **Criar as Tabelas e o Storage**:
   - No menu lateral esquerdo do Supabase, clique em **SQL Editor** (ícone `>_`).
   - Clique em **"New Query"**.
   - Abra o arquivo `lib/storage/schema.sql` deste projeto, copie todo o conteúdo e cole no SQL Editor do Supabase.
   - Clique no botão verde **"Run"** no canto inferior direito.
   - *Pronto! A tabela `photos` e a pasta de imagens `memories` foram criadas automaticamente!*

5. **Copiar as Chaves de Conexão**:
   - No menu lateral esquerdo, clique no ícone de engrenagem **Project Settings** (Configurações) > **API**.
   - Copie o **Project URL** (exemplo: `https://xyzabc.supabase.co`).
   - Copie a **anon / public key** (uma chave longa que começa com `eyJhbGci...`).

---

## 🔗 PASSO 2: CONECTAR AS CHAVES NOS SEUS ARQUIVOS HTML

Existem duas formas ultra simples de conectar:

### Opção A (Direto no Site):
1. Abra o arquivo `index.html` no seu navegador.
2. Clique no ícone de engrenagem no cabeçalho.
3. Cole sua **SUPABASE URL** e **SUPABASE ANON KEY** e clique em **Salvar Credenciais**.

### Opção B (No código dos arquivos):
Abra os arquivos `index.html` e `indexadministrador.html` e edite as linhas abaixo com as suas chaves:

```javascript
let supabaseUrl = 'https://seu-projeto.supabase.co';
let supabaseAnonKey = 'eyJhbGci...sua-chave-anonima-aqui';
```

---

## 🌐 PASSO 3: PUBLICAR O SITE NO NETLIFY (EM 2 MINUTOS)

### Método 1: Arrastar e Soltar (Sem código, direto pelo navegador)

1. Acesse **[app.netlify.com](https://app.netlify.com)** e crie uma conta gratuita.
2. Na página principal (Sites), role a página até a caixa que diz:
   **"Want to deploy a new site without connecting to Git? Drag and drop your site folder here"**.
3. Abra a pasta `redesocialfotos-dudagogh` do seu computador no Gerenciador de Arquivos.
4. Selecione a pasta onde estão os arquivos `index.html` e `indexadministrador.html` e **arraste para dentro da caixa no Netlify**.
5. Aguarde 10 segundos! O Netlify vai gerar a URL pública online (exemplo: `https://festa-duda-15anos.netlify.app`).

---

## 🛡️ PASSO 4: COMO USAR A ÁREA ADMINISTRATIVA (`indexadministrador.html`)

1. Para acessar a página do administrador, basta adicionar `indexadministrador.html` no final da URL do seu site:
   - Exemplo: `https://seu-site.netlify.app/indexadministrador.html`

2. **Senha padrão de acesso**:
   - Senha: `duda15anos`

3. **No painel de moderação você pode**:
   - Ver o total de fotos enviadas e curtidas em tempo real.
   - Ver qual convidado publicou a foto.
   - Clicar no botão vermelho **"🗑️ Excluir Foto"** para remover permanentemente a foto do mural dos convidados e apagar do servidor do Supabase.

---

## ✅ TESTE DE FUNCIONAMENTO COMPLETO

1. **Upload no Celular**: Abra a URL do Netlify no seu celular, toque em **"Publicar Foto"**, selecione uma foto, adicione legenda e toque em **"Publicar no Mural ✨"**.
2. **Confetes & Contador**: Verifique o estouro de confetes e o contador subindo para 1.
3. **Curtidas**: Clique em **❤️** para curtir. Atualize a página e veja que a curtida permanece.
4. **Exclusão de Fotos**: Abra `indexadministrador.html`, digite `duda15anos` e clique em **"Excluir Foto"**. Volte ao site principal e veja que o contador diminuiu para 0.
