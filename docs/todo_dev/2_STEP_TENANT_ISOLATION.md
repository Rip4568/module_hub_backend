# Passo 1: Implementação do Isolamento de Tenant (TypeORM)

**Prioridade**: CRÍTICA (Bloqueante)
**Estabilidade**: Alfa

## Contexto
Atualmente, o sistema confia que o desenvolvedor lembre de colocar `.where({ tenantId })`. Isso é falho. Precisamos forçar isso na camada do ORM.

## Tarefas Técnicas

### 1. Contexto de Execução (AsyncLocalStorage)
Precisamos ter acesso ao `tenantId` em qualquer lugar do ciclo de vida do Request, sem passar argumentos manualmente.
- [ ] Criar `src/common/context/request.context.ts` (ou similar) usando `AsyncLocalStorage`.
- [ ] Criar Middleware/Interceptor que popula esse storage a partir do JWT ( `req.user.tenantId`).

### 2. Entidade Abstrata (`TenantAwareEntity`)
- [ ] Criar `src/common/entities/tenant-aware.entity.ts`.
- [ ] Adicionar coluna `tenantId`.
- [ ] Todas as entidades do sistema (Product, Order, etc.) devem estender essa classe.

### 3. TypeORM Subscriber (`TenantSubscriber`)
O Subscriber é o "policial" que intercepta o banco.
- [ ] Implementar `EntitySubscriberInterface<TenantAwareEntity>`.
- [ ] **beforeInsert**:
    - Verificar se `tenantId` já existe na entidade.
    - Se não, pegar do `RequestContext`.
    - Se não houver contexto (ex: script rodando), lançar erro ou logar aviso (configurável).
- [ ] **beforeUpdate**:
    - Garantir que não estão tentando alterar o `tenantId` (imutável).
    - Injetar `where: { tenantId }` se possível ou validar se a entidade pertence ao tenant.

### 4. Query Scope (Leitura)
O TypeORM é chato com Scopes globais.
- [ ] **Abordagem Recomendada**: Criar um `TenantRepository` customizado ou um Wrapper que sempre aplica o filtro.
- [ ] **Alternativa**: Usar `@AfterLoad` pra verificar (mas isso é pós-query, ineficiente).
- [ ] *Sua Decisão*: Implemente a forma mais segura de garantir que `find()` retorne apenas dados do tenant atual.

## Critérios de Aceite
1.  Criar um teste onde eu tento salvar um `Product` sem passar `tenantId` explicitamente -> Deve salvar com o ID do token.
2.  Tentar buscar dados do Tenant B logado como Tenant A -> Deve retornar vazio.
