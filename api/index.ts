import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import path from 'path';

let appInstance: express.Express | null = null;

async function getApp() {
  if (appInstance) return appInstance;
  
  // Dynamically import all routes
  const { default: app } = await import('../artifacts/api-server/src/app.js');
  appInstance = app;
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await getApp();
    return app(req as any, res as any);
  } catch (err) {
    console.error('Handler error:', err);
    res.status(500).json({ error: String(err) });
  }
}
