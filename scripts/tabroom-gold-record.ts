import { readFile } from 'node:fs/promises';
import { TabroomSessionError } from '../src/tabroom/authenticated-session.ts';
import { validateGoldRecord } from '../src/tabroom/gold-record.ts';

try {
  const sample: unknown = JSON.parse(await readFile(process.argv[2], 'utf8'));
  const matrix = await validateGoldRecord(sample, {
    async getCredentials() {
      const username = process.env.DEBATEOS_TABROOM_USERNAME ?? '';
      const password = process.env.DEBATEOS_TABROOM_PASSWORD ?? '';
      delete process.env.DEBATEOS_TABROOM_USERNAME;
      delete process.env.DEBATEOS_TABROOM_PASSWORD;
      return { username, password };
    },
  });
  process.stdout.write(JSON.stringify(matrix, null, 2) + '\n');
} catch (error) {
  process.stderr.write(error instanceof TabroomSessionError ? error.message + '\n' :
    'Gold-record validation failed. Check the local sample and account identity.\n');
  process.exitCode = 1;
}
