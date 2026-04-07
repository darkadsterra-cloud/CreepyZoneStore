import { Router, type IRouter } from "express";
import { db, cartItemsTable, productsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { AddToCartBody, RemoveFromCartParams } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

async function getCartWithProducts(userId: number) {
  const items = await db.select().from(cartItemsTable).where(eq(cartItemsTable.userId, userId));
  const productIds = items.map(i => i.productId);
  const products = productIds.length > 0
    ? await db.select().from(productsTable).where(
        eq(productsTable.id, items[0]?.productId ?? 0)
      ).then(async () => {
        const all = await db.select().from(productsTable);
        return all.filter(p => productIds.includes(p.id));
      })
    : [];

  const cartItems = items.map(item => {
    const product = products.find(p => p.id === item.productId);
    return {
      productId: item.productId,
      product: product ? { ...product, price: parseFloat(product.price), previewVideoUrl: product.previewVideoUrl ?? null } : null,
      addedAt: item.addedAt,
    };
  }).filter(i => i.product !== null);

  const total = cartItems.reduce((sum, i) => sum + (i.product?.price ?? 0), 0);
  return { items: cartItems, total };
}

router.get("/cart", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const cart = await getCartWithProducts(user.id);
  res.json(cart);
});

router.post("/cart", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const parsed = AddToCartBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db.select().from(cartItemsTable)
    .where(and(eq(cartItemsTable.userId, user.id), eq(cartItemsTable.productId, parsed.data.productId)))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(cartItemsTable).values({ userId: user.id, productId: parsed.data.productId });
  }

  const cart = await getCartWithProducts(user.id);
  res.json(cart);
});

router.delete("/cart/:productId", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const params = RemoveFromCartParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(cartItemsTable)
    .where(and(eq(cartItemsTable.userId, user.id), eq(cartItemsTable.productId, params.data.productId)));

  const cart = await getCartWithProducts(user.id);
  res.json(cart);
});

export default router;
