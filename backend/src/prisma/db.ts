import 'dotenv/config';
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.d';
import contractJson from './contract.json' with { type: 'json' };

export const db = postgres<Contract>({
  contractJson,
  url: process.env['postgresql://neondb_owner:npg_CBflYq6vWOQ5@ep-noisy-voice-b38otyh3.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require']!,
});
