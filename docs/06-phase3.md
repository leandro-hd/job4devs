# 06 — Fase 3: De Portfólio a Produto Real

## Objetivo

Corrigir os gaps que impediam o projeto de ser usado por outras pessoas com segurança e
confiabilidade. Nenhuma feature nova — só fundação.

**Status: todas as 6 etapas implementadas.**

---

## Diagnóstico original

| Problema | Detalhe |
|---|---|
| Sem rate limiting | `/auth/login`, `/auth/register`, `/auth/forgot-password` expostos a brute-force e spam |
| Sem verificação de e-mail | Qualquer endereço podia ser cadastrado sem confirmação de propriedade |
| JWT só em memória | Ao atualizar a página o usuário perdia a sessão |
| Cookie 99freelas expira ~mensalmente | Quando expirava, `avg_proposal_value` e `avg_duration_days` voltavam a null silenciosamente |
| Zero testes automatizados | Regressões silenciosas a cada mudança |
| Filtros limitados | `min_budget` existia na UI mas não filtrava; sem `max_budget` nem `min_client_rating` |

---

## Etapas

### ✅ Etapa 1 — Rate Limiting

**Implementação:**
- `express-rate-limit` com store em memória (reseta no restart — suficiente para instância única no Railway)
- Limites por IP:
  - `POST /auth/login` → 10 / 15 min
  - `POST /auth/register` → 5 / hora
  - `POST /auth/forgot-password` → 5 / hora
  - `POST /auth/resend-verification` → 3 / hora
  - `POST /auth/reset-password` → 20 / hora (flood guard; brute-force inviável pelo token de 32 bytes)
- Resposta `429 Too Many Requests`

**Arquivos modificados:**
- `backend/package.json` (dep: `express-rate-limit`)
- `backend/src/api/routes/auth.routes.ts`

---

### ✅ Etapa 2 — Verificação de E-mail

**Implementação:**

*Backend:*
- Migration `011_add_email_verified_to_users.sql`: adiciona `email_verified BOOLEAN DEFAULT false`
  e `verification_token TEXT` (coluna dedicada — não reutiliza `reset_token` para evitar conflito)
- `POST /auth/register`: gera token (32 bytes hex), salva em `verification_token`, envia e-mail
- `POST /auth/verify-email`: recebe token, seta `email_verified = true`, limpa `verification_token`
- `POST /auth/resend-verification` (autenticado): reenvia e-mail
- `findAllActive()`: filtra `AND email_verified = true`

*Frontend:*
- `VerifyEmail.tsx`: auto-verifica se token está na URL; exibe "verifique seu e-mail" + botão
  reenvio se usuário logado não verificado
- `ProtectedRoute.tsx`: se `user.emailVerified === false`, redireciona para `/verify-email`
- `Register.tsx`: exibe estado de sucesso in-place em vez de redirecionar
- `Login.tsx`: detecta `?verified=true` e exibe banner de confirmação

**Gotcha de deploy:**
```sql
-- Rodar ANTES do primeiro deploy para não bloquear usuários já ativos:
UPDATE users SET email_verified = true WHERE active = true;
```

---

### ✅ Etapa 3 — Sessão Persistente (Refresh Tokens)

**Implementação:**

*Backend:*
- Migration `012_create_refresh_tokens.sql`: tabela `refresh_tokens` com `token_hash VARCHAR(64)`
- Access token: TTL reduzido para **15 minutos** (`JWT_EXPIRES_IN=15m` no Railway)
- Refresh token: 64 bytes hex, armazenado como SHA-256 hash, TTL **30 dias**
- Cookie `refresh_token`: `httpOnly`, `Secure` (só em prod), `SameSite=Strict`, `path: /api/auth`
- `POST /auth/login`: emite refresh token no cookie
- `POST /auth/refresh`: valida hash, rotaciona (apaga antigo, emite novo), retorna novo access token
- `POST /auth/logout`: apaga o refresh token do DB, limpa o cookie
- `cookie-parser` adicionado ao `app.ts`; CORS com `credentials: true`

*Frontend:*
- `useAuth.tsx`: estado `initializing` evita redirect prematuro para `/login` durante o mount;
  chama `POST /auth/refresh` silenciosamente ao iniciar
- `api.ts`: interceptor de 401 — tenta refresh automático uma vez, retentativa da request original;
  skip no próprio endpoint `/api/auth/refresh` para evitar loop infinito
- `logout()`: chama `POST /auth/logout` antes de limpar estado local

**Ação pendente no Railway:**
- Atualizar `JWT_EXPIRES_IN=15m` (era `7d`)

---

### ✅ Etapa 4 — Detecção de Cookie Expirado (99freelas)

**Implementação:**

*Backend:*
- `freelas99.scraper.ts`: `Freelas99AuthExpiredError` — detecta redirect 301/302 no bid page
  (cookie expirado) e lança erro tipado; outros erros (network, timeout) continuam silenciosos
- `scraper-state.ts`: singleton com flags `freelas99AuthExpired` e `freelas99AuthExpiredAlertSent`
  (resetam ao reiniciar o servidor)
- `scraper.service.ts`: captura `Freelas99AuthExpiredError`, seta o flag, envia e-mail de alerta
  **uma única vez por sessão** para `config.adminEmail`
