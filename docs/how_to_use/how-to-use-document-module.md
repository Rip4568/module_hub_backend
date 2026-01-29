# Guia: Módulo de Documentos

Este módulo gerencia o upload e armazenamento de arquivos ( comprovantes, CNH, contratos).

## Pré-requisitos
- **Autenticação**: Bearer Token.

---

## 1. Upload de Arquivos (`/api/documents/upload`)

### Enviar Arquivo
- **POST** `/api/documents/upload`
- **Body**: `FormData` (multipart/form-data)
    - `file`: (Binário do arquivo)
- **Retorno (201 Created)**:
  ```json
  {
    "url": "https://s3.amazonaws.com/bucket/file-uuid.pdf",
    "filename": "meu-comprovante.pdf",
    "mimetype": "application/pdf"
  }
  ```

## 2. Metadados de Documentos (`/api/documents`)
- **POST** `/api/documents`
- **Body**: Cria um registro de documento no banco (não necessariamente o upload, mas os metadados).
- **Nota**: Geralmente o fluxo é: Upload -> Recebe URL -> Cria registro na entidade de negócio (ex: Motorista.cnhUrl = URL).
- **Body (Exemplo)**:
  ```json
  {
    "title": "CNH Motorista",
    "url": "https://s3...",
    "entityId": "driver-uuid",
    "entityType": "DRIVER"
  }
  ```
