# Passo 1: API de Storefront (E-commerce Público)

**Prioridade**: ALTA (Revenue Enabler)
**Dependência**: Cleanup do Product Entity

## Contexto
Até agora, todas as rotas exigem `Bearer Token`. Precisamos de uma área pública onde o cliente final possa ver produtos e comprar.

## Requisitos Técnicos

### 1. Public Decorator
O NestJS possui guardas globais. Precisamos de um mecanismo para ignorar a autenticação em rotas específicas.
- [ ] Criar decorator `@Public()` usando `SetMetadata`.
- [ ] Atualizar `JwtAuthGuard` (ou equivalente) para verificar o `reflector` e permitir acesso se a rota for pública.

### 2. Storefront Controller
Criar um `ProductStorefrontController` separado do `ProductController` (Backoffice).
- [ ] Rota: `GET /storefront/:tenantId/products`
    - *Nota*: Como o usuário não está logado, ele não tem `tenantId` no token. O `tenantId` deve vir na URL ou Header (`x-tenant-id`).
    - Validar se o tenant existe e tem módulo E-commerce ativo.
- [ ] Rota: `GET /storefront/:tenantId/products/:slug`
    - Busca por Slug (SEO friendly).

### 3. Service Layer
- [ ] `findAllPublic(tenantId, query)`:
    - Deve filtrar `status = ACTIVE`.
    - Deve filtrar `ecommerceProfile.status = PUBLISHED`.
    - Deve fazer join obrigatório com `ecommerceProfile` (título, imagens, preço).
    - **Performance**: Use `select` no TypeORM para NÃO trazer `cost` (Custo do Produto) ou `supplierId`. Isso é dado confidencial.

### 4. Checkout (Simplificado)
- [ ] `POST /storefront/:tenantId/checkout`
    - Recebe: Itens (id, qtd), Dados do Cliente (Nome, Email).
    - Cria um `Order` com status `PENDING`.
    - Cria o `Customer` se não existir (baseado no email).
    - *Desafio*: Como garantir segurança? (Rate limit por IP, Captcha opcional). Por enquanto, foque no funcional básico.

## Critérios de Aceite
1.  Consigo listar produtos via CURL sem enviar Token.
2.  Produtos inativos ou rascunhos não aparecem na listagem pública.
3.  Campo `cost` não é retornado no JSON.
