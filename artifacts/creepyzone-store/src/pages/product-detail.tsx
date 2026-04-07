import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { useGetProduct, useAddToCart, useGetCart } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { ShoppingCart, ArrowLeft, Download, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const HORROR_IMAGES = [
  "dataImage_🎐_Noir_Film_📽️_1775485907914_perchance_1775548165415.jpeg",
  "dataImage_🎐_Noir_Film_📽️_1775485899323_perchance_1775548165416.jpeg",
  "dataImage_🎐_Noir_Film_📽️_1775485888248_perchance_1775548165416.jpeg",
  "dataImage_🎐_Noir_Film_📽️_1775485874382_perchance_1775548165416.jpeg",
  "dataImage_🎐_Noir_Film_📽️_1775485724881_perchance_1775548165416.jpeg",
  "dataImage_🎐_Noir_Film_📽️_1775485623260_perchance_1775548165416.jpeg",
  "dataImage_🎐_Noir_Film_📽️_1775485612015_perchance_1775548165416.jpeg",
  "dataImage_🎐_Noir_Film_📽️_1775485592557_perchance_1775548165417.jpeg",
  "dataImage_🎐_Professional_Photography_📸_1775485167920_percha_1775548205308.jpeg",
  "dataImage_🎐_Professional_Photography_📸_1775485157465_percha_1775548205308.jpeg",
];

export default function ProductDetail() {
  const [, params] = useRoute("/products/:id");
  const id = parseInt(params?.id ?? "0");
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useGetProduct(id, { query: { enabled: !!id } });
  const { data: cart } = useGetCart({ query: { enabled: isAuthenticated } });
  const addToCart = useAddToCart();

  const inCart = cart?.items?.some(i => i.productId === id) ?? false;
  const imgSrc = product ? `/@assets/${HORROR_IMAGES[(product.id - 1) % HORROR_IMAGES.length]}` : "";

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast({ title: "Login required", description: "Please login to purchase.", variant: "destructive" });
      return;
    }
    try {
      await addToCart.mutateAsync({ data: { productId: id } });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({ title: "Added to cart", description: "Item added to your cart." });
    } catch {
      toast({ title: "Error", description: "Could not add to cart.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 font-creepster text-2xl neon-text animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="font-creepster text-4xl text-white">Product Not Found</h1>
        <Link href="/products">
          <button className="text-red-500 border border-red-900/50 px-6 py-2 hover:bg-red-950/30">
            Back to Catalog
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <Link href="/products">
          <button className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors mb-8 uppercase tracking-widest text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Catalog
          </button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
            <div className="aspect-[3/4] overflow-hidden border border-red-900/30">
              <img
                src={imgSrc}
                alt={product.title}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = "/api/placeholder/600/800"; }}
              />
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-red-700 flex items-center justify-center">
              <div className="text-center">
                <div className="font-creepster text-white text-2xl">${product.price.toFixed(0)}</div>
                <div className="text-red-200 text-xs">.{String(Math.round((product.price % 1) * 100)).padStart(2, "0")}</div>
              </div>
            </div>
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col justify-center"
          >
            <span className="text-red-500 uppercase tracking-[0.5em] text-xs mb-3">{product.category}</span>
            <h1 className="font-creepster text-5xl text-white mb-6 hover-glitch cursor-default">
              {product.title}
            </h1>

            <div className="flex items-center gap-2 mb-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 text-red-500 fill-current" />
              ))}
              <span className="text-gray-500 text-sm ml-2">Horror-rated</span>
            </div>

            <p className="text-gray-400 leading-relaxed mb-8 text-lg">{product.description}</p>

            <div className="border-t border-red-900/20 pt-6 mb-8">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-red-500" />
                  <span>Instant Download</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-red-500" />
                  <span>Secure Purchase</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <span className="font-creepster text-5xl text-red-400">${product.price.toFixed(2)}</span>
            </div>

            {inCart ? (
              <div className="flex gap-4">
                <div className="flex-1 py-4 bg-red-900/20 border border-red-700 text-red-400 text-center font-bold uppercase tracking-widest">
                  In Cart
                </div>
                <Link href="/cart">
                  <button className="px-6 py-4 border border-red-900/50 text-gray-400 hover:text-white hover:border-red-700 uppercase tracking-widest text-sm transition-all">
                    View Cart
                  </button>
                </Link>
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={addToCart.isPending}
                className="w-full py-4 bg-red-700 hover:bg-red-600 text-white font-bold uppercase tracking-[0.3em] lava-pulse border border-red-500 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                <ShoppingCart className="w-5 h-5" />
                {addToCart.isPending ? "Adding..." : "Add to Cart"}
              </button>
            )}

            {!isAuthenticated && (
              <p className="text-gray-600 text-sm text-center mt-4">
                <Link href="/login" className="text-red-500 hover:underline">Login</Link> to purchase
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
