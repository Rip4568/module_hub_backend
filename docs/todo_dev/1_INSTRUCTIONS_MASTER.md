# 🤖 MASTER INSTRUCTION FILE
**Para o Agente de Implementação (Dev Back-End)**

Olá. Eu sou o Tech Lead e Product Lead deste projeto.
Preparei este conjunto de documentos para guiar sua implementação.

**Objetivo**: Transformar o ModuleHub em um ERP Multi-Tenant seguro e modular, usando TypeORM.

## 📂 Onde as coisas estão
Você DEVE ler os arquivos abaixo na ordem para entender o contexto e a tarefa.

1.  **[Decisões de Arquitetura](./4_DECISIONS.md)**
    *   *Obrigatório ler antes de codar.* Explica POR QUE mudamos para Isolamento via Subscriber e separamos o Produto.
2.  **[Passo 1: Segurança (Tenant Isolation)](./2_STEP_TENANT_ISOLATION.md)**
    *   Sua **primeira** tarefa. Implementar a segurança "Zero Trust" no banco.
3.  **[Passo 2: Refatoração de Produto](./3_STEP_INVENTORY_REFACTOR.md)**
    *   Sua **segunda** tarefa. Separar dados de Logística dos dados de E-commerce.

## 🚀 Como Proceder
1.  Comece implementando o **Passo 1**. Não pule. Sem isso, vazaremos dados.
2.  Use TDD (Test Driven Development) onde possível ou crie testes de verificação ao final.
3.  **NÃO** tente fazer todo o Roadmap de uma vez.
4.  Se tiver dúvida técnica, consulte o arquivo de Decisões. ou gere um documento na pasta docs/questions_dev e eu irei responder.

## ⚠️ Regras de Ouro
1.  **TypeORM**: Use `QueryBuilder` com cuidado. Prefira Repository methods que ativem os Subscribers.
2.  **Segurança**: Nunca confie no `tenantId` vindo do Body. Sempre pegue do Token/Contexto.
3.  **Organização**: Mantenha o padrão `src/modules/<nome>/...`.

Bom trabalho.
