import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useGetCart, useRemoveFromCart, useCreateOrder } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Trash2, ShoppingCart, ArrowLeft, Download, CheckCircle, CreditCard, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { getImageForProduct } from "@/lib/store-images";

const PAYMENT_METHODS = [
  { id: "card", label: "Credit / Debit Card", icon: "💳", note: "Visa, Mastercard, Amex" },
  { id: "paypal", label: "PayPal", icon: "🅿️", note: "Pay with your PayPal account" },
  { id: "crypto", label: "Cryptocurrency", icon: "₿", note: "BTC, ETH, USDT accepted" },
  { id: "bank", label: "Bank Transfer", icon: "🏦", note: "Direct bank deposit" },
];

export default function Cart() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [selectedPayment, setSelectedPayment] = useState("card");
  const [orderComplete, setOrderComplete] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState<number | null>(null);

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
      const result = await createOrder.mutateAsync({});
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setCompletedOrderId((result as any)?.id ?? null);
      setOrderComplete(true);
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
        <Link href="/login"><button className="px-8 py-3 bg-red-700 text-white uppercase tracking-widest font-bold border border-red-500">Login</button></Link>
      </div>
    );
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-red-500 font-creepster text-2xl animate-pulse">Loading...</div></div>;
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full border border-green-700/40 bg-card p-8 text-center"
          style={{ boxShadow: "0 0 40px rgba(0,180,0,0.1)" }}
        >
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}>
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          </motion.div>
          <h1 className="font-creepster text-4xl text-white mb-3">Payment Confirmed!</h1>
          <p className="text-gray-400 mb-2">Your order has been placed successfully.</p>
          <p className="text-gray-500 text-sm mb-8">Your digital products are ready to download immediately.</p>
          <div className="border border-green-900/30 bg-green-950/10 p-4 mb-6">
            <p className="text-green-400 text-sm uppercase tracking-widest font-bold">Order #{completedOrderId} — Completed</p>
          </div>
          <Link href={completedOrderId ? `/orders/${completedOrderId}` : "/orders"}>
            <button className="w-full py-4 bg-red-700 hover:bg-red-600 text-white font-bold uppercase tracking-[0.3em] lava-pulse border border-red-500 flex items-center justify-center gap-3 mb-4">
              <Download className="w-5 h-5" />
              Download Your Products
            </button>
          </Link>
          <Link href="/products">
            <button className="w-full py-3 border border-red-900/30 text-gray-400 hover:text-white text-sm uppercase tracking-widest transition-all">
              Continue Shopping
            </button>
          </Link>
        </motion.div>
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
        <Link href="/products"><button className="px-8 py-3 bg-red-700 text-white uppercase tracking-widest font-bold border border-red-500 mt-4">Browse Catalog</button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <Link href="/products">
          <button className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors mb-8 uppercase tracking-widest text-sm">
            <ArrowLeft className="w-4 h-4" /> Continue Shopping
          </button>
        </Link>
        <div className="mb-8">
          <p className="text-red-500 uppercase tracking-[0.5em] text-xs mb-2">Your Selection</p>
          <h1 className="font-creepster text-5xl text-white">Dark Cart</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-4">
            {items.map((item, i) => {
              const imgSrc = item.product.previewImageUrl || getImageForProduct(item.product.id, item.product.category);
              return (
                <motion.div key={item.productId} initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:i*0.1}}
                  className="flex items-center gap-4 border border-red-900/30 bg-card p-4">
                  <div className="w-16 h-20 overflow-hidden flex-shrink-0 border border-red-900/20">
                    <img src={imgSrc} alt={item.product.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-red-500 uppercase tracking-widest">{item.product.category}</span>
                    <h3 className="font-bold text-white truncate">{item.product.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Download className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-500">Instant download after purchase</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-red-400 font-bold font-creepster text-lg">${item.product.price.toFixed(2)}</span>
                    <button onClick={()=>handleRemove(item.productId)} className="p-1.5 text-gray-600 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="lg:col-span-2">
            <div className="border border-red-900/30 bg-card p-6 sticky top-20">
              <h2 className="font-creepster text-2xl text-white mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4 border-b border-red-900/20 pb-4">
                {items.map(item => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span className="text-gray-500 truncate mr-2">{item.product.title}</span>
                    <span className="text-gray-400 flex-shrink-0">${item.product.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-gray-400 uppercase tracking-widest text-sm">Total</span>
                <span className="font-creepster text-3xl text-red-400">${total.toFixed(2)}</span>
              </div>

              <div className="mb-6">
                <h3 className="text-xs text-red-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <CreditCard className="w-3 h-3" /> Payment Method
                </h3>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map(method => (
                    <label key={method.id}
                      className={`flex items-center gap-3 p-3 border cursor-pointer transition-all ${
                        selectedPayment === method.id ? "border-red-600/60 bg-red-950/20" : "border-red-900/20 hover:border-red-800/40"
                      }`}>
                      <input type="radio" name="payment" value={method.id}
                        checked={selectedPayment===method.id}
                        onChange={()=>setSelectedPayment(method.id)} className="accent-red-500" />
                      <span className="text-lg">{method.icon}</span>
                      <div>
                        <p className="text-white text-sm font-bold">{method.label}</p>
                        <p className="text-gray-600 text-xs">{method.note}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-gray-600 text-xs mt-3 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-green-500" />
                  Payment gateway details are configured by the store admin. Your payment is processed securely.
                </p>
              </div>

              <button onClick={handleCheckout} disabled={createOrder.isPending}
                className="w-full py-4 bg-red-700 hover:bg-red-600 text-white font-bold uppercase tracking-[0.2em] lava-pulse border border-red-500 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                <Lock className="w-4 h-4" />
                {createOrder.isPending ? "Processing..." : `Pay $${total.toFixed(2)}`}
              </button>

              <p className="text-gray-600 text-xs text-center mt-3 uppercase tracking-widest flex items-center justify-center gap-1">
                <Download className="w-3 h-3" /> Instant digital delivery after payment
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