- `notification.service.ts`: `sendAuthExpiredAlert` com instruções de renovação dos cookies

*Frontend:*
- `status.service.ts`: campo `freelas99AuthExpired: boolean` na interface `SystemStatus`
- Banner na UI removido pós-deploy — usuário final não pode atualizar as env vars do Railway,
  então a notificação é exclusivamente via e-mail ao admin

---

### ✅ Etapa 5 — Testes Automatizados

**Implementação:**

Ferramentas: `vitest` + `supertest`. `nock` não foi usado — as funções de parse do scraper foram
exportadas diretamente para teste unitário com fixtures HTML.

| Arquivo | Tipo | Cobertura |
|---|---|---|
| `filter.service.test.ts` | Unit | `parseKeywords`, `matchesKeywords`, `passesMinBudget`, `passesMaxBudget`, `passesMinClientRating` |
| `auth.service.test.ts` | Unit | `signToken`, `verifyToken`, `generateUnsubscribeToken`, `verifyUnsubscribeToken` |
| `freelas99.scraper.test.ts` | Unit | `parseTableCount`, `parseAvgProposalValue`, `parseAvgDurationDays` com fixtures HTML |
| `auth.routes.test.ts` | Integration | `POST /auth/register` (201, 409), `POST /auth/login` (200+cookie, 401), `POST /auth/refresh` (200, 401) |

Testes de integração pulados automaticamente quando `TEST_DATABASE_URL` não está setado.

**CI (`.github/workflows/ci.yml`):**
- Job `test` com PostgreSQL 16 como service; `deploy` agora depende de `[backend, frontend, test]`

**Arquivos criados/modificados:**
- `backend/vitest.config.mts`
- `backend/src/__tests__/filter.service.test.ts`
- `backend/src/__tests__/auth.service.test.ts`
- `backend/src/__tests__/freelas99.scraper.test.ts`
- `backend/src/__tests__/auth.routes.test.ts`
- `backend/src/__tests__/fixtures/freelas99-detail.html`
- `backend/src/__tests__/fixtures/freelas99-bid.html`
- `backend/src/services/scraper/sources/freelas99.scraper.ts` (export parse functions)

---

### ✅ Etapa 6 — Filtros Adicionais na UI

**Implementação:**

Três novas funções em `filter.service.ts` com semântica "se o job não tem o dado, inclui":
- `passesMinBudget(job, minBudget)`: exclui se `budgetMin` existe e é menor que o mínimo
- `passesMaxBudget(job, maxBudget)`: exclui se `budgetMax` existe e é maior que o máximo
- `passesMinClientRating(job, minRating)`: exclui se `clientRating` existe e é menor que o mínimo

`scrape.job.ts`: lê `min_budget`, `max_budget`, `min_client_rating` de `user_settings` e aplica
as três funções no pipeline de filtro após keywords/excludeKeywords.

`settings.controller.ts`: `ALLOWED_KEYS` inclui `max_budget` e `min_client_rating`.

Frontend: `Settings/index.tsx` ganhou os dois novos campos com descrição, e a nota "não é usado"
do `min_budget` foi substituída pelo comportamento real.

**Sem migration** — `user_settings` é key/value; novos keys não precisam de DDL.

---

## Fora de escopo na Fase 3

| Feature | Motivo |
|---|---|
| Segunda fonte de scraping | Upwork: todas as rotas retornam 410/403, RSS descontinuado, API oficial requer aprovação de parceiro. Outras plataformas ficam para Fase 4 |
| Telegram / Slack | Volume de usuários não justifica ainda |
| Admin panel | Usuário único por enquanto |
| NLP / relevance scoring | Overkill para o tamanho atual da base |
| Replay attack (família de tokens) | Implementação simplificada: apaga apenas o token usado, não todos os tokens do usuário |

---

## Checklist de deploy da Fase 3

### Implementado no código
- [x] Rate limiting ativo nas rotas de auth; frontend exibe mensagem correta no 429
- [x] Cadastro novo exige verificação de e-mail antes de receber alertas
- [x] Refresh token — sessão persiste após F5
- [x] Admin recebe e-mail de alerta único quando cookies do 99freelas expiram
- [x] Suite de testes criada (vitest + supertest)
- [x] Filtros de budget e rating funcionando no pipeline do worker

### Ações manuais (pós-deploy)
- [x] `ADMIN_EMAIL` configurado no Railway
- [x] `JWT_EXPIRES_IN=15m` atualizado no Railway
- [x] Usuários existentes marcados como verificados via resend (conta pré-Fase 3)

### Correções pós-deploy
- **Login.tsx**: catch block diferencia 429 de outros erros e exibe a mensagem da API
  em vez de "E-mail ou senha inválidos" quando o rate limit é atingido
- **freelas99.scraper.ts**: bid page retenta uma vez (com 2s de intervalo) antes de lançar
  `Freelas99AuthExpiredError` — evita falso positivo por redirect transiente do 99freelas

### Observações de deploy
- CI do GitHub Actions (job `test`) configurado mas com problema de infraestrutura do GitHub
  (runner não adquirido). Railway auto-deploy via push direto compensa enquanto não resolve.
- O `deploy` job no CI depende de `[backend, frontend, test]` — quando o runner voltar a funcionar,
  o deploy via CI retoma automaticamente.
