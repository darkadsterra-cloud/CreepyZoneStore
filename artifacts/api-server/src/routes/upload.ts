import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");
const PRODUCTS_DIR = path.join(UPLOADS_DIR, "products");
const IMAGES_DIR = path.join(UPLOADS_DIR, "images");

fs.mkdirSync(PRODUCTS_DIR, { recursive: true });
fs.mkdirSync(IMAGES_DIR, { recursive: true });

function safeFilename(original: string): string {
  return Date.now() + "-" + original.replace(/[^a-zA-Z0-9._-]/g, "_");
}

const productStorage = multer.diskStorage({
  destination: PRODUCTS_DIR,
  filename: (_req, file, cb) => cb(null, safeFilename(file.originalname)),
});

const imageStorage = multer.diskStorage({
  destination: IMAGES_DIR,
  filename: (_req, file, cb) => cb(null, safeFilename(file.originalname)),
});

const uploadProduct = multer({
  storage: productStorage,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".zip", ".rar", ".7z", ".tar", ".gz", ".mp4", ".webm", ".png", ".jpg", ".jpeg", ".gif"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

router.post("/admin/upload/product", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  uploadProduct.single("file")(req, res, (err) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "No file provided" });
      return;
    }
    res.json({
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      downloadUrl: `/api/uploads/products/${req.file.filename}`,
    });
  });
});

router.post("/admin/upload/image", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  uploadImage.single("file")(req, res, (err) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "No file provided" });
      return;
    }
    res.json({
      filename: req.file.filename,
      originalName: req.file.originalname,
      imageUrl: `/api/uploads/images/${req.file.filename}`,
    });
  });
});

export default router;
