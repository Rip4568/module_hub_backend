# Roadmap do Produto: ModuleHub ("ERP LEGO")

## Visão do Produto
O ModuleHub é uma plataforma SaaS White-label que preenche a lacuna entre planilhas simples e ERPs monolíticos caros. Nossa arquitetura "Núcleo + Módulos" permite que clientes (Tenants) paguem apenas pelo que usam.

**Público Alvo Inicial**: Logística e Distribuição com potencial de venda online.

---

## Fases de Desenvolvimento (Backend)

### 🏁 Fase 1: O "Kernel" (Segurança & Base)
> **Foco**: Garantir que dados de um cliente nunca vazem para outro e fundação sólida.
- [ ] **Isolamento de Tenant (Zero-Trust)**:
  - Implementação de `TypeORM Subscribers` para garantir `where: { tenantId }` em todas as operações.
- [ ] **Autenticação Avançada**:
  - JWT com Refresh Token e Rotação.
  - Cache de Permissões (Redis) para performance.
- [ ] **Gerenciador de Módulos**:
  - Sistema para ativar/desativar módulos por Tenant.

### 📦 Fase 2: O Core de Negócio (Inventory)
> **Foco**: O coração do ERP. Gestão de produtos e estoque desacoplada de vendas.
- [ ] **Extração do Core de Catálogo**:
  - Separação de `Product` (Dados Logísticos: SKU, Peso, Custo) de `ProductEcommerce` (Dados de Venda: SEO, HTML, Vitrine).
- [ ] **Controle de Estoque**:
  - Implementação de Kardex (Histórico de Movimentações) imutável.

### 🚚 Fase 3: A Especialização (Logística)
> **Foco**: Diferencial competitivo para distribuidoras.
- [ ] **Gestão de Frota**:
  - Veículos e Motoristas.
- [ ] **Gestão de Pedidos (OMS)**:
  - Fluxo: Pendente -> Aprovado -> Separação -> Despachado -> Entregue.
  - Baixa automática de estoque e lançamento financeiro "A Receber".

### 🛒 Fase 4: Canais de Venda (E-commerce)
> **Foco**: Conectar o Core Logístico à web.
- [ ] **Storefront API**:
  - Endpoints públicos para vitrine virtual.
  - Carrinho e Checkout integrado ao OMS.

---

## Próximos Passos (Imediato)
1. Refatoração do Schema para suportar Multi-Tenancy seguro no TypeORM.
2. Separação das tabelas de Produto.
