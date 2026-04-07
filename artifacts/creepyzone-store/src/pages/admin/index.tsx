import { Link } from "wouter";
import { motion } from "framer-motion";
import { useGetAdminStats, useGetMe } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Package, Users, ShoppingBag, DollarSign, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const { isAuthenticated } = useAuth();
  const { data: me } = useGetMe({ query: { enabled: isAuthenticated } });
  const { data: stats, isLoading } = useGetAdminStats({ query: { enabled: isAuthenticated && me?.role === "admin" } });

  if (!isAuthenticated || (me && me.role !== "admin")) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="font-creepster text-4xl text-red-500">Access Denied</h1>
        <p className="text-gray-500">You do not have permission to enter the admin lair.</p>
        <Link href="/">
          <button className="px-8 py-3 border border-red-900/50 text-red-500 uppercase tracking-widest text-sm hover:bg-red-950/30">
            Return Home
          </button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 font-creepster text-2xl animate-pulse">Loading...</div>
      </div>
    );
  }

  const statCards = [
    { label: "Products", value: stats?.totalProducts ?? 0, icon: Package, color: "text-red-400" },
    { label: "Users", value: stats?.totalUsers ?? 0, icon: Users, color: "text-orange-400" },
    { label: "Orders", value: stats?.totalOrders ?? 0, icon: ShoppingBag, color: "text-yellow-400" },
    { label: "Revenue", value: `$${(stats?.totalRevenue ?? 0).toFixed(2)}`, icon: DollarSign, color: "text-green-400" },
  ];

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <p className="text-red-500 uppercase tracking-[0.5em] text-xs mb-2">Control Center</p>
          <h1 className="font-creepster text-5xl text-white neon-text">Admin Lair</h1>
        </div>

        {/* Admin Nav */}
        <div className="flex gap-4 mb-10">
          <Link href="/admin">
            <button className="px-6 py-2 bg-red-700 border border-red-500 text-white font-bold uppercase tracking-widest text-sm">
              Dashboard
            </button>
          </Link>
          <Link href="/admin/products">
            <button className="px-6 py-2 border border-red-900/30 text-gray-400 hover:border-red-700/50 hover:text-red-400 font-bold uppercase tracking-widest text-sm transition-all">
              Products
            </button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {statCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="border border-red-900/30 bg-card p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500 uppercase tracking-widest">{card.label}</span>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div className={`font-creepster text-3xl ${card.color}`}>{card.value}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Products */}
          {stats?.topProducts && stats.topProducts.length > 0 && (
            <div className="border border-red-900/30 bg-card">
              <div className="p-4 border-b border-red-900/20 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-red-500" />
                <h2 className="font-bold text-white uppercase tracking-widest text-sm">Top Products</h2>
              </div>
              <div className="divide-y divide-red-900/10">
                {stats.topProducts.map(item => (
                  <div key={item.product.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="text-white font-bold text-sm">{item.product.title}</p>
                      <p className="text-gray-500 text-xs">{item.salesCount} sales</p>
                    </div>
                    <span className="text-red-400 font-bold">${item.revenue.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Orders */}
          {stats?.recentOrders && stats.recentOrders.length > 0 && (
            <div className="border border-red-900/30 bg-card">
              <div className="p-4 border-b border-red-900/20 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-red-500" />
                <h2 className="font-bold text-white uppercase tracking-widest text-sm">Recent Orders</h2>
              </div>
              <div className="divide-y divide-red-900/10">
                {stats.recentOrders.map(order => (
                  <div key={order.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="text-white text-sm">Order #{order.id}</p>
                      <p className="text-gray-500 text-xs">
                        {new Date(order.createdAt).toLocaleDateString()}
                        {" - "}{order.items.length} item(s)
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs uppercase ${order.status === "completed" ? "text-green-400" : "text-red-400"}`}>
                        {order.status}
                      </span>
                      <p className="text-red-400 font-bold">${order.total.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
