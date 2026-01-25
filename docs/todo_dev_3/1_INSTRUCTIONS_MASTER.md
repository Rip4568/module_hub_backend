# 🤖 MASTER INSTRUCTION FILE - BATCH 03
**Para o Agente de Implementação (Dev Back-End)**

**Fase Atual**: Independência de Módulos (Pure Fleet)
**Contexto**: O cliente solicitou que o sistema suporte casos de uso onde apenas UM módulo é usado (ex: Só Frota, sem Vendas). Hoje temos acoplamento forte (Delivery -> Order -> Product).

## 📂 Arquivos de Referência
1.  **[Decisões de Arquitetura (Batch 3)](./4_DECISIONS.md)**
    *   Entenda o conceito de "Service Order" e "Polymorphic Transactions".
2.  **[Passo 1: "Pure Fleet" (Delivery Refactor)](./2_STEP_PURE_FLEET.md)**
    *   Prioridade Máxima. Quebrar a dependência obrigatória de `Order`.
3.  **[Passo 2: Auditoria de Modularidade](./3_STEP_MODULARITY_AUDIT.md)**
    *   Garantir que Financeiro e outros módulos funcionem isoladamente.

## 🚀 Como Proceder
1.  **Analise com Cuidado**: Refatorar relações de banco (FKs) é perigoso. Faça migrations cuidadosas.
2.  **Delivery**: Agora deve poder existir SEM `orderId`. Adicione `type` para diferenciar.
3.  **Financeiro**: Verifiquei que `Transaction` já tem `orderId` nullable. Ótimo. Apenas garanta que o Service permita criar transações avulsas.

## ⚠️ Regras de Ouro
1.  **Backward Compatibility**: O fluxo antigo (Venda -> Entrega) DEVE continuar funcionando.
2.  **Nullable FKs**: Ao tornar uma FK opcional, garanta que o código (Service) trate o nulo corretamente (null checks).
3.  **Módulos Essenciais**: Tenant, Auth, User e Permission NUNCA podem ser desativados.
