import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/warehouse/schema.ts',
  out: './drizzle',
});
