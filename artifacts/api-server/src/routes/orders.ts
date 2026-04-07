import { Router, type IRouter } from "express";
import { db, ordersTable, orderItemsTable, cartItemsTable, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetOrderParams, DownloadProductParams } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

async function buildOrderResponse(order: any) {
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
  const allProductIds = items.map(i => i.productId);
  const allProducts = allProductIds.length > 0
    ? await db.select().from(productsTable).then(rows => rows.filter(p => allProductIds.includes(p.id)))
    : [];

  return {
    id: order.id,
    userId: order.userId,
    total: parseFloat(order.total),
    status: order.status,
    createdAt: order.createdAt,
    items: items.map(item => {
      const product = allProducts.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        priceAtPurchase: parseFloat(item.priceAtPurchase),
        product: product ? { ...product, price: parseFloat(product.price), previewVideoUrl: product.previewVideoUrl ?? null } : null,
      };
    }).filter(i => i.product !== null),
  };
}

router.get("/orders", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const orders = await db.select().from(ordersTable).where(eq(ordersTable.userId, user.id));
  const built = await Promise.all(orders.map(buildOrderResponse));
  res.json({ orders: built });
});

router.post("/orders", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const cartItems = await db.select().from(cartItemsTable).where(eq(cartItemsTable.userId, user.id));
  if (cartItems.length === 0) {
    res.status(400).json({ error: "Cart is empty" });
    return;
  }

  const productIds = cartItems.map(i => i.productId);
  const products = await db.select().from(productsTable).then(rows => rows.filter(p => productIds.includes(p.id)));

  const total = products.reduce((sum, p) => sum + parseFloat(p.price), 0);

  const [order] = await db.insert(ordersTable).values({
    userId: user.id,
    total: String(total),
    status: "completed",
  }).returning();

  await Promise.all(products.map(p =>
    db.insert(orderItemsTable).values({
      orderId: order.id,
      productId: p.id,
      priceAtPurchase: p.price,
    })
  ));

  await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, user.id));

  const built = await buildOrderResponse(order);
  res.status(201).json(built);
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id)).limit(1);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  if (order.userId !== user.id && user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const built = await buildOrderResponse(order);
  res.json(built);
});

router.get("/orders/:id/download/:productId", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const params = DownloadProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id)).limit(1);
  if (!order || order.userId !== user.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [orderItem] = await db.select().from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, params.data.id))
    .then(rows => rows.filter(r => r.productId === params.data.productId));

  if (!orderItem) {
    res.status(404).json({ error: "Product not found in order" });
    return;
  }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, params.data.productId)).limit(1);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const downloadUrl = `/api/downloads/${product.downloadFileName}?token=${Date.now()}`;
  res.json({ downloadUrl });
});

export default router;
