import { normalizePagination, PAGINATION_MAX_LIMIT } from './pagination.util';

describe('normalizePagination', () => {
  it('defaults page to 1 and limit to 20', () => {
    expect(normalizePagination()).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it('caps limit at maxLimit', () => {
    expect(normalizePagination(1, 500).limit).toBe(PAGINATION_MAX_LIMIT);
  });

  it('computes skip from page and limit', () => {
    expect(normalizePagination(3, 10)).toEqual({ page: 3, limit: 10, skip: 20 });
  });
});
