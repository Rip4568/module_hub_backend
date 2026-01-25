# ModuleHub Developer Cheat Sheet

Aqui estão os comandos e truques rápidos para operar o backend.

## 🛠️ Banco de Dados e Migrations

### 1. Preparar o Ambiente pela 1ª vez
Rode o docker para subir o Banco e o Redis:
```bash
docker-compose up -d
```

### 2. Gerar uma Migration
Sempre que alterar uma entidade, gere uma migração:
```bash
# Exemplo: create_delivery_table
npm run typeorm:generate-migration --name=NomeDaMudanca
```

### 3. Rodar as Migrations (Aplicar no Banco)
```bash
npm run typeorm:run-migration
```

### 4. Reverter a última Migration (Oops!)
```bash
npm run typeorm:revert-migration
```

---

## 🧩 Módulos e Configurações

### Como funciona o "Limite de 5 Módulos"?
Isso agora está codado ("hardcoded") no `TenantModuleService` para simplicidade e segurança.
- **Módulos Essenciais (Gratuitos/Bloqueados)**: `['tenant', 'auth', 'user', 'role', 'permission', 'tenant-module']`
- **Max Modulos**: 5 (Módulos de negócio além dos essenciais).

### Como alterar isso?
Edite o arquivo:
`src/modules/tenant-module/tenant-module.service.ts`

Procure por:
```typescript
private readonly ESSENTIAL_MODULES = [...];
private readonly MAX_MODULES_PER_PLAN = 5;
```

---

## 🚀 Rodando o Projeto
```bash
# Modo Desenvolvimento (com hot-reload)
npm run start:dev

# Modo Produção
npm run build
npm run start:prod
```
