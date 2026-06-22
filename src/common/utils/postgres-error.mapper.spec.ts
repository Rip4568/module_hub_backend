import { HttpStatus } from '@nestjs/common';
import { mapPostgresError } from './postgres-error.mapper';

describe('mapPostgresError', () => {
  it('maps unique violation (23505) with slug detail', () => {
    const result = mapPostgresError({
      code: '23505',
      table: 'category',
      detail: 'Key (tenant_id, slug)=(abc, eletronicos) already exists.',
    });

    expect(result).toEqual({
      status: HttpStatus.CONFLICT,
      code: 'DUPLICATE_ENTRY',
      message: 'Já existe um registro com o valor "eletronicos".',
    });
  });

  it('maps not null violation (23502)', () => {
    const result = mapPostgresError({
      code: '23502',
      column: 'slug',
    });

    expect(result?.code).toBe('MISSING_FIELD');
    expect(result?.message).toContain('slug');
  });

  it('maps foreign key violation on missing reference (23503)', () => {
    const result = mapPostgresError({
      code: '23503',
      detail: 'Key (categoryId)=(uuid) is not present in table "category".',
    });

    expect(result?.code).toBe('INVALID_REFERENCE');
    expect(result?.message).toContain('categoria');
  });

  it('maps foreign key violation on delete (23503)', () => {
    const result = mapPostgresError({
      code: '23503',
      detail: 'Key (id)=(uuid) is still referenced from table "product_category".',
    });

    expect(result?.code).toBe('INVALID_REFERENCE');
    expect(result?.message).toContain('vinculado');
  });

  it('maps undefined column (42703) as schema mismatch', () => {
    const result = mapPostgresError({
      code: '42703',
      message: 'column Category.type does not exist',
    });

    expect(result?.code).toBe('DATABASE_SCHEMA_MISMATCH');
    expect(result?.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
  });

  it('maps deadlock (40P01)', () => {
    const result = mapPostgresError({ code: '40P01' });
    expect(result?.code).toBe('DEADLOCK_DETECTED');
    expect(result?.status).toBe(HttpStatus.CONFLICT);
  });

  it('returns null for unknown codes', () => {
    expect(mapPostgresError({ code: '99999' })).toBeNull();
  });
});
