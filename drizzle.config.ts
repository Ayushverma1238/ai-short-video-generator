import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './src/configs/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: 'postgresql://neondb_owner:npg_kYt3arD2SviZ@ep-twilight-term-b43m87fx.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  },
});
