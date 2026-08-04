# 06 — Fase 3: De Portfólio a Produto Real

## Objetivo

Corrigir os gaps que impedem o projeto de ser usado por outras pessoas com segurança e
confiabilidade. Nenhuma feature nova por enquanto — só fundação.

---

## Diagnóstico atual

| Problema | Detalhe |
|---|---|
| Sem rate limiting | `/auth/login`, `/auth/register`, `/auth/forgot-password` estão expostos a brute-force e spam |
| Sem verificação de e-mail | Qualquer endereço pode ser cadastrado — sem confirmação de propriedade |
| JWT só em memória | Ao atualizar a página o usuário perde a sessão |
| Cookie 99freelas expira ~mensalmente | Renovação manual no Railway — quando expira, `avg_proposal_value` e `avg_duration_days` voltam a null silenciosamente, sem nenhum alerta |
| Zero testes automatizados | Regressões silenciosas a cada mudança |
| Fonte única (99freelas) | O sistema inteiro para se o 99freelas mudar layout ou bloquear |

---

## Etapas

### Etapa 1 — Rate Limiting

**Por que primeiro:** bloqueio imediato de abuso, 2–3h de trabalho, sem efeito colateral.

**O que muda:**
- Adicionar `express-rate-limit` nas rotas de auth sensíveis
- Limites conservadores por IP:
  - `POST /auth/login` → 10 tentativas / 15 min
  - `POST /auth/register` → 5 tentativas / hora
  - `POST /auth/forgot-password` → 5 tentativas / hora
- Resposta padrão `429 Too Many Requests` com `Retry-After` header

**Arquivos tocados:**
- `backend/package.json` (nova dep: `express-rate-limit`)
- `backend/src/api/routes/auth.routes.ts` (aplica os limiters)

**Nenhuma migração necessária.**

---

### Etapa 2 — Verificação de E-mail

**Por que:** sem isso, o sistema pode ser usado para enviar alertas para e-mails de terceiros
(o cadastrante define `notification_email` em settings para qualquer endereço).

**O que muda:**

*Backend:*
- Migration `011_add_email_verified_to_users.sql`:
  ```sql
  ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT false;
  ```
- `POST /auth/register`: gera token de verificação (32 bytes hex, sem TTL — link de
  verificação não expira, mas pode ser reenviado), salva hash na coluna `reset_token`
  (reutiliza o mecanismo já existente), envia e-mail transacional com link
  `{FRONTEND_URL}/verify-email?token=xxx`
- Novo endpoint `POST /auth/verify-email` — recebe o token, seta `email_verified = true`,
  limpa o token
- Novo endpoint `POST /auth/resend-verification` (autenticado) — reenvia o e-mail
- `scrape.job.ts`: `findAllActive()` já filtra `active = true` — adicionar filtro
  `AND email_verified = true` para não enviar alertas a contas não verificadas

*Frontend:*
- Após registro, redirecionar para nova página `VerifyEmail.tsx` ("Confirme seu e-mail")
  com botão "Reenviar"
- `ProtectedRoute.tsx`: se `user.emailVerified === false`, redirecionar para a página de
  verificação (bloqueia acesso ao app)

**Arquivos tocados:**
- `backend/src/db/migrations/011_add_email_verified_to_users.sql` (novo)
- `backend/src/db/repositories/users.repository.ts` (verifyEmail, findByVerificationToken)
- `backend/src/services/auth.service.ts` (generateVerificationToken, verifyEmail)
- `backend/src/services/notification.service.ts` (sendVerificationEmail)
- `backend/src/api/routes/auth.routes.ts` (novas rotas)
- `backend/src/api/controllers/auth.controller.ts` (novos handlers)
- `backend/src/worker/jobs/scrape.job.ts` (filtro email_verified)
- `frontend/src/services/auth.service.ts` (interface PublicUser: + emailVerified)
- `frontend/src/pages/Auth/VerifyEmail.tsx` (novo)
- `frontend/src/components/ProtectedRoute.tsx` (guard por emailVerified)
- `frontend/src/App.tsx` (nova rota /verify-email)

**Gotcha:** usuários já existentes têm `email_verified = false` pela migration. Antes de
deployar, rodar UPDATE pontual para setar `email_verified = true` nos usuários já ativos
(que já provaram o e-mail ao usar o sistema):
```sql
UPDATE users SET email_verified = true WHERE active = true;
```

---

### Etapa 3 — Sessão Persistente (Refresh Tokens)

**Por que:** perder a sessão ao atualizar a página é comportamento inaceitável para um
produto real. JWT em memória foi uma escolha do MVP; refresh tokens em httpOnly cookie
são o padrão correto.

**O que muda:**

