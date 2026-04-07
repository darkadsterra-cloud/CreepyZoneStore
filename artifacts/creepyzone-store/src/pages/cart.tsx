import { Link } from "wouter";
import { motion } from "framer-motion";
import { useGetCart, useRemoveFromCart, useCreateOrder } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Trash2, ShoppingCart, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const HORROR_IMAGES = [
  "dataImage_🎐_Noir_Film_📽️_1775485907914_perchance_1775548165415.jpeg",
  "dataImage_🎐_Noir_Film_📽️_1775485899323_perchance_1775548165416.jpeg",
  "dataImage_🎐_Professional_Photography_📸_1775485157465_percha_1775548205308.jpeg",
  "dataImage_🎐_Basic_Anime_II_1775484807731_perchance_1775548205308.jpeg",
];

export default function Cart() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useGetCart({ query: { enabled: isAuthenticated } });
  const removeFromCart = useRemoveFromCart();
  const createOrder = useCreateOrder();

  const handleRemove = async (productId: number) => {
    try {
      await removeFromCart.mutateAsync({ productId });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    } catch {
      toast({ title: "Error", description: "Could not remove item.", variant: "destructive" });
    }
  };

  const handleCheckout = async () => {
    try {
      await createOrder.mutateAsync({});
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Order placed!", description: "Your order has been completed. Check My Orders to download." });
    } catch {
      toast({ title: "Error", description: "Could not place order.", variant: "destructive" });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <ShoppingCart className="w-16 h-16 text-red-900" />
        <h1 className="font-creepster text-4xl text-white">Your Cart</h1>
        <p className="text-gray-500">Please login to view your cart.</p>
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

  const items = cart?.items ?? [];
  const total = cart?.total ?? 0;

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <ShoppingCart className="w-16 h-16 text-red-900" />
        <h1 className="font-creepster text-4xl text-white">Your cart is empty</h1>
        <p className="text-gray-500">The darkness awaits your selection.</p>
        <Link href="/products">
          <button className="px-8 py-3 bg-red-700 text-white uppercase tracking-widest font-bold border border-red-500 mt-4">
            Browse Catalog
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/products">
          <button className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors mb-8 uppercase tracking-widest text-sm">
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </button>
        </Link>

        <div className="mb-8">
          <p className="text-red-500 uppercase tracking-[0.5em] text-xs mb-2">Your Selection</p>
          <h1 className="font-creepster text-5xl text-white">Dark Cart</h1>
        </div>

        <div className="space-y-4 mb-8">
          {items.map((item, i) => {
            const imgSrc = `/@assets/${HORROR_IMAGES[i % HORROR_IMAGES.length]}`;
            return (
              <motion.div
                key={item.productId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4 border border-red-900/30 bg-card p-4"
              >
                <div className="w-20 h-24 overflow-hidden flex-shrink-0">
                  <img
                    src={imgSrc}
                    alt={item.product.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-red-500 uppercase tracking-widest">{item.product.category}</span>
                  <h3 className="font-bold text-white truncate">{item.product.title}</h3>
                  <p className="text-red-400 font-bold font-creepster text-lg">${item.product.price.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => handleRemove(item.productId)}
                  className="p-2 text-gray-600 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </motion.div>
            );
          })}
        </div>

        <div className="border-t border-red-900/30 pt-6">
          <div className="flex justify-between items-center mb-6">
            <span className="text-gray-400 uppercase tracking-widest">Total</span>
            <span className="font-creepster text-4xl text-red-400">${total.toFixed(2)}</span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={createOrder.isPending}
            className="w-full py-4 bg-red-700 hover:bg-red-600 text-white font-bold uppercase tracking-[0.3em] lava-pulse border border-red-500 transition-all disabled:opacity-50"
          >
            {createOrder.isPending ? "Processing..." : "Complete Purchase"}
          </button>

          <p className="text-gray-600 text-xs text-center mt-4 uppercase tracking-widest">
            Secure digital delivery. Instant download after purchase.
          </p>
        </div>
      </div>
    </div>
  );
}
