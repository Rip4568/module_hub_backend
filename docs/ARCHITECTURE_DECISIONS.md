# Registro de Decisões de Arquitetura (ADR)

## ADR-001: Isolamento de Multi-Tenancy com TypeORM
**Data**: 25/01/2026
**Status**: Aceito

### Contexto
O ModuleHub é um sistema Multi-Tenant. Precisamos garantir que dados de um cliente nunca sejam acessados por outro. O sistema utiliza TypeORM. O risco de um desenvolvedor esquecer um `where: { tenantId: user.tenantId }` é alto e catastrófico.

### Decisão
Implementaremos o isolamento na camada de persistência utilizando **TypeORM Subscribers** e **Abstract Entities**.

1. **Escrita (INSERT/UPDATE/DELETE)**:
   - Um `TenantSubscriber` interceptará todas as operações de persistência.
   - Ele validará se o contexto de execução (Request) possui um Tenant autenticado.
   - Ele injetará automaticamente o `tenantId` na entidade antes de salvar, prevenindo spoofing.

2. **Leitura (SELECT)**:
   - Como o TypeORM não possui scopes globais nativos robustos como o Eloquent/Sequelize, adotaremos o padrão de **TenantRepositoryWrapper** ou **Scopes Manuais** via QueryBuilder.
   - Todo Service deve operar sob um contexto de Tenant.

### Consequências
- Maior segurança: Difícil "injetar" dados no tenant errado.
- Complexidade: Setup inicial do Subscriber e Contexto (AsyncLocalStorage) é necessário.

---

## ADR-002: Extração do Núcleo de Inventário (Refatoração de Produto)
**Data**: 25/01/2026
**Status**: Aceito

### Contexto
O modelo atual de `Product` mistura conceitos de Logística (Peso, Custo, Estoque) com E-commerce (SEO, Slug, Vitrine). Isso impede o uso do ERP por empresas que não vendem online ou que usam canais de venda externos, obrigando-as a preencher campos irrelevantes.

### Decisão
Vamos quebrar a entidade `Product` em duas:

1. **Inventory Core (`Product`)**:
   - Mantém a identidade única do item físico/lógico.
   - Dados: SKU, Nome Interno, Dimensões, Custos, Estoque.
   - Obrigatório para todos os módulos.

2. **Sales Channel Profile (`ProductEcommerceProfile`)**:
   - Extensão opcional (Table Splitting ou One-To-One).
   - Dados: Título de Venda, Descrição HTML, Tags SEO, Imagens Promocionais, Slug.
   - Só existe se o módulo "E-commerce" estiver ativo.

### Consequências
- Flexibilidade: Permite que o produto tenha perfis diferentes para canais diferentes no futuro (Ex: Amazon vs Site Próprio).
- Migração: Dados existentes precisarão ser migrados.