*Backend:*
- Migration `012_create_refresh_tokens.sql`:
  ```sql
  CREATE TABLE refresh_tokens (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash  VARCHAR(64) NOT NULL UNIQUE,
      expires_at  TIMESTAMPTZ NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
  ```
- Access token: mantém JWT, TTL reduzido para **15 minutos**
- Refresh token: 64 bytes hex, armazenado como SHA-256 hash no DB, TTL **30 dias**,
  enviado como **httpOnly + Secure + SameSite=Strict cookie** (`refresh_token`)
- `POST /auth/login` e `POST /auth/register`: além do access token, emitem o refresh
  token no cookie
- Novo endpoint `POST /auth/refresh`: lê o cookie, valida o hash no DB, emite novo
  access token (e rotaciona o refresh token — invalida o antigo, emite novo)
- Novo endpoint `POST /auth/logout`: deleta o refresh token do DB, limpa o cookie
- Novo repository `refresh_tokens.repository.ts`

*Frontend:*
- `useAuth.tsx`: no mount, se não há user em memória, chama `POST /auth/refresh`
  silenciosamente antes de tentar `/auth/me` — restaura a sessão automaticamente
- Interceptor de 401 em `api.ts`: tenta refresh automático uma vez, e só redireciona
  para login se o refresh também falhar
- `logout()`: chama `POST /auth/logout` antes de limpar o estado local

**Arquivos tocados:**
- `backend/src/db/migrations/012_create_refresh_tokens.sql` (novo)
- `backend/src/db/repositories/refresh_tokens.repository.ts` (novo)
- `backend/src/services/auth.service.ts` (createRefreshToken, rotateRefreshToken, revokeRefreshToken)
- `backend/src/api/routes/auth.routes.ts` (novas rotas: /refresh, /logout)
- `backend/src/api/controllers/auth.controller.ts` (novos handlers, set/clear cookie)
- `backend/src/app.ts` (cookie-parser middleware)
- `backend/package.json` (nova dep: `cookie-parser` + `@types/cookie-parser`)
- `frontend/src/services/auth.service.ts` (refresh, logout)
- `frontend/src/services/api.ts` (interceptor de 401 com retry)
- `frontend/src/hooks/useAuth.tsx` (mount: tenta refresh; logout chama API)

**Gotchas:**
- O cookie `refresh_token` precisa de `credentials: 'include'` no fetch/axios do frontend
- No Railway, confirmar que `FRONTEND_URL` está correto no CORS para aceitar cookies
- Rotação de refresh token: ao usar um token já rotacionado (replay attack), deletar
  **todos** os tokens do usuário (família de tokens comprometida)

---

### Etapa 4 — Detecção de Cookie Expirado (99freelas)

**Por que:** quando os cookies expiram, o bid page retorna um redirect para /login. Hoje
isso falha silenciosamente — avg fields ficam null sem nenhum alerta. O admin descobre
só quando percebe que os valores somem dos e-mails.

**O que muda:**

*Backend:*
- `freelas99.scraper.ts`: no bloco de fetch do bid page, detectar se a resposta é a
  página de login (checar pelo título ou URL de redirect) — se sim, lançar erro tipado
  `Freelas99AuthExpiredError` em vez de silenciar
- `scraper.service.ts`: capturar esse erro específico, logar `{ freelas99AuthExpired: true }`,
  e setar um flag em memória (singleton) `freelas99AuthExpired: boolean`
- `GET /api/status`: incluir `freelas99AuthExpired` na resposta
- Enviar **um único e-mail de alerta ao admin** (`EMAIL_FROM`) quando o flag vira `true`
  pela primeira vez na sessão (não a cada ciclo)

*Frontend:*
- `Dashboard/index.tsx`: se `freelas99AuthExpired === true`, exibir banner amarelo
  "Credenciais do 99freelas expiraram — atualize as env vars no Railway"

**Arquivos tocados:**
- `backend/src/services/scraper/sources/freelas99.scraper.ts`
- `backend/src/services/scraper/scraper.service.ts` (flag em memória)
- `backend/src/api/controllers/status.controller.ts` (expor o flag)
- `backend/src/services/notification.service.ts` (sendAuthExpiredAlert)
- `frontend/src/pages/Dashboard/index.tsx` (banner condicional)
- `frontend/src/services/status.service.ts` (campo freelas99AuthExpired na resposta)

---

### Etapa 5 — Testes Automatizados

**Por que:** antes de adicionar uma segunda fonte de scraping, é necessário ter uma rede
de segurança mínima. Sem testes, um bug no scraper de Workana pode quebrar o 99freelas.

**Escopo mínimo (não cobrir tudo — cobrir o que dói quando quebra):**

