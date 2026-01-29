# Guia: Módulo Financeiro

Este módulo gerencia contas bancárias e transações (contas a pagar/receber).

## Pré-requisitos
- **Header `x-tenant-id`**: Obrigatório.
- **Módulo Ativo**: `financial`.

---

## 1. Contas Bancárias (`/api/bank-accounts`)

Cadastro de contas para onde o dinheiro vai ou de onde sai.

### Listar Contas
- **GET** `/api/bank-accounts`
- **Query Param**: `?organizationId=UUID` (Opcional/Obrigatório dependendo da regra de negócio da empresa, se ela segregar por filial).
- **Permissão**: `READ_FINANCIAL`
- **Retorno**:
  ```json
  [
    {
        "id": "bank-acc-uuid",
        "name": "Itaú Principal",
        "balance": 15000.00
    }
  ]
  ```

### Criar Conta
- **POST** `/api/bank-accounts`
- **Permissão**: `CREATE_PAYMENT` (Nota: permissão pode ser ajustada futuramente para `MANAGE_BANK_ACCOUNTS`).
- **Body (Exemplo)**:
  ```json
  {
    "name": "Itaú Principal",
    "bankCode": "341",
    "agency": "1234",
    "accountNumber": "00000-0",
    "organizationId": "UUID"
  }
  ```

---

## 2. Transações (`/api/transactions`)

Registros de entradas (Receitas) e saídas (Despesas).

### Criar Transação
- **POST** `/api/transactions`
- **Permissão**: `CREATE_PAYMENT`
- **Body (Exemplo)**:
  ```json
  {
    "type": "EXPENSE", // ou INCOME
    "amount": 1500.00,
    "description": "Pagamento de Aluguel",
    "dueDate": "2024-02-10",
    "bankAccountId": "UUID...", // Onde o dinheiro sairá/entrará
    "category": "Rent"
  }
  ```
- **Retorno (201 Created)**:
  ```json
  {
    "id": "transaction-uuid",
    "status": "PENDING", // ou COMPLETED se já pago
    "amount": 1500.00
  }
  ```

### Aprovar/Confirmar Transação
- **POST** `/api/transactions/:id/approve`
- **Permissão**: `APPROVE_PAYMENT`
- **Uso**: Confirma que o dinheiro realmente saiu/entrou (Conciliação).
- **Body**: Vazio `{}`.

### Cancelar Transação
- **POST** `/api/transactions/:id/cancel`
- **Permissão**: `CANCEL_PAYMENT`
- **Uso**: Estorna ou anula o lançamento.
- **Body**: Vazio `{}`.

### Listar Transações
- **GET** `/api/transactions`
- **Permissão**: `READ_FINANCIAL`
- **Query Params**: `?startDate=2024-01-01&endDate=2024-01-31`
- **Retorno**: Extrato financeiro.
