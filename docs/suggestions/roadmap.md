# Roadmap e Arquitetura Futura

Este documento consolida sugestões de melhoria e desenho de arquitetura para próximas fases do projeto, focando em robustez logística e funcionalidades avançadas.

---

## 🏗️ 1. Arquitetura: Estoque Móvel (Inventory in Vehicle)

A necessidade de saber **"Quais produtos estão na Van X?"** transforma o Veículo em um **Local de Estoque**.

### Cenário
- **Van Sales / Pronta-Entrega**: O motorista sai com 50 caixas de mercadoria e vende na rota.
- **Conferência**: É preciso garantir que o que saiu do CD (Centro de Distribuição) está na Van.

### Proposta de Modelagem
Atualmente, a entidade `Product` tem um campo simples `stock` (número inteiro). Isso é stock unificado.
Para suportar múltiplos locais (CD, Loja, Veículo 1, Veículo 2), precisamos extrair o estoque para uma tabela pivô.

#### Nova Entidade: `StockLevel`
```typescript
@Entity()
export class StockLevel extends TenantAwareEntity {
  @ManyToOne(() => Product)
  product: Product;

  @ManyToOne(() => ProductVariant, { nullable: true })
  variant: ProductVariant;

  @Column()
  quantity: number;

  @Column({ type: 'enum', enum: ['WAREHOUSE', 'VEHICLE', 'STORE'] })
  locationType: string;

  // Se locationType == WAREHOUSE, usa warehouseId (futuro)
  // Se locationType == VEHICLE, usa vehicleId
  
  @Column({ nullable: true })
  vehicleId: string;

  @ManyToOne(() => Vehicle)
  vehicle: Vehicle;
}
```

### Fluxo Operacional
### Fluxo Operacional (Novo Modelo)

#### 1. Transferência de Estoque (Carregamento) 📦 -> 🚚
**Cenário**: Tirar 50 caixas de Coca do Depósito e pôr na Van.
- **Ação**: Criar `InventoryMovement` (Origem: CD, Destino: Veículo A).
- **Cálculo**:
    - `StockLevel (CD)`: 100 - 50 = **50** (Atualizado).
    - `StockLevel (Veículo A)`: 0 + 50 = **50** (Atualizado).
- *Hoje o sistema desconta do "Global", a mudança aqui é compartimentalizar.*

#### 2. Venda na Rota (Pronta-Entrega) 🚚 -> 💰
- **Ação**: Pedido criado com `vehicleId`.
- **Cálculo**: O sistema busca o `StockLevel` do Veículo e debita dele.
- Se a Van tiver 0, não vende (mesmo que o CD tenha 1000).

#### 3. Ajuste de Estoque (Perdas/Danos) ⚠️
**Cenário**: Uma caixa caiu e quebrou na Van.
- **Quem faz**: Motorista (App) ou Gestor (Painel).
- **Ação**: `POST /api/inventory/adjust`.
- **Motivo**: "Avaria/Quebra".
- **Cálculo**:
    - `StockLevel (Veículo A)`: 50 - 1 = **49**.
    - Gera registro no `InventoryLog` para auditoria.
2.  **Venda na Rota (Pronta-Entrega)**:
    - O pedido é criado com origem `vehicleId`.
    - **Automação**: O sistema varre os itens do pedido e **subtrai** automaticamente a quantidade do `StockLevel (Vehicle A)`.
    - Se acabar o estoque na Van, a venda é bloqueada (ou entra como encomenda futura).
3.  **Retorno**:
    - O que sobrou na Van é transferido de volta ou mantido para o dia seguinte.
4.  **Gestão de Frota e Transbordo**:
    - O Gestor (Painel Web) tem controle total. Ele pode:
        - Atualizar manualmente a localização do veículo (caso GPS falhe).
        - Gerenciar veículos parados/sem motorista (Manutenção ou Pátio).
        - Realizar "Transbordo": Mover estoque da Van A (quebrou) para a Van B (resgate) via sistema.

---

## 🚀 2. Funcionalidades de Logística Avançada

### A. Notificações em Tempo Real 🔔
**Problema**: O motorista precisa saber instantaneamente quando uma nova entrega cai para ele.
**Solução**:
- Implementar **Websockets (Socket.io)** no NestJS.
- Quando `OrderService.assignResources` for chamado, emitir evento `driver.new_order` para o `driverId`.
- No Frontend/App, ouvir o evento e vibrar/notificar.

### B. Geolocalização e Roteirização 🗺️
**Problema**: O endereço é apenas texto. Não permite calcular rota ótima ou mostrar mapa.
**Solução**:
- Adicionar colunas `latitude` e `longitude` no objeto `Address`.
- Criar serviço de integração com **Google Maps API** ou **Mapbox**.
- No momento do cadastro do pedido (Checkout), converter "Rua X" em "Lat/Lng".

### C. Histórico de Rastreamento (Audit Trail) ⏱️
**Problema**: Cliente quer saber detalhe passo a passo.
**Solução**:
- Criar entidade `OrderTracking`.
- Campos: `orderId`, `status`, `timestamp`, `location` (lat/lng do motorista no momento), `notes`.
- Isso permite desenhar a "cobrinha" do trajeto ou timeline detalhada.

---

## 🎯 3. Exportação e Compliance nos Dados
(Já implementado parcialmente via endpoint `/export`)
- **Sugestão**: Criar rotina agendada (Cron Job) que gera um relatório consolidado mensal e envia por email para o gestor da frota.

---

## 📝 Resumo para o Desenvolvedor Frontend
Ao implementar as telas, deixe preparado visualmente:
- **Painel de Carga**: Uma tela onde mostra o "Inventário do Veículo" (mockado por enquanto).
- **Mapa**: Um componente de mapa (pode ser estático por enquanto) na tela de detalhes do pedido.
