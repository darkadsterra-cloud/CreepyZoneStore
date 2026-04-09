import { Router, type IRouter } from "express";

import path from "path";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

const supabase = createClient(
  process.env.SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_KEY ?? ""
);

function safeFilename(original: string): string {
  return Date.now() + "-" + original.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function parseMultipart(req: any): Promise<{ buffer: Buffer; filename: string; mimetype: string }> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const contentType = req.headers["content-type"] || "";
    const boundary = contentType.split("boundary=")[1];
    if (!boundary) return reject(new Error("No boundary found"));
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      const body = Buffer.concat(chunks);
      const boundaryBuffer = Buffer.from("--" + boundary);
      const parts: Buffer[] = [];
      let start = 0;
      for (let i = 0; i < body.length; i++) {
        if (body.slice(i, i + boundaryBuffer.length).equals(boundaryBuffer)) {
          if (start > 0) parts.push(body.slice(start, i - 2));
          start = i + boundaryBuffer.length + 2;
        }
      }
      const part = parts[0];
      if (!part) return reject(new Error("No file part"));
      const headerEnd = part.indexOf("\r\n\r\n");
      const header = part.slice(0, headerEnd).toString();
      const fileBuffer = part.slice(headerEnd + 4);
      const nameMatch = header.match(/filename="([^"]+)"/);
      const typeMatch = header.match(/Content-Type: ([^\r\n]+)/);
      resolve({
        buffer: fileBuffer,
        filename: nameMatch?.[1] ?? "file",
        mimetype: typeMatch?.[1] ?? "application/octet-stream",
      });
    });
    req.on("error", reject);
  });
}

router.post("/admin/upload/product", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  try {
    const { buffer, filename, mimetype } = await parseMultipart(req);
    const safeFile = safeFilename(filename);
    const { error } = await supabase.storage
      .from("uploads")
      .upload(`products/${safeFile}`, buffer, { contentType: mimetype });
    if (error) { res.status(500).json({ error: error.message }); return; }
    const { data } = supabase.storage.from("uploads").getPublicUrl(`products/${safeFile}`);
    res.json({ filename: safeFile, originalName: filename, size: buffer.length, downloadUrl: data.publicUrl });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/admin/upload/image", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  try {
    const { buffer, filename, mimetype } = await parseMultipart(req);
    const safeFile = safeFilename(filename);
    const { error } = await supabase.storage
      .from("uploads")
      .upload(`images/${safeFile}`, buffer, { contentType: mimetype });
    if (error) { res.status(500).json({ error: error.message }); return; }
    const { data } = supabase.storage.from("uploads").getPublicUrl(`images/${safeFile}`);
    res.json({ filename: safeFile, originalName: filename, imageUrl: data.publicUrl });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
