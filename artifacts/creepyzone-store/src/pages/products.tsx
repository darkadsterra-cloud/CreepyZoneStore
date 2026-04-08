import { useState, useEffect } from "react";
import { Link, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useListProducts, useAddToCart } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CATEGORY_IMAGES, CATEGORY_META, ALL_IMAGES, getImageForProduct } from "@/lib/store-images";

const CATEGORIES = [
  "all","animated","neon","horror","anime","vertical",
  "interactive","minimal","grunge","overlay","alert","bundle","pack","asset",
];

export default function Products() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const initialCategory = params.get("category") || "all";
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Sync category from URL
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setSelectedCategory(p.get("category") || "all");
  }, [searchString]);

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

  const catMeta = CATEGORY_META[selectedCategory];
  const catImages = selectedCategory !== "all"
    ? (CATEGORY_IMAGES[selectedCategory] ?? ALL_IMAGES)
    : ALL_IMAGES;

  return (
    <div className="min-h-screen">

      {/* Category Hero Banner */}
      <div className="relative h-52 overflow-hidden border-b border-red-900/20">
        <div className="absolute inset-0 flex gap-0.5">
          {catImages.slice(0, 6).map((img, i) => (
            <div key={i} className="flex-1 overflow-hidden">
              <img src={img} alt="" className="w-full h-full object-cover scale-110" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          {catMeta && <div className="text-3xl mb-2">{catMeta.icon}</div>}
          <h1 className="font-creepster text-4xl md:text-5xl text-white neon-text">
            {catMeta ? catMeta.label : "Catalog of Darkness"}
          </h1>
          {catMeta && <p className="text-gray-400 text-sm mt-1 tracking-widest uppercase">{catMeta.desc}</p>}
        </div>
      </div>

      <div className="py-12 px-4">
        <div className="max-w-7xl mx-auto">

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {CATEGORIES.map(cat => {
              const meta = CATEGORY_META[cat];
              return (
                <button key={cat} onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 text-xs uppercase tracking-widest font-bold border transition-all duration-200 flex items-center gap-1.5 ${
                    selectedCategory === cat
                      ? "bg-red-700 border-red-500 text-white"
                      : "border-red-900/30 text-gray-400 hover:border-red-700/50 hover:text-red-400"
                  }`}>
                  {meta?.icon && <span>{meta.icon}</span>}
                  {cat === "all" ? "All Products" : meta?.label ?? cat}
                </button>
              );
            })}
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="border border-red-900/20 bg-card animate-pulse">
                  <div className="aspect-[3/4] bg-red-950/20" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-red-950/30 rounded" /><div className="h-4 bg-red-950/20 rounded" /><div className="h-6 bg-red-950/30 w-1/2 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            // Empty state — still show images for this category
            <EmptyCategory category={selectedCategory} images={catImages} />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={selectedCategory} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {products.map((product, i) => {
                  const imgSrc = product.previewImageUrl?.startsWith("/api/uploads")
                    ? product.previewImageUrl
                    : getImageForProduct(product.id, product.category);
                  return (
                    <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <Link href={`/products/${product.id}`}>
                        <div className="group border border-red-900/30 bg-card hover:border-red-600/60 lava-pulse transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col">
                          <div className="aspect-[3/4] overflow-hidden relative">
                            <img src={imgSrc} alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            {product.featured && (
                              <div className="absolute top-3 right-3 bg-red-700 text-white text-xs px-2 py-1 uppercase tracking-widest">Featured</div>
                            )}
                          </div>
                          <div className="p-4 flex flex-col flex-1">
                            <span className="text-xs text-red-500 uppercase tracking-widest">{product.category}</span>
                            <h3 className="font-bold text-white mt-1 group-hover:text-red-400 transition-colors flex-1">{product.title}</h3>
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-red-400 font-bold font-creepster text-xl">${product.price.toFixed(2)}</span>
                              <button onClick={(e) => handleAddToCart(product.id, e)}
                                className="p-2 border border-red-900/40 text-red-500 hover:bg-red-950/30 hover:border-red-600 transition-all">
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
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyCategory({ category, images }: { category: string; images: string[] }) {
  const meta = CATEGORY_META[category];
  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <div className="text-4xl mb-3">{meta?.icon ?? "🎬"}</div>
        <h3 className="font-creepster text-3xl text-white mb-2">
          {meta ? `${meta.label} Coming Soon` : "Products Coming Soon"}
        </h3>
        <p className="text-gray-500 mb-6">New products are being added to this category. Check back soon!</p>
      </div>

      {/* Show preview images as inspiration/samples */}
      <div className="border border-red-900/20 p-4 bg-black/20">
        <p className="text-red-500 text-xs uppercase tracking-widest text-center mb-4">Preview Samples</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {images.slice(0, 10).map((img, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
              className="aspect-[3/4] overflow-hidden border border-red-900/20 hover:border-red-600/40 transition-all">
              <img src={img} alt="" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
            </motion.div>
          ))}
        </div>
        <p className="text-gray-600 text-xs text-center mt-4">Products like these will be available soon in this category.</p>
      </div>

      <div className="text-center">
        <Link href="/products">
          <button className="px-8 py-3 bg-red-700 text-white font-bold border border-red-500 uppercase tracking-widest text-sm hover:bg-red-600 transition-all">
            Browse All Products
          </button>
        </Link>
      </div>
    </div>
  );
}
