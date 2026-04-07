import { Router, type IRouter } from "express";
import { db, productsTable, usersTable, ordersTable, orderItemsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

router.get("/admin/stats", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const [products, users, orders, orderItems] = await Promise.all([
    db.select().from(productsTable),
    db.select().from(usersTable),
    db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)).limit(5),
    db.select().from(orderItemsTable),
  ]);

  const allOrders = await db.select().from(ordersTable);
  const totalRevenue = allOrders.reduce((sum, o) => sum + parseFloat(o.total), 0);

  const productSales: Record<number, { count: number; revenue: number }> = {};
  for (const oi of orderItems) {
    if (!productSales[oi.productId]) productSales[oi.productId] = { count: 0, revenue: 0 };
    productSales[oi.productId].count++;
    productSales[oi.productId].revenue += parseFloat(oi.priceAtPurchase);
  }

  const topProducts = products
    .map(p => ({
      product: { ...p, price: parseFloat(p.price), previewVideoUrl: p.previewVideoUrl ?? null },
      salesCount: productSales[p.id]?.count ?? 0,
      revenue: productSales[p.id]?.revenue ?? 0,
    }))
    .sort((a, b) => b.salesCount - a.salesCount)
    .slice(0, 5);

  const recentOrders = await Promise.all(orders.map(async (order) => {
    const items = await db.select().from(orderItemsTable);
    const orderItems2 = items.filter(i => i.orderId === order.id);
    const productIds = orderItems2.map(i => i.productId);
    const prods = products.filter(p => productIds.includes(p.id));
    return {
      id: order.id,
      userId: order.userId,
      total: parseFloat(order.total),
      status: order.status,
      createdAt: order.createdAt,
      items: orderItems2.map(oi => {
        const product = prods.find(p => p.id === oi.productId);
        return {
          productId: oi.productId,
          priceAtPurchase: parseFloat(oi.priceAtPurchase),
          product: product ? { ...product, price: parseFloat(product.price), previewVideoUrl: product.previewVideoUrl ?? null } : null,
        };
      }).filter(i => i.product !== null),
    };
  }));

  res.json({
    totalProducts: products.length,
    totalUsers: users.length,
    totalOrders: allOrders.length,
    totalRevenue,
    recentOrders,
    topProducts,
  });
});

router.get("/admin/users", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
  res.json({
    users: users.map(u => ({ id: u.id, email: u.email, username: u.username, role: u.role, createdAt: u.createdAt }))
  });
});

router.get("/admin/orders", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
  const orderItems = await db.select().from(orderItemsTable);
  const products = await db.select().from(productsTable);

  const built = orders.map(order => {
    const items = orderItems
      .filter(oi => oi.orderId === order.id)
      .map(oi => {
        const product = products.find(p => p.id === oi.productId);
        return {
          productId: oi.productId,
          priceAtPurchase: parseFloat(oi.priceAtPurchase),
          product: product ? { ...product, price: parseFloat(product.price), previewVideoUrl: product.previewVideoUrl ?? null } : null,
        };
      }).filter(i => i.product !== null);

    return {
      id: order.id,
      userId: order.userId,
      total: parseFloat(order.total),
      status: order.status,
      createdAt: order.createdAt,
      items,
    };
  });

  res.json({ orders: built });
});

export default router;
