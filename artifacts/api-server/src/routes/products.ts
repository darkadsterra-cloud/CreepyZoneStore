import { Router, type IRouter } from "express";
import { db, productsTable, orderItemsTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";
import {
  CreateProductBody,
  ListProductsQueryParams,
  GetProductParams,
  UpdateProductParams,
  UpdateProductBody,
  DeleteProductParams,
} from "@workspace/api-zod";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

function formatProduct(p: any) {
  return {
    ...p,
    price: parseFloat(p.price),
    previewVideoUrl: p.previewVideoUrl ?? null,
  };
}

router.get("/products", async (req, res): Promise<void> => {
  const params = ListProductsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  let query = db.select().from(productsTable).$dynamic();

  if (params.data.category) {
    query = query.where(eq(productsTable.category, params.data.category as any));
  }
  if (params.data.featured !== undefined) {
    query = query.where(eq(productsTable.featured, params.data.featured));
  }

  const all = await query.orderBy(desc(productsTable.createdAt));
  const total = all.length;
  const offset = params.data.offset ?? 0;
  const limit = params.data.limit ?? 20;
  const products = all.slice(offset, offset + limit).map(formatProduct);

  res.json({ products, total });
});

router.post("/products", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db.insert(productsTable).values({
    ...parsed.data,
    price: String(parsed.data.price),
    previewVideoUrl: parsed.data.previewVideoUrl ?? null,
  }).returning();

  res.status(201).json(formatProduct(product));
});

router.get("/products/featured", async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable)
    .where(eq(productsTable.featured, true))
    .orderBy(desc(productsTable.createdAt))
    .limit(8);

  res.json({ products: products.map(formatProduct) });
});

router.get("/products/categories", async (_req, res): Promise<void> => {
  const allProducts = await db.select().from(productsTable);
  const allOrderItems = await db.select().from(orderItemsTable);

  const categoryMap: Record<string, { count: number; totalRevenue: number }> = {};

  for (const p of allProducts) {
    if (!categoryMap[p.category]) {
      categoryMap[p.category] = { count: 0, totalRevenue: 0 };
    }
    categoryMap[p.category].count++;
  }

  for (const oi of allOrderItems) {
    const product = allProducts.find(p => p.id === oi.productId);
    if (product && categoryMap[product.category]) {
      categoryMap[product.category].totalRevenue += parseFloat(oi.priceAtPurchase);
    }
  }

  const categories = Object.entries(categoryMap).map(([category, data]) => ({
    category,
    count: data.count,
    totalRevenue: data.totalRevenue,
  }));

  res.json({ categories });
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, params.data.id));
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(formatProduct(product));
});

router.put("/products/:id", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db.update(productsTable)
    .set({ ...parsed.data, price: String(parsed.data.price) })
    .where(eq(productsTable.id, params.data.id))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(formatProduct(product));
});

router.delete("/products/:id", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(productsTable).where(eq(productsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
