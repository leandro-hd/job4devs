# 07 — Fase 4: Crescimento Controlado

## Objetivo

Evoluir o sistema de ferramenta pessoal para um produto capaz de atender múltiplos usuários
com confiabilidade, visibilidade e controle. Nenhuma mudança de stack — só ampliar o que já existe.

**Status: planejado.**

---

## Diagnóstico pós-Fase 3

| Lacuna | Impacto |
|---|---|
| Fonte única de scraping (99freelas) | Cobertura limitada; ponto único de falha |
| Sem segunda fonte de vagas | Usuários perdem oportunidades de outras plataformas |
| Dashboard sem lista de vagas | Sem visibilidade do que foi coletado |
| Sem painel de admin | Gerenciar usuários exige SQL direto no banco |
| Sem exclusão de conta | Bloqueio para abertura pública (LGPD) |
| Sem monitoramento de uptime | Servidor pode cair sem alerta |
| Rate limit em memória | Reseta no restart — janela de brute-force no reinício |

---

## Etapas

### Etapa 1 — Segunda fonte de scraping (Workana)

**Motivação:** 99freelas é a única fonte; adicionar Workana dobra a cobertura de vagas e
remove o ponto único de falha no scraping.

**Implementação:**
- `backend/src/services/scraper/sources/workana.scraper.ts` — novo scraper seguindo a
  mesma interface dos scrapers existentes
- `backend/src/services/scraper/scraper.service.ts` — registrar Workana no array de fontes
- Migration para inserir o novo `source` na tabela `sources`
- Investigar se Workana exige auth para dados de proposta (como o 99freelas)

**Riscos:**
- Ver `docs/04-risks.md` — mesmas estratégias de mitigação (delay entre requests, User-Agent)
- Workana pode bloquear scraping via Cloudflare; avaliar antes de implementar

---

### Etapa 2 — Dashboard com lista de vagas recentes

**Motivação:** hoje o dashboard só mostra contadores. O usuário não tem visibilidade do que
foi coletado — precisa esperar o e-mail para ver as vagas.

**Implementação:**

*Backend:*
- `GET /api/jobs` — retorna vagas paginadas com filtros opcionais (source, date range)
- Novo método no `jobs.repository.ts`: `findRecent(limit, offset)`

*Frontend:*
- Tabela/lista de vagas no Dashboard com título, fonte, budget, data
- Link direto para a vaga externa
- Filtro por fonte e período

---

### Etapa 3 — Painel de admin

**Motivação:** sem painel, qualquer operação administrativa (ver usuários, desativar conta,
inspecionar logs) exige acesso direto ao banco. Bloqueio para abrir a mais usuários.

**Implementação:**

*Backend:*
- Campo `role ENUM('user', 'admin') DEFAULT 'user'` na tabela `users` (migration)
- Middleware `requireAdmin` — verifica `user.role === 'admin'`
- Rotas `GET /api/admin/users`, `GET /api/admin/logs`, `PATCH /api/admin/users/:id`

*Frontend:*
- Rota `/admin` protegida por role
- Lista de usuários: e-mail, data de cadastro, status de verificação, ativo/inativo
- Lista de `alert_logs`: ciclos recentes, vagas coletadas, erros

---

### Etapa 4 — Gestão de conta

**Motivação:** usuários precisam conseguir gerenciar a própria conta sem contato com o admin.
Exclusão de conta é obrigatória para qualquer produto público (LGPD).

**Implementação:**

*Backend:*
- `DELETE /api/account` — apaga dados do usuário (cascata via FK) e envia e-mail de confirmação
- `PATCH /api/account/password` — troca de senha autenticada (senha atual + nova senha)
- `GET /api/notifications` — histórico de notificações do usuário

*Frontend:*
- Aba "Conta" nas configurações com troca de senha e exclusão de conta (confirmação via modal)
- Página de histórico de notificações com título da vaga, data, status (enviado/falhou)

---

### Etapa 5 — Monitoramento de uptime

**Motivação:** o servidor pode cair silenciosamente no Railway. Atualmente nenhum alerta
externo monitora o `/health` endpoint.

**Implementação:**
- Configurar **UptimeRobot** (gratuito) para monitorar `https://api.job4devs.dev/health`
  a cada 5 minutos e enviar e-mail de alerta se cair
- Nenhuma mudança de código necessária — o endpoint `/health` já existe

---

## Fora de escopo na Fase 4

| Feature | Motivo |
|---|---|
| Notificações via Telegram/Slack | Volume de usuários ainda não justifica |
| Rate limit persistente (Redis) | Custo adicional no Railway; risco aceitável para instância única |
| NLP / relevance scoring | Overkill para o tamanho atual da base |
| Billing / planos pagos | Fora do objetivo do projeto |
| App mobile | Fora do escopo de portfólio |

---

## Ordem sugerida de implementação

1. **Etapa 5** (uptime) — sem código, 10 minutos, valor imediato
2. **Etapa 1** (Workana) — maior valor de produto, mas depende de viabilidade de scraping
3. **Etapa 2** (dashboard) — melhora experiência sem dependência externa
4. **Etapa 4** (gestão de conta) — necessário antes de abrir para mais usuários
5. **Etapa 3** (admin panel) — por último, pois depende do campo `role` que afeta auth
