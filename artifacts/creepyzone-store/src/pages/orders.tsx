import { Link } from "wouter";
import { motion } from "framer-motion";
import { useListOrders } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Download, Package } from "lucide-react";

export default function Orders() {
  const { isAuthenticated } = useAuth();
  const { data, isLoading } = useListOrders({ query: { enabled: isAuthenticated } });

  const orders = data?.orders ?? [];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Package className="w-16 h-16 text-red-900" />
        <h1 className="font-creepster text-4xl text-white">My Orders</h1>
        <p className="text-gray-500">Please login to view your orders.</p>
        <Link href="/login">
          <button className="px-8 py-3 bg-red-700 text-white uppercase tracking-widest font-bold border border-red-500">
            Login
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

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <p className="text-red-500 uppercase tracking-[0.5em] text-xs mb-2">Purchase History</p>
          <h1 className="font-creepster text-5xl text-white">My Orders</h1>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-20 border border-red-900/20 bg-card">
            <Package className="w-16 h-16 text-red-900 mx-auto mb-4" />
            <p className="text-gray-500 text-xl">No orders yet.</p>
            <Link href="/products">
              <button className="mt-4 px-8 py-3 border border-red-900/50 text-red-500 uppercase tracking-widest text-sm hover:bg-red-950/30 transition-all">
                Start Shopping
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="border border-red-900/30 bg-card"
              >
                <div className="p-4 border-b border-red-900/20 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-red-500 uppercase tracking-widest">Order #{order.id}</span>
                    <p className="text-gray-500 text-xs mt-1">
                      {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs uppercase tracking-widest px-2 py-1 ${
                      order.status === "completed" ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"
                    }`}>
                      {order.status}
                    </span>
                    <p className="text-red-400 font-bold font-creepster text-lg mt-1">${order.total.toFixed(2)}</p>
                  </div>
                </div>

                <div className="divide-y divide-red-900/10">
                  {order.items.map(item => item.product && (
                    <div key={item.productId} className="p-4 flex justify-between items-center">
                      <div>
                        <span className="text-xs text-red-500 uppercase tracking-widest">{item.product.category}</span>
                        <p className="text-white font-bold">{item.product.title}</p>
                        <p className="text-gray-500 text-sm">${item.priceAtPurchase.toFixed(2)}</p>
                      </div>
                      <Link href={`/orders/${order.id}`}>
                        <button className="flex items-center gap-2 px-4 py-2 border border-red-900/40 text-red-500 hover:bg-red-950/30 hover:border-red-600 text-sm uppercase tracking-widest transition-all">
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </Link>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
