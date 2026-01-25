# Decisões de Arquitetura (Batch 2)

## ADR-004: Public API Strategy
**Contexto**: O Storefront precisa ser acessado sem autenticação de usuário (JWT).
**Decisão**: Usar Decorator `@Public()` e validação explícita de Tenant via URL (`/storefront/:tenantId/...`).
**Motivo**:
- Não podemos usar subdomínios (tenant.app.com) facilmente em ambiente de dev local sem proxy reverso complexo. Padrão de URL é mais simples para o MVP.
- O `tenantId` na URL atua como o discriminador de contexto.
**Segurança**: O `TenantContextMiddleware` deve ser capaz de ler o `tenantId` da URL se o Token não estiver presente, ou o Controller deve setar o contexto manualmente. *Preferência*: O Controller extrai e valida.

## ADR-005: Histórico de Rastreamento
**Contexto**: Precisamos mostrar a rota percorrida pelo motorista.
**Decisão**: Tabela Relacional `DeliveryTrackingLog`.
**Motivo**: Para escala massiva, usaríamos DynamoDB ou Mongo. Para o MVP (< 10k entregas/dia), Postgres aguenta bem inserções sequenciais se indexado corretamente. Manter stack simples (apenas Postgres) reduz custo de manutenção.
