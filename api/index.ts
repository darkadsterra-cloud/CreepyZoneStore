import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Re-export as Vercel handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { default: mainApp } = await import('../artifacts/api-server/src/app');
  return mainApp(req as any, res as any);
}
