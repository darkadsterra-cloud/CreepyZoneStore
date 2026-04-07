import { useState } from "react";
import { Link, useSearch } from "wouter";
import { motion } from "framer-motion";
import { useListProducts, useAddToCart } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { ShoppingCart, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = ["all", "overlay", "alert", "bundle", "asset", "pack"];

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
  "dataImage_🎐_Professional_Photography_📸_1775485134062_percha_1775548205308.jpeg",
  "dataImage_🎐_Basic_Anime_II_1775484807731_perchance_1775548205308.jpeg",
  "dataImage_🎐_Basic_Anime_II_1775484558042_perchance_1775548205308.jpeg",
  "dataImage_🎐_Basic_Anime_II_1775484529977_perchance_1775548205308.jpeg",
  "dataImage_🎐_Basic_Anime_1775484438341_perchance_1775548205308.jpeg",
  "dataImage_🎐_Enhanced_Anime_1775484354209_perchance_1775548205309.jpeg",
  "dataImage_General_High_Quality_Anime_1775484263394_perchance_1775548205309.jpeg",
  "dataImage_General_High_Quality_Anime_1775484254922_perchance_1775548205309.jpeg",
];

export default function Products() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const initialCategory = params.get("category") || "all";
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryParams = selectedCategory !== "all" ? { category: selectedCategory } : {};
  const { data, isLoading } = useListProducts(queryParams);
  const addToCart = useAddToCart();

  const products = data?.products ?? [];

  const handleAddToCart = async (productId: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast({ title: "Login required", description: "Please login to add items to cart.", variant: "destructive" });
      return;
    }
    try {
      await addToCart.mutateAsync({ data: { productId } });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({ title: "Added to cart", description: "Item added to your cart." });
    } catch {
      toast({ title: "Error", description: "Could not add to cart.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-red-500 uppercase tracking-[0.5em] text-xs mb-3">The Collection</p>
          <h1 className="font-creepster text-5xl text-white neon-text">Catalog of Darkness</h1>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2 text-sm uppercase tracking-widest font-bold border transition-all duration-200 ${
                selectedCategory === cat
                  ? "bg-red-700 border-red-500 text-white"
                  : "border-red-900/30 text-gray-400 hover:border-red-700/50 hover:text-red-400"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="border border-red-900/20 bg-card animate-pulse">
                <div className="aspect-[3/4] bg-red-950/20" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-red-950/30 rounded" />
                  <div className="h-4 bg-red-950/20 rounded" />
                  <div className="h-6 bg-red-950/30 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-xl">No products in this category yet.</p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {products.map((product, i) => {
              const imgSrc = `/@assets/${HORROR_IMAGES[(product.id - 1) % HORROR_IMAGES.length]}`;
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/products/${product.id}`}>
                    <div className="group border border-red-900/30 bg-card hover:border-red-600/60 lava-pulse transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col">
                      <div className="aspect-[3/4] overflow-hidden relative">
                        <img
                          src={imgSrc}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => { (e.target as HTMLImageElement).src = "/api/placeholder/400/500"; }}
                        />
                        {product.featured && (
                          <div className="absolute top-3 right-3 bg-red-700 text-white text-xs px-2 py-1 uppercase tracking-widest">
                            Featured
                          </div>
                        )}
                      </div>
                      <div className="p-4 flex flex-col flex-1">
                        <span className="text-xs text-red-500 uppercase tracking-widest">{product.category}</span>
                        <h3 className="font-bold text-white mt-1 group-hover:text-red-400 transition-colors flex-1">
                          {product.title}
                        </h3>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-red-400 font-bold font-creepster text-xl">
                            ${product.price.toFixed(2)}
                          </span>
                          <button
                            onClick={(e) => handleAddToCart(product.id, e)}
                            className="p-2 border border-red-900/40 text-red-500 hover:bg-red-950/30 hover:border-red-600 transition-all"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
