# Registro de Decisões de Arquitetura (ADR)

*Este documento consolida as decisões técnicas que guiam o desenvolvimento.*

## ADR-001: Isolamento de Multi-Tenancy com TypeORM
**Contexto**: Risco de vazamento de dados entre clientes.
**Decisão**: Usar **Subscribers** do TypeORM e não apenas filtros manuais no Service.
**Motivo**: "Defense in Depth". Se o dev esquecer o filtro no Service, o Subscriber garante no nível do banco.
**Detalhes**:
1.  Todo request autenticado popula um `RequestContext` com `tenantId`.
2.  O `TenantSubscriber` verifica esse contexto antes de salvar qualquer entidade.
3.  Tentativa de salvar sem contexto = Erro.

## ADR-002: Separação Logística vs Vendas (Product Split)
**Contexto**: O sistema precisa atender Transportadoras (que não têm loja online) e E-commerces (que têm).
**Decisão**: Dividir `Product` em `InventoryCore` (obrigatório) e `EcommerceProfile` (opcional).
**Motivo**: Evitar tabelas com colunas `NULL` desnecessárias e permitir que módulos futuros (ex: Módulo de Manufatura) estendam o produto sem poluir o core.

## ADR-003: TypeORM vs Prisma
**Contexto**: O projeto iniciou (ou foi cogitado) com Prisma, mas está usando TypeORM.
**Decisão**: Manter o **TypeORM**.
**Motivo**: TypeORM tem melhor suporte a patterns complexos de Enterprise (como Subscribers e Inheritance) que são vitais para nossa estratégia de Tenant Isolation.
