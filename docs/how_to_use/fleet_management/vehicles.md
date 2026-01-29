# Guia: Gestão de Veículos (Fleet)

Dentro do módulo de Gestão de Frota, a entidade **Veículo** é central.

**Prefixo Base**: `/api/vehicles`

## 1. Visão Geral
Veículos podem ser de diversos tipos (Moto, Carro, Caminhão) e possuem um ciclo de vida:
- **PENDING**: Cadastrado, aguardando aprovação.
- **ACTIVE**: Aprovado e rodando.
- **MAINTENANCE**: Em oficina/manutenção.
- **INACTIVE**: Desativado.

---

## 2. Endpoints

### 2.1 Criar Veículo
- **Rota**: `POST /api/vehicles`
- **Permissão**: `CREATE_VEHICLE`
- **Body**:
  ```json
  {
    "brand": "Honda",
    "model": "CG 160 Titan",
    "year": 2024,
    "plate": "ABC-1234",
    "color": "Red",
    "type": "MOTORCYCLE", // Enum: MOTORCYCLE, CAR, VAN, TRUCK
    "fuelType": "GASOLINE", // Enum: GASOLINE, ETHANOL, DIESEL, ELECTRIC, HYBRID
    "status": "ACTIVE" // Opcional, default pode ser PENDING em alguns fluxos
  }
  ```
- **Retorno (201)**:
  ```json
  {
    "id": "vehicle-uuid...",
    "brand": "Honda",
    "status": "ACTIVE",
    "createdAt": "2024-01-01T00:00:00Z"
  }
  ```

### 2.2 Listar Veículos
- **Rota**: `GET /api/vehicles`
- **Permissão**: `READ_VEHICLE`
- **Query Params**:
  - `?status=ACTIVE` (Exemplo, se implementado filtro)
- **Retorno**: Array de Veículos.

### 2.3 Detalhes do Veículo
- **Rota**: `GET /api/vehicles/:id`
- **Permissão**: `READ_VEHICLE`

### 2.4 Atualizar Veículo
- **Rota**: `PUT /api/vehicles/:id`
- **Permissão**: `UPDATE_VEHICLE`
- **Body**: Campos parciais para atualização (ex: mudar cor, placa).

### 2.5 Remover Veículo
- **Rota**: `DELETE /api/vehicles/:id`
- **Permissão**: `DELETE_VEHICLE`

---

## 3. Ações de Ciclo de Vida

### 3.1 Aprovar Veículo
- **Rota**: `POST /api/vehicles/:id/approve`
- **Permissão**: `APPROVE_VEHICLE`
- **Descrição**: Usado quando o veículo foi cadastrado com status `PENDING` (por exemplo, via upload em lote ou cadastro simplificado). Muda o status para **`ACTIVE`**.

### 3.2 Enviar para Manutenção
- **Rota**: `POST /api/vehicles/:id/maintenance`
- **Permissão**: `SET_MAINTENANCE`
- **Descrição**: Muda o status para **`MAINTENANCE`**. O veículo não poderá ser atribuído para novas entregas enquanto estiver neste estado.

---

## 4. Lógica de Negócio Importante
1.  **Placa Única**: O sistema deve validar se a placa já existe dentro do mesmo Tenant (e possivelmente globalmente, dependendo da regra).
2.  **Multitenancy**: Um veículo pertence estritamente a um Tenant. Não é compartilhado.
