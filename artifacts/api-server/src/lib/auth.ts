import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { Request } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.SESSION_SECRET || "creepyzone-secret-key-2024";

function base64url(input: Buffer | string): string {
  const str = typeof input === "string" ? Buffer.from(input) : input;
  return str.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function createToken(userId: number, role: string): string {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({ sub: userId, role, iat: Math.floor(Date.now() / 1000) }));
  const sig = base64url(
    createHmac("sha256", JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest()
  );
  return `${header}.${payload}.${sig}`;
}

export function verifyToken(token: string): { sub: number; role: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, sig] = parts;
    const expectedSig = base64url(
      createHmac("sha256", JWT_SECRET)
        .update(`${header}.${payload}`)
        .digest()
    );
    const sigBuf = Buffer.from(sig, "base64");
    const expectedBuf = Buffer.from(expectedSig, "base64");
    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) return null;
    const decoded = JSON.parse(Buffer.from(payload, "base64").toString());
    return { sub: decoded.sub, role: decoded.role };
  } catch {
    return null;
  }
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = createHmac("sha256", salt).update(password).digest("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const expected = createHmac("sha256", salt).update(password).digest("hex");
  const hashBuf = Buffer.from(hash, "hex");
  const expectedBuf = Buffer.from(expected, "hex");
  if (hashBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(hashBuf, expectedBuf);
}

export async function getUserFromRequest(req: Request): Promise<{ id: number; role: string } | null> {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const payload = verifyToken(token);
  if (!payload) return null;
  return { id: payload.sub, role: payload.role };
}

export async function requireAuth(req: Request, res: any): Promise<{ id: number; role: string } | null> {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return user;
}

export async function requireAdmin(req: Request, res: any): Promise<{ id: number; role: string } | null> {
  const user = await requireAuth(req, res);
  if (!user) return null;
  if (user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }
  return user;
}
