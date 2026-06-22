import * as path from 'path';

/**
 * Sanitizes a filename to prevent path traversal and unsafe characters.
 */
export function sanitizeFilename(filename: string): string {
  const basename = path.basename(filename);
  const sanitized = basename.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^\.+/, '');
  return sanitized || 'file';
}
