# Roadmap do Produto: ModuleHub ("ERP LEGO")

## Visão do Produto
O ModuleHub é uma plataforma SaaS White-label que preenche a lacuna entre planilhas simples e ERPs monolíticos caros. Nossa arquitetura "Núcleo + Módulos" permite que clientes (Tenants) paguem apenas pelo que usam.

**Público Alvo Inicial**: Logística e Distribuição com potencial de venda online.

---

## Fases de Desenvolvimento (Backend)

### 🏁 Fase 1: O "Kernel" (Segurança & Base)
> **Foco**: Garantir que dados de um cliente nunca vazem para outro e fundação sólida.
- [x] **Isolamento de Tenant (Zero-Trust)**:
  - Implementação de `TypeORM Subscribers` para garantir `where: { tenantId }` em todas as operações.
- [x] **Autenticação Avançada**:
  - JWT com Refresh Token e Rotação.
  - Cache de Permissões (Redis) para performance.
- [ ] **Gerenciador de Módulos**:
  - Sistema para ativar/desativar módulos por Tenant.

### 📦 Fase 2: O Core de Negócio (Inventory)
> **Foco**: O coração do ERP. Gestão de produtos e estoque desacoplada de vendas.
- [x] **Extração do Core de Catálogo**:
  - Separação de `Product` (Dados Logísticos: SKU, Peso, Custo) de `ProductEcommerce` (Dados de Venda: SEO, HTML, Vitrine).
- [x] **Controle de Estoque**:
  - Implementação de Kardex (Histórico de Movimentações) imutável.

### 🚚 Fase 3: A Especialização (Logística)
> **Foco**: Diferencial competitivo para distribuidoras.
- [x] **Gestão de Frota**:
  - Veículos e Motoristas.
- [x] **Gestão de Pedidos (OMS)**:
  - Fluxo: Pendente -> Aprovado -> Separação -> Despachado -> Entregue.
  - Baixa automática de estoque e lançamento financeiro "A Receber".

### 🛒 Fase 4: Canais de Venda (E-commerce)
> **Foco**: Conectar o Core Logístico à web.
- [x] **Storefront API**:
  - Endpoints públicos para vitrine virtual.
  - Carrinho e Checkout integrado ao OMS.

---

## 🔮 Futuro e Expansão (Backlog de Governança)
- [ ] **"Pure Fleet" Capability**:
  - Permitir criação de `Delivery` sem `Order` (e sem `Product`), para transportadoras que só fazem frete, não venda.
  - *Atual*: Hoje `Delivery` exige um `Order` que exige `Product`. Necessário refatorar para `ServiceOrder`.
- [ ] **Limites e Planos**:
  - Implementar verificação de "Max Modules = 5".
  - Bloquear ativação se exceder plano.
  - Mensagem de upgrade customizável.
- [ ] **Integração Frontend**:
  - Próximo grande marco do projeto.
