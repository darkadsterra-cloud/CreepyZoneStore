import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { useGetOrder } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Download, ArrowLeft, CheckCircle, Package, FileArchive } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function OrderDetail() {
  const [, params] = useRoute("/orders/:id");
  const id = parseInt(params?.id ?? "0");
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: order, isLoading } = useGetOrder(id, { query: { enabled: isAuthenticated && !!id } });

  const handleDownload = async (productTitle: string, downloadFileName: string) => {
    try {
      const token = localStorage.getItem("creepyzone_token");

      // Check if downloadFileName is already a full Supabase URL
      if (downloadFileName.startsWith("http")) {
        const link = document.createElement("a");
        link.href = downloadFileName;
        link.download = downloadFileName.split("/").pop() ?? "download";
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "Download started", description: `Downloading ${productTitle}` });
        return;
      }

      // Otherwise fetch via secure API route
      const res = await fetch(`/api/orders/${id}/download/${encodeURIComponent(downloadFileName)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast({ title: "Download failed", description: err.error ?? "Could not download file.", variant: "destructive" });
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = downloadFileName.split("/").pop() ?? "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: "Download started", description: `Downloading ${productTitle}` });
    } catch (err: any) {
      toast({ title: "Download failed", description: err.message, variant: "destructive" });
    }
  };

  if (!isAuthenticated || isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-red-500 font-creepster text-2xl animate-pulse">Loading...</div></div>;
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="font-creepster text-4xl text-white">Order Not Found</h1>
        <Link href="/orders"><button className="text-red-500 border border-red-900/50 px-6 py-2 hover:bg-red-950/30">Back to Orders</button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/orders">
          <button className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors mb-8 uppercase tracking-widest text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Orders
          </button>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-4 p-4 mb-8 border ${
            order.status === "completed"
              ? "border-green-700/40 bg-green-950/20"
              : "border-red-900/30 bg-red-950/10"
          }`}
        >
          <CheckCircle className={`w-8 h-8 ${order.status === "completed" ? "text-green-500" : "text-gray-500"}`} />
          <div>
            <p className="text-white font-bold">Order #{order.id} — <span className={order.status === "completed" ? "text-green-400" : "text-red-400"}>{order.status.toUpperCase()}</span></p>
            <p className="text-gray-500 text-sm">
              Placed {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · Total: ${order.total.toFixed(2)}
            </p>
          </div>
        </motion.div>

        <div className="mb-8">
          <p className="text-red-500 uppercase tracking-[0.5em] text-xs mb-2">Your Purchases</p>
          <h1 className="font-creepster text-4xl text-white">Download Your Products</h1>
          <p className="text-gray-500 text-sm mt-2">All digital products are available for immediate download below.</p>
        </div>

        <div className="space-y-4 mb-8">
          {order.items.map((item, i) => item.product && (
            <motion.div
              key={item.productId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="border border-red-900/30 bg-card overflow-hidden"
            >
              <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-950/30 border border-red-900/20 flex items-center justify-center flex-shrink-0">
                    <FileArchive className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <span className="text-xs text-red-500 uppercase tracking-widest">{item.product.category}</span>
                    <h3 className="font-bold text-white mt-0.5">{item.product.title}</h3>
                    <p className="text-gray-500 text-xs mt-1">
                      {item.product.downloadFileName || "digital-product.zip"} · ${item.priceAtPurchase.toFixed(2)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDownload(
                    item.product!.title,
                    item.product!.downloadFileName || `product-${item.productId}.zip`
                  )}
                  className="flex items-center gap-2 px-6 py-3 bg-red-700 hover:bg-red-600 text-white font-bold uppercase tracking-widest text-sm border border-red-500 lava-pulse transition-all flex-shrink-0 w-full sm:w-auto justify-center"
                >
                  <Download className="w-4 h-4" />
                  Download Now
                </button>
              </div>
              <div className="h-0.5 bg-gradient-to-r from-red-900/50 via-red-600/30 to-transparent" />
            </motion.div>
          ))}
        </div>

        <div className="border border-red-900/20 bg-card p-4 text-center">
          <p className="text-gray-500 text-sm">
            Having trouble downloading? Contact us at{" "}
            <a href="mailto:support@creepyzone.store" className="text-red-400 hover:underline">support@creepyzone.store</a>
          </p>
          <p className="text-gray-600 text-xs mt-2">Downloads are available indefinitely — revisit My Orders anytime.</p>
        </div>
      </div>
    </div>
  );
}
