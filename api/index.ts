import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { default: app } = await import('../artifacts/api-server/dist/app');
  return app(req as any, res as any);
}
