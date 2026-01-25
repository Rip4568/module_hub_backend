# Passo 2: Frota Avançada e Documentos

**Prioridade**: MÉDIA
**Foco**: Operacional

## Contexto
O motorista precisa enviar sua localização e precisamos anexar notas fiscais às entregas.

## Requisitos Técnicos

### 1. Delivery Documents
Precisamos armazenar links para arquivos (S3/MinIO) vinculados à entrega (Canhoto assinado, Nota Fiscal, Foto da Ocorrência).
- [ ] Criar entidade `DeliveryDocument`.
    - `id`, `deliveryId`, `type` (INVOICE, PROOF, OTHERS), `url`, `createdAt`.
- [ ] Controller: Upload de arquivos (pode mockar o upload retornando uma URL fake por enquanto se não tiver S3 configurado, ou salvar em disco local `uploads/`).

### 2. Real-time Tracking (Soft)
Não faremos WebSocket full agora. Faremos "Polling eficiente".
- [ ] `PATCH /delivery/:id/location`
    - Recebe: `lat`, `lng`, `batteryLevel`, `timestamp`.
    - Salva no `Delivery` (campos atuais) E cria registro no `DeliveryTrackingLog` (nova tabela para histórico).
- [ ] `DeliveryTrackingLog`:
    - Tabela Time-Series (append only) para desenhar a rota no mapa depois.

### 3. Regras de Negócio
- [ ] Um motorista só pode atualizar entregas que estão `IN_ROUTE` e atribuídas a ele.
- [ ] Ao enviar o primeiro ponto de localização, mudar status para `IN_ROUTE` se estiver `PENDING`.

## Critérios de Aceite
1.  Histórico de posições fica salvo no banco (não apenas a última posição).
2.  Upload de "Foto do Canhoto" cria um registro em `DeliveryDocument`.
