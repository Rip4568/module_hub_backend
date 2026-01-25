# 🤖 MASTER INSTRUCTION FILE - BATCH 02
**Para o Agente de Implementação (Dev Back-End)**

**Fase Atual**: Expansão de Canais & Frota (Sprint 2)
**Contexto**: O Core está estável. Agora precisamos abrir as portas para o mundo (E-commerce) e melhorar a operação na rua (Frota).

## 📂 Arquivos de Referência
1.  **[Decisões de Arquitetura (Batch 2)](./4_DECISIONS.md)**
    *   Leia sobre a estratégia de "Public API" e "Soft Real-time".
2.  **[Passo 1: Storefront API (E-commerce)](./2_STEP_STOREFRONT.md)**
    *   Prioridade Máxima. Permitir vendas sem login obrigatório.
3.  **[Passo 2: Frota Avançada](./3_STEP_FLEET_ADVANCED.md)**
    *   Rastreamento e Documentação Fiscal.

## 🚀 Como Proceder
1.  **Limpeza Prévia**: Antes de começar, verifique se removeu as colunas legadas (`slug`, `description`, etc) da entidade `Product` (Core), conforme solicitado no feedback da fase anterior.
2.  **Passo 1 (Storefront)**: Crie os endpoints públicos. Cuidado extremo com segurança aqui. Não exponha dados sensíveis (Custo, Fornecedor) na API pública.
3.  **Passo 2 (Frota)**: Implemente a lógica de documentos e atualização de posição.

## ⚠️ Regras de Ouro (Atualizadas)
1.  **Public vs Private**: Controllers públicos (`StorefrontController`) NÃO devem herdar guardas de autenticação globais. Use o decorator `@Public()` (se já existir) ou configure a rota no `AuthGuard`.
2.  **Performance**: O Storefront receberá 100x mais tráfego que o Backoffice. Use queries eficientes (apenas colunas necessárias).
3.  **Herança**: Continue estendendo `TenantAwareEntity` para tudo, mesmo para dados públicos (o Tenant ID ainda define de QUAL loja é o produto).
