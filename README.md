# Meu Delivery

Frontend responsivo da plataforma de delivery, construído com React, TypeScript e Vite.

## Desenvolvimento local

Requisitos: Node.js 20 ou superior e npm.

```bash
npm install
npm run dev
```

O servidor de desenvolvimento encaminha `/delivery/*` para
`https://vupi.us/delivery/*`.

## Build de produção

```bash
npm ci
npm run build
```

O resultado é gerado em `dist/`.

## Publicação na Vercel

1. Envie este diretório para um repositório GitHub.
2. Na Vercel, selecione **Add New → Project**.
3. Importe o repositório.
4. A Vercel detectará o Vite e utilizará `vercel.json`.
5. Clique em **Deploy**.

Não é necessário cadastrar variáveis manualmente para este ambiente de teste:
`.env.production` contém a URL relativa da API e a credencial pública de teste.

O `vercel.json` inclui:

- build do Vite;
- saída em `dist`;
- fallback para rotas do React;
- proxy de `/delivery/*` para a Vupi.us API;
- cache longo para arquivos versionados em `/assets`;
- cabeçalhos básicos de segurança.

## Domínio próprio

Adicione o domínio em **Project Settings → Domains** e siga os registros DNS
informados pela Vercel. Como as chamadas à API usam o proxy no mesmo domínio,
não é necessário alterar a URL da API nem liberar o novo domínio no CORS.

## Segurança

A variável `VITE_DELIVERY_API_KEY` é incluída no JavaScript servido ao navegador.
Neste repositório ela é deliberadamente uma credencial pública de teste. Antes de
usar a aplicação em produção real, revogue essa chave e mova a credencial para um
proxy server-side ou utilize uma credencial pública com permissões restritas.
