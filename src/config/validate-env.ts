const INSECURE_JWT_SECRETS = new Set(['change-me-in-production', 'me-preencha-U.U', 'dev-refresh-secret']);

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function validateJwtSecret(): void {
  if (!isProduction()) {
    return;
  }

  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || INSECURE_JWT_SECRETS.has(secret)) {
    throw new Error(
      'JWT_SECRET must be set to a secure, unique value in production (cannot be empty or a default placeholder)',
    );
  }
}

export function validateJwtRefreshSecret(): void {
  if (!isProduction()) {
    return;
  }

  const refreshSecret = process.env.JWT_REFRESH_SECRET?.trim();
  if (!refreshSecret || INSECURE_JWT_SECRETS.has(refreshSecret)) {
    throw new Error(
      'JWT_REFRESH_SECRET must be set to a secure, unique value in production (cannot be empty or a default placeholder)',
    );
  }
}

export function validateEmailProvider(): void {
  if (!isProduction()) {
    return;
  }

  const provider = process.env.EMAIL_PROVIDER?.trim() || 'console';
  if (provider === 'console') {
    return;
  }

  if (provider === 'resend') {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const from = process.env.EMAIL_FROM?.trim();
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is required in production when EMAIL_PROVIDER=resend');
    }
    if (!from) {
      throw new Error('EMAIL_FROM is required in production when EMAIL_PROVIDER=resend');
    }
    return;
  }

  if (provider === 'smtp') {
    const host = process.env.SMTP_HOST?.trim();
    if (!host) {
      throw new Error('SMTP_HOST is required in production when EMAIL_PROVIDER=smtp');
    }
  }
}

export function validateStorageProvider(): void {
  if (!isProduction()) {
    return;
  }

  const provider = process.env.STORAGE_PROVIDER?.trim() || 'local';
  if (provider !== 's3') {
    return;
  }

  const bucket = process.env.AWS_S3_BUCKET?.trim();
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();

  if (!bucket) {
    throw new Error('AWS_S3_BUCKET is required in production when STORAGE_PROVIDER=s3');
  }
  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      'AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required in production when STORAGE_PROVIDER=s3',
    );
  }
}

export function validateProductionEnv(): void {
  validateJwtSecret();
  validateJwtRefreshSecret();
  validateEmailProvider();
  validateStorageProvider();
}
