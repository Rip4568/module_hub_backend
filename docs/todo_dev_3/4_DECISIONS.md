# Decisões de Arquitetura (Batch 3)

## ADR-006: Desacoplamento de Entidades Core
**Contexto**: A amarração forte (FK Not Null) entre módulos de negócio (Delivery -> Order) viola o princípio de modularidade "Pay as you go".
**Decisão**: Usar acoplamento fraco (Nullable FKs) para relações entre módulos distintos.
**Motivo**:
- Permite que o módulo `Delivery` funcione mesmo que o módulo `Order` esteja desativado/não assinado.
- A integridade referencial ainda existe (se o ID for preenchido, ele deve existir), mas a presença não é obrigatória.

## ADR-007: Essential Modules Hardcoding
**Contexto**: O usuário pode acidentalmente "se trancar para fora" desativando o módulo de usuários ou auth.
**Decisão**: Hardcode da lista de módulos protegidos no Service Layer.
**Motivo**: Segurança operacional. Não vale a pena criar uma tabela de "module_metadata" complexa agora só para uma flag `is_system_required`. Arrays constantes (`const SYSTEM_MODULES = [...]`) resolvem de forma simples e eficiente.
