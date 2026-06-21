import { sanitizeFilename } from './sanitize-filename.util';

describe('sanitizeFilename', () => {
  it('keeps safe alphanumeric filenames intact', () => {
    expect(sanitizeFilename('invoice-2024.pdf')).toBe('invoice-2024.pdf');
  });

  it('strips directory traversal attempts', () => {
    expect(sanitizeFilename('../../etc/passwd')).toBe('passwd');
    expect(sanitizeFilename('..\\..\\secret.txt')).toBe('secret.txt');
  });

  it('replaces unsafe characters with underscores', () => {
    expect(sanitizeFilename('my file (1).png')).toBe('my_file__1_.png');
    expect(sanitizeFilename('relatório@#$%.csv')).toBe('relat_rio____.csv');
  });

  it('removes leading dots to avoid hidden files', () => {
    expect(sanitizeFilename('...hidden')).toBe('hidden');
  });

  it('returns fallback name for empty input', () => {
    expect(sanitizeFilename('')).toBe('file');
    expect(sanitizeFilename('...')).toBe('file');
  });

  it('sanitizes all-special-character names to underscores', () => {
    expect(sanitizeFilename('@@@')).toBe('___');
  });
});
