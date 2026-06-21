const INSECURE_JWT_SECRETS = new Set(['change-me-in-production', 'me-preencha-U.U']);

export function validateJwtSecret(): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || INSECURE_JWT_SECRETS.has(secret)) {
    throw new Error(
      'JWT_SECRET must be set to a secure, unique value in production (cannot be empty or a default placeholder)',
    );
  }
}
