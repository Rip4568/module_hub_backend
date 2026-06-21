import * as fs from 'fs';
import * as path from 'path';

const TEST_ENV_PATH = path.join(__dirname, 'test-env.json');

export class TestHelper {
  static saveEnv<T = any>(key: string, value: T) {
    let env: Record<string, any> = {};
    if (fs.existsSync(TEST_ENV_PATH)) {
      env = JSON.parse(fs.readFileSync(TEST_ENV_PATH, 'utf8'));
    }
    env[key] = value;
    fs.writeFileSync(TEST_ENV_PATH, JSON.stringify(env, null, 2));
  }

  static getEnv<T = any>(key: string): T {
    if (!fs.existsSync(TEST_ENV_PATH)) {
      return null as any;
    }
    const env: Record<string, any> = JSON.parse(fs.readFileSync(TEST_ENV_PATH, 'utf8'));
    return env[key] as T;
  }
}
