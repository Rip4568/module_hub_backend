# Passo 1: "Pure Fleet" (Delivery Refactor)

**Prioridade**: CRÍTICA (Business Blocker)
**Objetivo**: Permitir entregas sem Pedido de Venda associado.

## O Problema
Hoje `Delivery` tem `orderId` (Unique + Not Null). Isso impede uma transportadora de usar o sistema apenas para gerir viagens de sua frota se não houver um "Pedido" no sistema.

## A Solução: Delivery Generics

### 1. Schema Changes
- [ ] Alterar tabela `delivery`:
    - `orderId`: Remover Unique Constraint, tornar Nullable.
    - `type`: Adicionar coluna Enum (`STANDARD`, `SERVICE`, `INTERNAL_TRANSFER`).
    - `description`: Adicionar campo texto para descrever a carga (se não houver pedido).

### 2. Service Layer (`DeliveryService`)
- [ ] `createIndependent(dto)`: Novo método para criar entregas avulsas.
    - Input: Endereços, Veículo, Motorista, Descrição.
    - Não gera transação financeira automática (pois não tem venda).
- [ ] Adaptação do `create()` atual:
    - Continuar aceitando `orderId` para o fluxo de E-commerce.

### 3. Impacto no Frontend (Futuro)
Isso permitirá uma tela de "Nova Entrega Rápida" onde o despachante só digita "Retirar pacote no Centro e levar para Filial X".

## Critérios de Aceite
1.  Consigo criar uma Entrega via API passando apenas `driverId`, `vehicleId` e endereços (sem `orderId`).
2.  O fluxo antigo (Despachar Pedido) continua criando a Entrega vinculada corretamente.
