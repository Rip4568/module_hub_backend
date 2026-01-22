# Integration Guide: Backend to Frontend

This guide is intended for the AI agent or developer responsible for integrating the backend API with the frontend application.

## API Overview
- **Base URL**: `/api` (Check environment limits)
- **Response Format**: JSON
  ```json
  {
    "data": { ... },
    "meta": { ... } // Optional pagination/metadata
  }
  ```

## Authentication
- Most routes require a Bearer Token.
- **Header**: `Authorization: Bearer <token>`
- **Token Source**: Obtained via `/api/auth/login`.

## Integration Steps

1.  **Identify the Requirement**: Determine which feature needs backend data.
2.  **Find the Endpoint**: Check `src/modules/*/controllers/*.controller.ts` for the relevant route.
    - Look for `@Controller('path')` and `@Get()`, `@Post()`, etc.
3.  **Check the DTO**: Look at the input DTO (`*.dto.ts`) to understand the required request body/query parameters.
4.  **Handle Errors**: Implement error handling for common status codes:
    - `400`: Bad Request (Validation failure).
    - `401`: Unauthorized (Token expired/missing).
    - `403`: Forbidden (Insufficient permissions).
    - `404`: Not Found.
    - `500`: Internal Server Error.

## Common Patterns

### Fetching Lists
- **Params**: `page`, `limit` (usually).
- **Endpoint**: `GET /api/resource`

### Creating Resources
- **Body**: JSON matching the CreateDTO.
- **Endpoint**: `POST /api/resource`

### Updating Resources
- **Body**: JSON matching the UpdateDTO.
- **Endpoint**: `PATCH /api/resource/:id`

## Tips
- Verify types using the backend entities and DTOs.
- TypeScript interfaces in the frontend should mirror the backend DTOs.
