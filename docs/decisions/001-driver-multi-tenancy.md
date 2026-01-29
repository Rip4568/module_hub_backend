# ADR-001: Arquitetura Multi-Tenant para Motoristas e Portais de Usuário

## Status
Proposto

## Contexto
O sistema atual trata o `Driver` como uma entidade estritamente vinculada a um `Tenant` (1:1 no contexto de criação). No entanto, o cenário de negócio exige que:
1.  Um mesmo Motorista (CPF/Pessoa Física) possa prestar serviço para múltiplas empresas (Tenants).
2.  O Motorista tenha uma visão consolidada de seus ganhos e histórico.
3.  O Motorista precisa de uma interface ("Portal") simplificada para operações diárias (login, aceitar corridas, ver ganhos), diferente do dashboard administrativo.

## Decisão

### 1. Modelo de Dados do Motorista (Multi-Tenant)
O `User` será a entidade central global (identificada por Email/CPF).
O `Driver` continuará existindo dentro de cada Tenant para armazenar dados específicos daquele contrato (data de admissão, status na empresa, veículo atual NAQUELA empresa).

Haverá um fluxo de **Convite (Invite)**:
- Empresa A convida Motorista (email X).
- Se email X já existe, o usuário recebe uma notificação.
- Ao aceitar, um registro `Driver` é criado no schema da Empresa A, vinculado ao `userId` existente.

### 2. Portais de Usuário (User Portals)
Serão criadas interfaces/rotas específicas para perfis operacionais, segregadas da gestão administrativa.
- **Rota**: `/portal/driver/*` (exemplo) ou separação via Role no frontend.
- **Objetivo**: "Self-service". O usuário atua sobre seus próprios dados ou sobre recursos alocados a ele (Veículo).

### 3. Login e Contexto
O login continua único. Ao logar, se o usuário pertencer a múltiplos tenants (como motorista), ele poderá:
- Selecionar em qual contexto (Empresa) deseja operar no momento (check-in).
- Ou ter uma visão "Dashboard Global" (futuro) que agrega dados.
- Para operações de veículo, ele DEVE selecionar um contexto ativo.

## Consequências
- **Positivas**: Flexibilidade de mercado (freelancers), reuso de cadastro, segurança (login único).
- **Negativas**: Aumenta complexidade na validação de dados (um motorista bloqueado na Empresa A não necessariamente está bloqueado na B, mas o CPF é o mesmo). Precisaremos cuidar do isolamento de dados sensíveis entre empresas.
