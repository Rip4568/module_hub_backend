import * as bcrypt from 'bcrypt';

export class HashUtils {
    private static readonly SALT_ROUNDS = 10;

    /**
     * Generates a hash for the given plain text string.
     * @param plainText The string to hash.
     * @returns The hashed string.
     */
    static async hash(plainText: string): Promise<string> {
        return bcrypt.hash(plainText, this.SALT_ROUNDS);
    }

    /**
     * Compares a plain text string with a hash.
     * @param plainText The plain text string.
     * @param hash The hash to compare against.
     * @returns True if they match, false otherwise.
     */
    static async compare(plainText: string, hash: string): Promise<boolean> {
        return bcrypt.compare(plainText, hash);
    }
}