| Teste | Tipo | O que verifica |
|---|---|---|
| `filter.service` | Unit | matchesKeywords, parseKeywords, exclude keywords |
| `auth.service` | Unit | signToken, verifyToken, generateUnsubscribeToken |
| `freelas99.scraper` | Unit | parseTableCount, parseAvgProposalValue, parseAvgDurationDays com HTML fixture |
| `POST /auth/login` | Integration | 200 com credenciais válidas, 401 com senha errada, 429 após 10 tentativas |
| `POST /auth/register` | Integration | 201 com dados válidos, 409 com e-mail duplicado |
| `POST /auth/refresh` | Integration | 200 com cookie válido, 401 sem cookie |
| Worker cycle | Integration | mock HTTP + mock Resend: verifica que notifications são inseridas e marcadas como sent |

**Ferramentas:**
- `vitest` (compatível com ESM/TypeScript, zero config com ts-node)
- `supertest` para testes de integração das rotas
- `nock` para mock de requisições HTTP (scraper)
- Banco de testes: instância PostgreSQL separada via variável `TEST_DATABASE_URL`

**Arquivos tocados:**
- `backend/package.json` (devDeps: vitest, supertest, nock, @types/supertest)
- `backend/vitest.config.ts` (novo)
- `backend/src/__tests__/filter.service.test.ts` (novo)
- `backend/src/__tests__/auth.service.test.ts` (novo)
- `backend/src/__tests__/freelas99.scraper.test.ts` (novo)
- `backend/src/__tests__/auth.routes.test.ts` (novo)
- `backend/src/__tests__/worker.test.ts` (novo)
- `backend/src/__tests__/fixtures/freelas99-detail.html` (novo — snapshot de HTML real)
- `.github/workflows/ci.yml` (adicionar `npm test` ao pipeline)

---

### Etapa 6 — Filtros Adicionais na UI

**Por que:** os dados já estão no DB (`budget_min`, `budget_max`, `client_rating` em
`jobs`), e o campo `min_budget` já existe em `user_settings`. Falta expor controle de
orçamento máximo, rating mínimo do cliente, e aplicar os filtros no `filter.service`.

**O que muda:**

*Backend:*
- `filter.service.ts`: novas funções `matchesBudget(job, minBudget, maxBudget)` e
  `matchesRating(job, minRating)`
- `scrape.job.ts`: ler `max_budget` e `min_client_rating` de `user_settings`, passar
  para o filtro
- Novos keys em `user_settings`: `max_budget`, `min_client_rating`

*Frontend:*
- `Settings/index.tsx`: adicionar campos de orçamento máximo e rating mínimo ao formulário
- Validação: `min_budget <= max_budget` (se ambos preenchidos)

**Arquivos tocados:**
- `backend/src/services/filter.service.ts`
- `backend/src/worker/jobs/scrape.job.ts`
- `frontend/src/pages/Settings/index.tsx`
- Nenhuma migration necessária — `user_settings` é key/value, suporta novos keys sem DDL

---

## Ordem de execução e dependências

```
Etapa 1 (Rate Limiting)      → independente, começar aqui
Etapa 2 (Email Verification) → independente
Etapa 3 (Refresh Tokens)     → independente
Etapa 4 (Cookie Detection)   → independente
Etapa 5 (Testes)             → independente
Etapa 6 (Filtros)            → independente, pode ser feita a qualquer momento
```

Todas as etapas são independentes entre si.

**Sugestão de sequência:**
1 → 2 → 3 → 4 → 5 → 6

---

## Fora de escopo na Fase 3

| Feature | Motivo |
|---|---|
| Segunda fonte de scraping | Upwork: Cloudflare bloqueia todas as rotas (410/403), RSS descontinuado, API oficial requer aprovação de parceiro. Outras plataformas (Workana, Freelancer.com) ficam para Fase 4 |
| Telegram / Slack | Volume de usuários ainda não justifica |
| Admin panel | Usuário único por enquanto |
| NLP / relevance scoring | Overkill para o tamanho atual da base |

---

## Checklist de conclusão da Fase 3

- [ ] Rate limiting ativo em produção (testar manualmente com curl)
- [ ] Cadastro novo exige verificação de e-mail antes de receber alertas
- [ ] Usuários existentes não foram afetados (migration UPDATE executada)
- [ ] Refresh token funciona — sessão persiste após F5
- [ ] Dashboard mostra banner quando cookies do 99freelas expiram
- [ ] Admin recebe e-mail de alerta quando cookies expiram
- [ ] Suite de testes passando no CI (`npm test` verde no GitHub Actions)
- [ ] Filtros de budget e rating funcionando no feed
