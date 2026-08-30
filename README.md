# 🌟 Rede Social de Fotos — Festa de 15 Anos da Eduarda

Aplicação web completa, responsiva e pronta para produção inspirada na obra **A Noite Estrelada (Vincent van Gogh)**.
Desenvolvida para que os convidados compartilhem fotos, legendas e curtidas durante a festa de 15 anos da Eduarda.

---

## 🎨 Identidade Visual (Noite Estrelada)

- **Cores**: Azul noturno profundo (`#060919`), azul marinho, detalhes em ouro cintilante (`#f5b027`), branco estelar.
- **Efeitos**: Fundo galáctico interativo com estrelas animadas via Canvas, cartões translúcidos em glassmorphism, tipografia sofisticada (`Playfair Display` + `Outfit`) e animações fluidas via **Framer Motion**.

---

## 🚀 Funcionalidades Principais

1. **Zero Conteúdo Fictício**: O site inicia com 0 fotos, 0 curtidas e exibe o estado vazio elegante *"À espera das primeiras memórias"*.
2. **Publicação com Otimização**:
   - Envio de foto direto da câmera do smartphone ou galeria.
   - Compressão automática da foto no navegador (Canvas HTML5) para garantir envios ultra-rápidos pelo 4G/5G.
   - Campo para nome do autor e legenda.
   - Efeito de celebração com confetes cintilantes ao publicar.
3. **Mural Social & Lightbox**:
   - Feed de memórias em grid responsivo.
   - Exibição de foto, autor, legenda, data/hora relativa em português e contador de curtidas.
   - Modal em tela cheia (Lightbox) ao clicar na foto.
4. **Sistema Real de Curtidas**:
   - Deduplicação por sessão do visitante/dispositivo.
   - Atualização em tempo real.
5. **Filtro "Momentos em Destaque"**:
   - Ordena **todas** as fotos publicadas pela quantidade de curtidas (da maior para a menor).
   - Critério de desempate automático: data/hora de envio.
6. **Contador em Tempo Real**:
   - Exibe o número real de memórias compartilhadas.
   - Incrementa ao publicar e decrementa ao excluir.
7. **Painel Administrativo (`/admin`)**:
   - Rota restrita protegida por senha (`duda15anos`).
   - Exclusão de qualquer foto (remove o registro e o arquivo de imagem).
   - Estatísticas completas e status do banco de dados.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons, Canvas Confetti.
- **Backend / Persistência**: Supabase (PostgreSQL + Supabase Storage) com motor de persistência local/API server-side de contingência.

---

## 🗄️ Configuração do Supabase (Banco & Storage)

1. Acesse o seu projeto em [supabase.com](https://supabase.com).
2. Vá no **SQL Editor** e execute o script contido em `lib/storage/schema.sql`.
3. Adicione as variáveis de ambiente no arquivo `.env.local` (ou nas configurações da Vercel):

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
ADMIN_PASSWORD=duda15anos
```

---

## 💻 Executando Localmente

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor de desenvolvimento
npm run dev

# 3. Abrir no navegador
http://localhost:3000
```

---

## 🌐 Deploy em Produção (Vercel)

1. Faça push do código para o repositório GitHub.
2. Importe o projeto na **Vercel** (`https://vercel.com`).
3. Adicione as variáveis de ambiente (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ADMIN_PASSWORD`).
4. Clique em **Deploy**.
