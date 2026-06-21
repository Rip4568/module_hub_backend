import {
  validateJwtSecret,
  validateJwtRefreshSecret,
  validateEmailProvider,
  validateStorageProvider,
} from './validate-env';

describe('validateJwtSecret', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('does not throw in non-production environments', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.JWT_SECRET;
    expect(() => validateJwtSecret()).not.toThrow();
  });

  it('throws in production when JWT_SECRET is missing', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    expect(() => validateJwtSecret()).toThrow(/JWT_SECRET/);
  });

  it('throws in production when JWT_SECRET is a default placeholder', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'change-me-in-production';
    expect(() => validateJwtSecret()).toThrow(/JWT_SECRET/);
  });

  it('does not throw in production with a secure secret', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'a-very-secure-random-production-secret-value';
    expect(() => validateJwtSecret()).not.toThrow();
  });
});

describe('validateJwtRefreshSecret', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('does not throw in non-production environments', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.JWT_REFRESH_SECRET;
    expect(() => validateJwtRefreshSecret()).not.toThrow();
  });

  it('throws in production when JWT_REFRESH_SECRET is missing', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_REFRESH_SECRET;
    expect(() => validateJwtRefreshSecret()).toThrow(/JWT_REFRESH_SECRET/);
  });

  it('throws in production when JWT_REFRESH_SECRET is a default placeholder', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_REFRESH_SECRET = 'dev-refresh-secret';
    expect(() => validateJwtRefreshSecret()).toThrow(/JWT_REFRESH_SECRET/);
  });

  it('does not throw in production with a secure refresh secret', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_REFRESH_SECRET = 'a-very-secure-random-refresh-secret-value';
    expect(() => validateJwtRefreshSecret()).not.toThrow();
  });
});

describe('validateEmailProvider', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('does not throw in non-production when resend is unconfigured', () => {
    process.env.NODE_ENV = 'development';
    process.env.EMAIL_PROVIDER = 'resend';
    delete process.env.RESEND_API_KEY;
    expect(() => validateEmailProvider()).not.toThrow();
  });

  it('throws in production when EMAIL_PROVIDER=resend without API key', () => {
    process.env.NODE_ENV = 'production';
    process.env.EMAIL_PROVIDER = 'resend';
    delete process.env.RESEND_API_KEY;
    process.env.EMAIL_FROM = 'noreply@example.com';
    expect(() => validateEmailProvider()).toThrow(/RESEND_API_KEY/);
  });

  it('does not throw in production when EMAIL_PROVIDER=console', () => {
    process.env.NODE_ENV = 'production';
    process.env.EMAIL_PROVIDER = 'console';
    expect(() => validateEmailProvider()).not.toThrow();
  });
});

describe('validateStorageProvider', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('throws in production when STORAGE_PROVIDER=s3 without credentials', () => {
    process.env.NODE_ENV = 'production';
    process.env.STORAGE_PROVIDER = 's3';
    delete process.env.AWS_S3_BUCKET;
    expect(() => validateStorageProvider()).toThrow(/AWS_S3_BUCKET/);
  });

  it('does not throw in production when STORAGE_PROVIDER=local', () => {
    process.env.NODE_ENV = 'production';
    process.env.STORAGE_PROVIDER = 'local';
    expect(() => validateStorageProvider()).not.toThrow();
  });
});
