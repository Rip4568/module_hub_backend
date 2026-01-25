# Passo 2: Refatoração do Módulo de Produto (Inventory Core)

**Prioridade**: ALTA (Dívida Técnica)
**Dependência**: Passo 1 (Tenant Isolation)

## O Problema
A entidade `Product` hoje é um "God Object" que mistura dados de logística (peso, estoque) com dados de vitrine virtual (imagens, html description).

## O Novo Schema

### 1. Product (Core)
Deve conter APENAS dados físicos e de identificação interna.
*   id
*   tenantId (FK)
*   sku (Unique por Tenant)
*   name (Nome interno/nota fiscal)
*   price (Preço base)
*   cost (Custo - apenas admin vê)
*   stock (Quantidade atual)
*   dimensions (L, W, H)
*   weight

### 2. ProductEcommerceProfile (Extension)
Deve conter dados de marketing e canais de venda.
*   id
*   productId (FK 1:1)
*   slug (URL amigável)
*   publicName (Pode ser diferente do interno)
*   description (HTML/Rich Text)
*   images (JSONB array)
*   seoTags (JSONB)
*   publishedAt (Data de publicação)
*   status (DRAFT, PUBLISHED)

## Migração de Dados
Como já temos dados (possivelmente), precisamos de cuidado.
- [ ] Criar a nova tabela `product_ecommerce_profile`.
- [ ] Criar script (Migration) que move dados da tabela `product` antiga para a nova tabela.
- [ ] Remover colunas antigas da `product`.

## Impacto no Código
- `ProductService.create`: Agora precisa criar 2 entidades se vierem dados de ecommerce.
- `ProductService.findAll`: Por padrão, traz só o Core (mais leve). Se passar `?with=ecommerce`, faz o join.
