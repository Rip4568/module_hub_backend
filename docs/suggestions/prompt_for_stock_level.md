# Prompt de Implementação: Gestão de Estoque Multi-Local (StockLevel)

**Contexto**: Atualmente, o sistema possui um estoque unificado na tabela `Product` (coluna `stock`). Precisamos evoluir para um sistema onde o estoque existe em locais específicos (Depósito Central, Veículo A, Veículo B, etc.), permitindo "Carregar a Van" e "Vender da Van".

**Objetivo**: Implementar a entidade `StockLevel` e a lógica de transferência entre locais.

---

## 🏗️ 1. Banco de Dados (Novas Entidades)

### A. `StockLevel` (Nível de Estoque)
Tabela Pivot que guarda quanto de cada produto existe em cada lugar.
- `id`: uuid
- `tenantId`: uuid
- `productId`: uuid
- `variantId`: uuid (opcional)
- `quantity`: number (pode ser negativo se permitir venda sem estoque, ou travar em 0)
- `locationType`: enum ('WAREHOUSE', 'VEHICLE')
- `vehicleId`: uuid (nullable, preenchido se type == VEHICLE)
- `warehouseId`: uuid (nullable, preenchido se type == WAREHOUSE - *obs: criar entidade Warehouse se não existir, ou usar um ID fixo 'DEFAULT' por enquanto*)

### B. `InventoryMovement` (Histórico/Kardex)
Registro imutável de cada movimentação.
- `id`: uuid
- `type`: enum ('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT', 'SALE')
- `originLocationType`: ...
- `originReferenceId`: (id do veiculo ou warehouse)
- `destinationLocationType`: ...
- `destinationReferenceId`: ...
- `quantity`: number
- `productId`: uuid

---

## 🛠️ 2. Refatoração de Código

### A. Entidade `Product`
- A coluna `stock` atual deve se tornar um **campo calculado** (soma de todos os `StockLevels` desse produto) OU representar apenas o estoque do "Depósito Central".
- **Decisão**: Mantenha `stock` na entidade `Product` como "Cache Total", mas toda escrita deve atualizar `StockLevel` e recalcular o total.

### B. `OrderService` (Venda)
- Ao criar um pedido (`create`), verificar se o pedido tem `vehicleId`.
- **Se tiver `vehicleId`**:
    - Verificar disponibilidade na tabela `StockLevel` onde `vehicleId == order.vehicleId`.
    - Deduzir desse `StockLevel`.
- **Se NÃO tiver `vehicleId`**:
    - Deduzir do `StockLevel` onde `locationType == 'WAREHOUSE'`.

---

## 🚀 3. Novos Endpoints (`InventoryController`)

### A. Transferir (Carga)
`POST /api/inventory/transfer`
- **Body**: `{ productId, quantity, fromType: 'WAREHOUSE', toType: 'VEHICLE', toId: 'uuid-van' }`
- **Lógica**: Deduz do Depósito, Adiciona na Van. Cria registro em `InventoryMovement`.

### B. Ajuste Manual (Quebra/Perda)
`POST /api/inventory/adjust`
- **Body**: `{ productId, quantity: -1, locationType: 'VEHICLE', locationId: 'uuid-van', reason: 'BROKEN' }`
- **Lógica**: Atualiza o `StockLevel` direto.

---

## ✅ Definição de Pronto (DoD)
1.  Consigo transferir 10 itens do "CD" para a "Van 01".
2.  Quando vendo 1 item pela "Van 01", o estoque da "Van 01" cai para 9.
3.  O estoque do "CD" permanece inalterado nessa venda.
4.  Consigo tirar um extrato (`InventoryMovement`) e ver: "Transferência CD->Van", "Venda na Van".
