# Guia: Módulo Ecommerce (Pedidos e Produtos)

Este módulo gerencia o catálogo de produtos/serviços e o ciclo de vida dos pedidos.

## Pré-requisitos
- **Header `x-tenant-id`**: Obrigatório em todas as rotas.
- **Módulos Ativos**: A empresa deve ter `ecommerce` e/ou `order_management` ativos.

---

## 1. Produtos (`/api/products`)

### Criar Produto
- **Rota**: `POST /api/products`
- **Permissão**: `CREATE_PRODUCT`
- **Body Exemplo**:
  ```json
  {
    "name": "Entrega Expressa",
    "description": "Até 10km",
    "price": 15.00,
    "sku": "ENT-EXP",
    "trackInventory": false,
    "status": "ACTIVE"
  }
  ```
- **Retorno**: Objeto produto criado.

### Publicar/Despublicar
- **Rota**: `POST /api/products/:id/publish` (e `/unpublish`)
- **Permissão**: `PUBLISH_PRODUCT`

---

## 2. Pedidos (`/api/orders`)

O fluxo central da logística.

### Criar Pedido (Manual)
- **Rota**: `POST /api/orders`
- **Permissão**: `CREATE_ORDER`
- **Body Exemplo**:
  ```json
  {
    "customerName": "Maria Souza",
    "customerPhone": "11999999999",
    "shippingAddress": {
      "street": "Rua das Flores, 123",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01000-000"
    },
    "items": [
      { "productId": "uuid-produto...", "quantity": 1 }
    ],
    "notes": "Campainha quebrada"
  }
  ```

### Listar Pedidos (Otimizado)
- **Rota**: `GET /api/orders`
- **Permissão**: `READ_ORDER`
- **Retorno**: Lista de pedidos **com relacionamentos carregados** (Cliente, Motorista, Veículo, Itens).

### Atribuir Motorista e Veículo (Assign Resources)
- **Rota**: `POST /api/orders/:id/assign`
- **Permissão**: `ASSIGN_DRIVER`
- **Descrição**: Vincula os recursos logísticos ao pedido.
- **Body**:
  ```json
  {
    "driverId": "uuid-motorista...", // Obrigatório
    "vehicleId": "uuid-veiculo..."   // Opcional (mas recomendado para roteirização completa)
  }
  ```
- **Nota**: Altera status para `ASSIGNED`.

### Despachar (Em Rota)
- **Rota**: `POST /api/orders/:id/dispatch`
- **Permissão**: `UPDATE_ORDER`
- **Descrição**: Cria o registro de `Delivery` e muda status para `IN_ROUTE`. Usa o motorista/veículo já atribuídos.

### Finalizar
- **Rota**: `POST /api/orders/:id/complete`
- **Permissão**: `COMPLETE_ORDER`
