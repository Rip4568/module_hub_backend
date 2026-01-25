# Developer Notes & Questions - #001

**Para**: Tech Lead / Product Lead
**De**: Agent Developer (Backend)
**Data**: 25/01/2026
**Assunto**: Análise Inicial - Isolamento de Tenant e Dependências

---

Olá. Analisei criteriosamente os documentos fornecidos (`1_INSTRUCTIONS_MASTER.md`, `2_STEP_TENANT_ISOLATION.md`, `4_DECISIONS.md`). Abaixo apresento meu plano de ataque e algumas dúvidas técnicas antes de iniciar o código profundo.

## 1. Plano de Implementação Proposto (Passo 1: Segurança)

Estou alinhado com a estratégia de "Defense in Depth" usando Subscribers. Meu plano consiste em:

1.  **Contexto (Zero Trust)**:
    *   Utilizar a biblioteca `nestjs-cls` para gerenciamento de `AsyncLocalStorage`. É o padrão da comunidade NestJS para Contexto de Request e facilita muito o acesso ao `tenantId` fora dos Controllers (ex: Subscribers).
    *   Middleware global para extrair o `tenantId` do JWT (Passport) e injetar no CLS.
2.  **Entidades**:
    *   Criar `TenantAwareEntity`.
    *   Refatorar **todas** as entidades para estender essa classe (massive refactor).
3.  **Segurança de Escrita (Write)**:
    *   `TenantSubscriber` interceptando `beforeInsert` (injeta/valida tenant) e `beforeUpdate` (impede troca de tenant).

## 2. Dúvidas e Decisões Técnicas

Tenho alguns pontos onde gostaria de sua validação ou esclarecimento:

### A. Repositórios Customizados vs. Padrão TypeORM
A instrução sugere criar um `TenantRepository`.
*   **Contexto**: O TypeORM moderno desencoraja um pouco a herança excessiva de repositórios customizados, e isso obrigaria a alterar todas as injeções de dependência nos Services de `@InjectRepository(Entity)` para `@InjectRepository(TenantRepository)`.
*   **Minha Sugestão**: Implementar a segurança de leitura primariamente via **Wrapper Service** ou **BaseService** para buscas, ou aceitar o `TenantRepository` sabendo que teremos que refatorar todos os construtores dos Services existentes.
*   **Pergunta**: Posso proceder com o `TenantRepository` mesmo com o custo alto de refatoração, ou prefere uma abordagem de "SafeService"?

### B. Dependência `nestjs-cls`
*   **Pergunta**: Tenho permissão para adicionar o pacote `nestjs-cls` ao `package.json`? Ele simplifica drasticamente o gerenciamento de contexto assíncrono em comparação a codificar `AsyncLocalStorage` manualmente.

### C. Refatoração de Entidades
*   **Confirmação**: A refatoração para `TenantAwareEntity` vai quebrar temporariamente o build de todos os módulos até que todos sejam migrados. Minha abordagem será migrar o core primeiro e ir corrigindo os módulos um a um. De acordo?

---

Aguardo seu "De Acordo" para iniciar a implementação da **Infraestrutura de Contexto (Item 1)**.
