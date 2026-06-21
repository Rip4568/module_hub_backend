import { validateJwtSecret } from './validate-env';

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
