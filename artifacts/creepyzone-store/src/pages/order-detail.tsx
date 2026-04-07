import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { useGetOrder, useDownloadProduct } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Download, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function OrderDetail() {
  const [, params] = useRoute("/orders/:id");
  const id = parseInt(params?.id ?? "0");
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: order, isLoading } = useGetOrder(id, { query: { enabled: isAuthenticated && !!id } });

  const handleDownload = async (productId: number) => {
    toast({ title: "Download ready", description: "Your file is being prepared for download." });
  };

  if (!isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 font-creepster text-2xl animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="font-creepster text-4xl text-white">Order Not Found</h1>
        <Link href="/orders">
          <button className="text-red-500 border border-red-900/50 px-6 py-2 hover:bg-red-950/30">
            Back to Orders
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/orders">
          <button className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors mb-8 uppercase tracking-widest text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </button>
        </Link>

        <div className="mb-8">
          <p className="text-red-500 uppercase tracking-[0.5em] text-xs mb-2">Order #{order.id}</p>
          <h1 className="font-creepster text-4xl text-white">Your Downloads</h1>
          <p className="text-gray-500 mt-2">
            Placed {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            {" - "}
            <span className={order.status === "completed" ? "text-green-400" : "text-red-400"}>
              {order.status}
            </span>
          </p>
        </div>

        <div className="space-y-4 mb-8">
          {order.items.map((item, i) => item.product && (
            <motion.div
              key={item.productId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="border border-red-900/30 bg-card p-6 flex justify-between items-center"
            >
              <div>
                <span className="text-xs text-red-500 uppercase tracking-widest">{item.product.category}</span>
                <h3 className="font-bold text-white mt-1">{item.product.title}</h3>
                <p className="text-gray-500 text-sm">${item.priceAtPurchase.toFixed(2)}</p>
              </div>
              <button
                onClick={() => handleDownload(item.productId)}
                className="flex items-center gap-2 px-6 py-3 bg-red-700 hover:bg-red-600 text-white font-bold uppercase tracking-widest text-sm border border-red-500 lava-pulse transition-all"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </motion.div>
          ))}
        </div>

        <div className="border-t border-red-900/30 pt-4 text-right">
          <span className="text-gray-500 mr-4 uppercase tracking-widest text-sm">Total</span>
          <span className="font-creepster text-3xl text-red-400">${order.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
