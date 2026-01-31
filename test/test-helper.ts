import * as fs from 'fs';
import * as path from 'path';

const TEST_ENV_PATH = path.join(__dirname, 'test-env.json');

export class TestHelper {
    static saveEnv(key: string, value: any) {
        let env: Record<string, any> = {};
        if (fs.existsSync(TEST_ENV_PATH)) {
            env = JSON.parse(fs.readFileSync(TEST_ENV_PATH, 'utf8'));
        }
        env[key] = value;
        fs.writeFileSync(TEST_ENV_PATH, JSON.stringify(env, null, 2));
    }

    static getEnv(key: string) {
        if (!fs.existsSync(TEST_ENV_PATH)) {
            return null;
        }
        const env: Record<string, any> = JSON.parse(fs.readFileSync(TEST_ENV_PATH, 'utf8'));
        return env[key];
    }
}
