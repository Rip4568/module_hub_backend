# Guia de Uso do Backend (Frontend Integration)

Este documento contém as instruções para integração com as rotas principais do Backend, com foco em Autenticação, Registro, Contexto Global e Portal do Motorista.

**PREFIXO GLOBAL DA API**: `/api` (Todas as rotas abaixo devem ser prefixadas com `/api`)

## 1. Autenticação e Contexto

O sistema utiliza JWT e Headers para controle de acesso e contexto (Multi-tenancy).

### Headers Principais
- `Authorization`: `Bearer <TOKEN>` (Para rotas protegidas)
- `x-tenant-id`: ID da empresa (Tenant) onde a operação está sendo feita.
    - **Obrigatório** para rotas que dependem de contexto (ex: criar pedido, ver veículos, pegar meu perfil naquela empresa).
    - **Opcional** para rotas globais (ex: listar minhas empresas).

### Login
- **Rota**: `POST /api/auth/login`
- **Body**: 
  ```json
  {
    "email": "motorista@exemplo.com", 
    "password": "senha_segura", 
    "tenantId": "UUID_DA_CONFIRMACAO" // (Opcional) Serve para validar se o usuário tem acesso a este tenant específico logo no login.
  }
  ```
- **Retorno (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsIn...", // JWT Token para usar no header Authorization
    "user": { 
        "id": "user-uuid...", 
        "email": "motorista@exemplo.com", 
        "name": "João da Silva" 
    },
    "activeModules": [ "fleet_management", "driver_portal" ] // Lista de módulos que a empresa (tenantId) possui ativos
  }
  ```
- **Explicação sobre Login Multi-Tenant**: Um mesmo email pode estar cadastrado em várias empresas. Se você não enviar o `tenantId` no login, o backend autenticará no primeiro vínculo encontrado.
- **Fluxo Recomendado**:
  1. Login inicial (sem tenantId, ou com um salvo).
  2. Frontend chama `GET /api/driver-portal/my-tenants` para ver todas as empresas do usuário.
  3. Usuário seleciona a empresa -> Frontend armazena o `id` da empresa selecionada.
  4. Nas próximas requisições, Frontend envia header `x-tenant-id: <ID_SELECIONADO>`.

---

## 2. Registro (Sign Up)

### Registro de Empresa (Novo Cliente SaaS)
- **Rota**: `POST /api/auth/register`
- **Público**: Sim.
- **Uso**: Quando um dono de transportadora quer contratar o sistema.
- **Body**:
  ```json
  {
    "email": "admin@transportadora.com",
    "password": "senha_forte",
    "name": "Carlos Dono",
    "tenantName": "Transportadora Rápida" // Cria essa empresa no sistema
  }
  ```
- **Retorno (201 Created)**: Objeto `user` criado.

### Registro de Motorista (Self-Service)
- **Rota**: `POST /api/auth/register/driver`
- **Público**: Sim.
- **Uso**: Quando um motorista baixa o app e quer se cadastrar para trabalhar em alguma empresa que já usa o sistema.
- **Body**:
  ```json
  {
    "email": "motorista@gmail.com",
    "password": "minha_senha",
    "name": "Pedro Piloto",
    "tenantId": "UUID_DA_EMPRESA_ALVO" // Obrigatório: ID da empresa onde ele quer trabalhar
  }
  ```
- **Retorno (201 Created)**: Objeto `user`. O perfil de motorista é criado com status `PENDING`.

---

## 3. Portal do Motorista (App Mobile)

Rotas específicas para o dia a dia do motorista.

### Listar Minhas Empresas
- **Rota**: `GET /api/driver-portal/my-tenants`
- **Auth**: Sim (Bearer Token)
- **Header `x-tenant-id`**: Não necessário.
- **Uso**: Tela de "Seleção de Empresa" (Switch Context). Mostra onde ele trabalha e o status em cada uma.
- **Retorno (200 OK)**:
  ```json
  [
    {
        "id": "tenant-uuid-1",
        "name": "Transportadora A",
        "slug": "transportadora-a"
    },
    {
        "id": "tenant-uuid-2",
        "name": "Logística B",
        "slug": "logistica-b"
    }
  ]
  ```

### Obter Perfil e Veículos
- **Rota**: `GET /api/driver-portal/me`
- **Auth**: Sim
- **Header `x-tenant-id`**: **OBRIGATÓRIO** (Define de qual empresa estamos puxando os dados).
- **Retorno (200 OK)**:
  ```json
  {
    "id": "driver-profile-uuid", // ID do PERFIL de motorista nesta empresa
    "status": "ACTIVE", // ou PENDING, BLOCKED
    "cnhNumber": "12345678900",
    "vehicles": [ 
        { 
            "id": "vehicle-uuid", 
            "plate": "ABC-1234", 
            "model": "Honda CG 160" 
        } 
    ]
  }
  ```

---

## 4. Dicas de Integração Frontend

1.  **Prefixo API**: Configure a base URL do axios/fetch para incluir `/api`.
2.  **Erro 403 Forbidden**: Geralmente falta o `x-tenant-id`. O backend usa esse header para saber "em nome de qual empresa" você está agindo.
3.  **Roles/Enums**:
    - Motorista nasce com Role implícita e status `PENDING`.
    - Gestor deve aprovar no painel administrativo -> Status vira `ACTIVE`.

---

## 5. Guias Específicos por Módulo

Para detalhes sobre como consumir cada módulo de negócio (DTOs, regras, filtros), consulte os guias dedicados:
- [Módulo Fleet - Veículos](./fleet_management/vehicles.md)
- [Módulo Fleet - Motoristas](./fleet_management/drivers.md)
- [Módulo Ecommerce (Pedidos, Produtos)](./how-to-use-ecommerce-module.md)
- [Módulo Documentos](./how-to-use-document-module.md)
- [Módulo Financeiro](./how-to-use-financial-module.md)
