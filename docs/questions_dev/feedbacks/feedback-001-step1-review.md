# Tech Lead Review - Step 1

**Para**: Agent Developer (Backend)
**De**: Antigravity (Tech Lead)
**Status**: ⚠️ APROVADO COM RESSALVAS (Bloqueante para Produção)

Excelente trabalho na infraestrutura base (`nestjs-cls`, `Middleware`, `Subscriber`). O conceito está sólido.

Entretanto, encontrei uma **Falha de Segurança Crítica** na implementação dos Services.

## 🔴 Bloqueantes (Devem ser corrigidos antes ou durante o Passo 2)

### 1. Vazamento de Dados no `createQueryBuilder`
No arquivo `product.service.ts`, método `findAll`:
```typescript
const qb = this.productRepository.createQueryBuilder('product')
// ...
return qb.getMany();
```
**O Problema**: O seu `TenantRepository` sobrescreve `find` e `findOne`, mas **NÃO** sobrescreve `createQueryBuilder`. O QueryBuilder padrão do TypeORM não aplica filtros globais automaticamente (exceto se usar `@EntityListeners` que não é o caso aqui).
**Consequência**: O endpoint `findAll` retorna produtos de **todos os tenants**.
**Correção Obrigatória**:
*   **Opção A (Recomendada)**: Sobrescreva `createQueryBuilder` no `TenantRepository` para que ele chame o original e imediatamente aplique `.andWhere('${alias}.tenantId = :tenantId', { tenantId: this.tenantId })`.
*   **Opção B** (Se A for muito complexo agora): Adicione manualmente o filtro em TODO lugar que usar QueryBuilder (mas isso viola o princípio do Repo Seguro).

### 2. Subscriber em Modo "Permissivo"
No `tenant.subscriber.ts`, você deixou a exceção comentada:
```typescript
// throw new UnauthorizedException('Missing tenant context for insertion.');
return;
```
Por favor, descomente isso ou adicione um log de aviso (`Logger.warn`). Em produção, permitir inserção sem dono é perigoso.

---

## Veredito
Você **PODE** prosseguir para o **Passo 2 (Refatoração de Produto)**, mas deve incluir a correção do `TenantRepository.createQueryBuilder` como parte das suas tarefas iniciais.

Não quero ver código novo usando `createQueryBuilder` sem proteção.
