# Passo 2: Auditoria de Modularidade e Governança

**Prioridade**: MÉDIA (Qualidade)
**Objetivo**: Garantir independência dos módulos e aplicar limites de plano.

## 1. Módulos Essenciais
Os seguintes módulos são o "Kernel" e não podem ser desativados via API de Gestão:
*   `tenant`
*   `user`
*   `auth`
*   `role`
*   `permission`
*   `tenant-module`

**Tarefa**: No `TenantModuleService` (onde lista/ativa módulos), adicione validação para impedir a desativação destes.

## 2. Limite de Módulos (Governança)
O cliente quer limitar o plano gratuito/básico a 5 módulos ativos.
- [ ] **Onde**: `TenantModuleService.activate(tenantId, moduleId)`.
- [ ] **Lógica**:
    - Antes de ativar, contar quantos estão ativos (`count({ where: { tenantId, isActive: true } })`).
    - Se `>= 5`, lançar `ForbiddenException` com mensagem: *"Max modules reached. Please upgrade your plan."*

## 3. Checagem de Independência (Financeiro)
Verifique o `FinancialModule`.
- [ ] Garanta que consigo criar uma `Transaction` (Receita/Despesa) sem vincular a um `Order`.
- [ ] Crie um endpoint/service `createTransaction` simples no `FinancialController` se não houver.

## Critérios de Aceite
1.  Tentar desativar o módulo `auth` deve retornar Erro.
2.  Tentar ativar o 6º módulo deve retornar Erro.
3.  Consigo lançar uma despesa "Gasolina" no Financeiro sem ter feito um Pedido.
