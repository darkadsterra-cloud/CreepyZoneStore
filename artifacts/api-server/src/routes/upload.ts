import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

const supabase = createClient(
  process.env.SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_KEY ?? ""
);

const uploadProduct = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".zip", ".rar", ".7z", ".tar", ".gz", ".mp4", ".webm", ".png", ".jpg", ".jpeg", ".gif"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

function safeFilename(original: string): string {
  return Date.now() + "-" + original.replace(/[^a-zA-Z0-9._-]/g, "_");
}

router.post("/admin/upload/product", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  uploadProduct.single("file")(req, res, async (err) => {
    if (err) { res.status(400).json({ error: err.message }); return; }
    if (!req.file) { res.status(400).json({ error: "No file provided" }); return; }

    const filename = safeFilename(req.file.originalname);
    const { error } = await supabase.storage
      .from("uploads")
      .upload(`products/${filename}`, req.file.buffer, {
        contentType: req.file.mimetype,
      });

    if (error) { res.status(500).json({ error: error.message }); return; }

    const { data } = supabase.storage.from("uploads").getPublicUrl(`products/${filename}`);
    res.json({
      filename,
      originalName: req.file.originalname,
      size: req.file.size,
      downloadUrl: data.publicUrl,
    });
  });
});

router.post("/admin/upload/image", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  uploadImage.single("file")(req, res, async (err) => {
    if (err) { res.status(400).json({ error: err.message }); return; }
    if (!req.file) { res.status(400).json({ error: "No file provided" }); return; }

    const filename = safeFilename(req.file.originalname);
    const { error } = await supabase.storage
      .from("uploads")
      .upload(`images/${filename}`, req.file.buffer, {
        contentType: req.file.mimetype,
      });

    if (error) { res.status(500).json({ error: error.message }); return; }

    const { data } = supabase.storage.from("uploads").getPublicUrl(`images/${filename}`);
    res.json({
      filename,
      originalName: req.file.originalname,
      imageUrl: data.publicUrl,
    });
  });
});

export default router;
