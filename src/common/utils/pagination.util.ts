export const PAGINATION_MAX_LIMIT = 100;

export interface NormalizedPagination {
  page: number;
  limit: number;
  skip: number;
}

export function normalizePagination(
  page?: number | string,
  limit?: number | string,
  maxLimit = PAGINATION_MAX_LIMIT,
): NormalizedPagination {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(maxLimit, Math.max(1, Number(limit) || 20));

  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
}
