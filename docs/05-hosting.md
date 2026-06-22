# 05 — Hosting Strategy

## Overview

| Camada | Serviço | Custo | URL |
|---|---|---|---|
| **Frontend** | Vercel | Gratuito | `app.job4devs.com` |
| **Backend** | Render (paid) | ~$7/mês | `api.job4devs.com` |
| **Database** | Render PostgreSQL | ~$7/mês | Internal to Render |
| **Domínio** | Registro.br ou Namecheap | ~R$50/ano | `job4devs.com` |

**Custo total estimado: ~$14/mês + domínio.**

---

## Frontend — Vercel

- Deploy automático via GitHub (push to `main` = deploy)
- CDN global — latência mínima em qualquer região
- HTTPS automático via Let's Encrypt
- Domínio customizado via CNAME: `app.job4devs.com → cname.vercel-dns.com`
- Zero configuração de servidor

**Build config:**
```
Framework: Vite
Build command: npm run build
Output directory: dist
Environment variable: VITE_API_URL=https://api.job4devs.com
```

---

## Backend — Render (paid plan)

**Por que pago e não free tier:**
O free tier do Render hiberna após 15 minutos de inatividade e demora 30–60s
para acordar. Para um projeto de portfólio demonstrado ao vivo, isso é inaceitável.
O plano pago ($7/mês) mantém a instância sempre ativa.

- Deploy automático via GitHub
- HTTPS automático
- Variáveis de ambiente gerenciadas no painel
- Domínio customizado: `api.job4devs.com`
- Health check endpoint: `GET /health` (implementar no Express)

**Render service config:**
```
Environment: Node
Build command: npm install && npm run build
Start command: node dist/server.js
Health check path: /health
```

---

## Database — Render PostgreSQL

- Managed PostgreSQL na mesma região do backend (latência mínima)
- Backups automáticos diários
- Connection string disponível como variável de ambiente no Render
- Sem necessidade de configurar SSL manualmente (Render gerencia)

**Conexão:**
```
DATABASE_URL fornecida automaticamente pelo Render ao backend
```

---

## Domínio

Opções recomendadas por prioridade:

| Domínio | Tom | Indicado para |
|---|---|---|
| `job4devs.dev` | Técnico, moderno | Portfólio internacional |
| `job4devs.com` | Produto real | Portfólio geral |
| `job4devs.com.br` | Mercado BR | Portfólio local |

**.dev é a melhor escolha para portfólio de desenvolvedor** — o TLD comunica
o público-alvo e é reconhecido no mercado tech.

**DNS config (exemplo com job4devs.dev):**
```
# Frontend
app.job4devs.dev  CNAME  cname.vercel-dns.com

# Backend
api.job4devs.dev  CNAME  job4devs-api.onrender.com
```

---

## Alternativa mais barata (~$5/mês total)

Se $14/mês pesar, use **Railway** para backend + banco juntos.
Railway cobra por uso real de CPU/memória. Para tráfego baixo de portfólio,
dificilmente ultrapassa $5/mês.

| Camada | Serviço | Custo |
|---|---|---|
| Frontend | Vercel | Gratuito |
| Backend + Database | Railway | ~$5/mês |
| Domínio | Registro.br | ~R$50/ano |

---

## Checklist de Deploy

### Pré-deploy
- [ ] Variáveis de ambiente configuradas no Render e Vercel
- [ ] `DATABASE_URL` apontando para Render PostgreSQL
- [ ] Migrations rodadas (`npm run migrate`)
- [ ] Seed de `sources` executado
- [ ] `GET /health` retornando 200

### Pós-deploy
- [ ] HTTPS funcionando em `app.job4devs.dev` e `api.job4devs.dev`
- [ ] Login e registro funcionando
- [ ] Worker executando (verificar `alert_logs` no banco)
- [ ] E-mail de alerta chegando corretamente
- [ ] Dashboard mostrando status do último ciclo

### Portfolio-ready
- [ ] README no GitHub com link ao vivo, stack e screenshots
- [ ] Domínio customizado configurado (sem URLs `.onrender.com` ou `.vercel.app`)
- [ ] Projeto estável por 48h antes de divulgar
