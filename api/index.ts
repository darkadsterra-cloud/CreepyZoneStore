import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Disable body parsing for multipart
    const { default: app } = await import('../artifacts/api-server/dist/app.mjs');
    return app(req as any, res as any);
  } catch (err) {
    console.error('Handler error:', err);
    res.status(500).json({ error: String(err) });
  }
}
