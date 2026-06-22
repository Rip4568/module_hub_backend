import { HttpStatus } from '@nestjs/common';

export interface PostgresDriverError {
  code?: string;
  detail?: string;
  column?: string;
  table?: string;
  constraint?: string;
  message?: string;
}

export interface MappedPostgresError {
  status: number;
  code: string;
  message: string;
}

const CONSTRAINT_LABELS: Record<string, string> = {
  category: 'categoria',
  product: 'produto',
  user: 'usuário',
  order: 'pedido',
  tenant: 'empresa',
  organization: 'organização',
  driver: 'motorista',
  vehicle: 'veículo',
  customers: 'cliente',
  document: 'documento',
  transaction: 'transação',
  role: 'papel',
  permission: 'permissão',
};

function humanizeColumn(column?: string): string {
  if (!column) return 'campo';
  return column.replace(/_/g, ' ').replace(/"/g, '');
}

function humanizeTable(table?: string): string {
  if (!table) return 'registro';
  const normalized = table.replace(/"/g, '');
  return CONSTRAINT_LABELS[normalized] ?? normalized;
}

function parseUniqueDetail(detail?: string): string | null {
  if (!detail) return null;
  const match = detail.match(/Key \(([^)]+)\)=\(([^)]+)\)/);
  if (!match) return null;

  const columns = match[1].split(',').map((c) => c.trim().replace(/"/g, ''));
  const values = match[2].split(',').map((v) => v.trim());

  if (columns.includes('slug') || columns.includes('email')) {
    const idx = columns.findIndex((c) => c === 'slug' || c === 'email');
    if (idx >= 0) return `Já existe um registro com o valor "${values[idx]}".`;
  }

  if (columns.includes('tenant_id') && columns.length === 2) {
    return 'Já existe um registro com esses dados nesta empresa.';
  }

  return null;
}

function parseForeignKeyDetail(detail?: string): string | null {
  if (!detail) return null;
  if (detail.includes('is not present in table')) {
    const tableMatch = detail.match(/table "([^"]+)"/);
    const table = humanizeTable(tableMatch?.[1]);
    return `Referência inválida: o ${table} informado não existe.`;
  }
  if (detail.includes('is still referenced from table')) {
    const tableMatch = detail.match(/table "([^"]+)"/);
    const table = humanizeTable(tableMatch?.[1]);
    return `Não é possível remover: este registro ainda está vinculado a ${table}.`;
  }
  return null;
}

/**
 * Mapeia códigos PostgreSQL (SQLSTATE) para respostas HTTP consistentes.
 * @see https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
export function mapPostgresError(driverError: PostgresDriverError): MappedPostgresError | null {
  if (!driverError?.code) return null;

  switch (driverError.code) {
    // Class 23 — Integrity Constraint Violation
    case '23505': {
      const parsed = parseUniqueDetail(driverError.detail);
      return {
        status: HttpStatus.CONFLICT,
        code: 'DUPLICATE_ENTRY',
        message:
          parsed ??
          `Já existe um ${humanizeTable(driverError.table)} com esses dados. Verifique os campos únicos.`,
      };
    }
    case '23502':
      return {
        status: HttpStatus.BAD_REQUEST,
        code: 'MISSING_FIELD',
        message: `O campo "${humanizeColumn(driverError.column)}" é obrigatório.`,
      };
    case '23503': {
      const parsed = parseForeignKeyDetail(driverError.detail);
      return {
        status: HttpStatus.BAD_REQUEST,
        code: 'INVALID_REFERENCE',
        message: parsed ?? 'Referência inválida: o registro relacionado não existe ou não pode ser removido.',
      };
    }
    case '23514':
      return {
        status: HttpStatus.BAD_REQUEST,
        code: 'CHECK_CONSTRAINT_VIOLATION',
        message: 'Os dados informados violam uma regra de validação do banco.',
      };
    case '23P01':
      return {
        status: HttpStatus.CONFLICT,
        code: 'EXCLUSION_VIOLATION',
        message: 'Conflito de exclusividade: já existe um registro com essa combinação.',
      };
    case '23000':
    case '23001':
      return {
        status: HttpStatus.BAD_REQUEST,
        code: 'INTEGRITY_VIOLATION',
        message: 'Violação de integridade dos dados.',
      };

    // Class 22 — Data Exception
    case '22001':
      return {
        status: HttpStatus.BAD_REQUEST,
        code: 'VALUE_TOO_LONG',
        message: 'Um dos valores informados excede o tamanho máximo permitido.',
      };
    case '22003':
      return {
        status: HttpStatus.BAD_REQUEST,
        code: 'NUMERIC_OUT_OF_RANGE',
        message: 'Valor numérico fora do intervalo permitido.',
      };
    case '22P02':
      return {
        status: HttpStatus.BAD_REQUEST,
        code: 'INVALID_VALUE',
        message: 'Formato de dado inválido. Verifique os campos informados.',
      };
    case '22007':
      return {
        status: HttpStatus.BAD_REQUEST,
        code: 'INVALID_DATETIME',
        message: 'Data ou hora inválida.',
      };
    case '22008':
      return {
        status: HttpStatus.BAD_REQUEST,
        code: 'DATETIME_OUT_OF_RANGE',
        message: 'Data ou hora fora do intervalo permitido.',
      };

    // Class 42 — Syntax Error or Access Rule Violation
    case '42703':
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'DATABASE_SCHEMA_MISMATCH',
        message: 'Erro de configuração do sistema. Execute as migrations ou contate o suporte.',
      };
    case '42P01':
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'DATABASE_TABLE_MISSING',
        message: 'Tabela do banco de dados não encontrada. Execute as migrations ou contate o suporte.',
      };
    case '42P07':
      return {
        status: HttpStatus.CONFLICT,
        code: 'DATABASE_OBJECT_EXISTS',
        message: 'Objeto do banco de dados já existe.',
      };

    // Class 40 — Transaction Rollback
    case '40001':
      return {
        status: HttpStatus.CONFLICT,
        code: 'SERIALIZATION_FAILURE',
        message: 'Conflito temporário. Tente novamente em alguns segundos.',
      };
    case '40P01':
      return {
        status: HttpStatus.CONFLICT,
        code: 'DEADLOCK_DETECTED',
        message: 'Operação bloqueada por outra transação. Tente novamente.',
      };

    // Class 08 — Connection Exception
    case '08000':
    case '08003':
    case '08006':
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        code: 'DATABASE_UNAVAILABLE',
        message: 'Banco de dados temporariamente indisponível. Tente novamente em instantes.',
      };

    // Class 57 — Operator Intervention
    case '57014':
      return {
        status: HttpStatus.REQUEST_TIMEOUT,
        code: 'QUERY_CANCELED',
        message: 'A operação demorou demais e foi cancelada. Tente novamente.',
      };

    // Class 53 — Insufficient Resources
    case '53300':
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        code: 'DATABASE_TOO_MANY_CONNECTIONS',
        message: 'Servidor sobrecarregado. Tente novamente em instantes.',
      };

    // Class 25 — Invalid Transaction State
    case '25P02':
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'TRANSACTION_ABORTED',
        message: 'Transação interrompida. Tente novamente.',
      };

    default:
      return null;
  }
}
