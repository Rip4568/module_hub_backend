# Guia: Gestão de Motoristas (Fleet)

O Motorista é um Usuário com um perfil estendido na tabela `Driver`.

**Prefixo Base**: `/api/drivers`

## 1. Visão Geral
O Motorista é vinculado à empresa (Tenant). Um mesmo usuário (email) pode ser motorista em várias empresas (perfis `Driver` diferentes).

**Estados do Motorista**:
- **PENDING**: Cadastrado mas não aprovado (ou convidado mas não aceitou - *legado*). Atualmente o fluxo de convite já os cria como **ACTIVE**.
- **ACTIVE**: Aprovado e operante.
- **BLOCKED**: Bloqueado administrativamente (Impede receber novas cargas, mas **NÃO** impede acesso a histórico/exportação).

---

## 2. Endpoints de Gestão (Painel Admin)

### 2.1 Convidar Motorista (Novo Fluxo)
- **Rota**: `POST /api/drivers/invite`
- **Permissão**: `CREATE_DRIVER`
- **Descrição**: O método "correto" de trazer um motorista para a frota. Cobre tanto cadastro novo quanto vínculo de existente.
- **Body**:
  ```json
  {
    "email": "motorista@gmail.com",
    "name": "João Silva"
  }
  ```
- **Retorno**: Objeto Driver criado com `status: ACTIVE`.

### 2.2 Listar Motoristas
- **Rota**: `GET /api/drivers`
- **Permissão**: `READ_DRIVER`

### 2.3 Aprovar Motorista (Fallback)
- **Rota**: `POST /api/drivers/:id/approve`
- **Permissão**: `APPROVE_DRIVER`
- **Uso**: Rota de fallback caso algum motorista tenha entrado como PENDING (ex: cadastro autônomo sem convite). Em 99% dos casos, o Invite já resolve.

### 2.4 Bloquear Motorista
- **Rota**: `POST /api/drivers/:id/block`
- **Permissão**: `BLOCK_DRIVER`
- **Uso**: Impede o motorista de receber novas atribuições.

---

## 3. Exportação de Dados (Portal do Motorista)
Para garantir transparência e compliance legal, o motorista pode exportar seus dados a qualquer momento.

- **Rota**: `GET /api/driver-portal/export`
- **Auth**: Sim
- **Header `x-tenant-id`**: Obrigatório.
- **Query Params**: `?format=xlsx` (Default) ou `?format=csv`.
- **Retorno**: Arquivo binário (Planilha).
- **Nota**: Acessível mesmo se status for `BLOCKED`.
