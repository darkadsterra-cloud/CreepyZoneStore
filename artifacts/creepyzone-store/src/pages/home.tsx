import { Link } from "wouter";
import { motion } from "framer-motion";
import { useGetFeaturedProducts, useGetCategories } from "@workspace/api-client-react";
import { ShoppingBag, Zap, Package, Layers } from "lucide-react";

const CATEGORY_IMAGES: Record<string, string> = {
  overlay: "/placeholder-overlay.jpg",
  alert: "/placeholder-alert.jpg",
  bundle: "/placeholder-bundle.jpg",
  asset: "/placeholder-asset.jpg",
  pack: "/placeholder-pack.jpg",
};

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
];

export default function Home() {
  const { data: featuredData } = useGetFeaturedProducts();
  const { data: categoriesData } = useGetCategories();

  const featured = featuredData?.products ?? [];
  const categories = categoriesData?.categories ?? [];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="grid grid-cols-3 md:grid-cols-4 h-full opacity-20">
            {HORROR_IMAGES.slice(0, 8).map((img, i) => (
              <div key={i} className="overflow-hidden">
                <img
                  src={`/@assets/${img}`}
                  alt=""
                  className="w-full h-full object-cover scale-110 hover:scale-100 transition-transform duration-700"
                />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
        </div>

        <div className="relative z-10 text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-red-500 uppercase tracking-[0.5em] text-sm font-bold mb-4 hover-glitch">
              Premium Digital Assets
            </p>
            <h1 className="font-creepster text-6xl md:text-9xl neon-text mb-6 leading-none">
              CREEPYZONE
            </h1>
            <h2 className="font-creepster text-4xl md:text-6xl text-red-700 mb-8">
              STORE
            </h2>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 tracking-widest uppercase">
              Horror-Grade Stream Overlays, Animated Alerts & Dark Digital Assets
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/products">
              <button className="px-10 py-4 bg-red-700 hover:bg-red-600 text-white font-bold uppercase tracking-[0.3em] text-sm lava-pulse border border-red-500 transition-all duration-300">
                Enter the Store
              </button>
            </Link>
            <Link href="/products?category=bundle">
              <button className="px-10 py-4 bg-transparent hover:bg-red-950/30 text-red-500 font-bold uppercase tracking-[0.3em] text-sm border border-red-900/50 transition-all duration-300">
                View Bundles
              </button>
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <div className="w-0.5 h-10 bg-gradient-to-b from-red-500 to-transparent mx-auto" />
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-20 px-4 border-t border-red-900/20">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <p className="text-red-500 uppercase tracking-[0.5em] text-xs mb-3">Shop by Category</p>
              <h2 className="font-creepster text-4xl text-white">Choose Your Darkness</h2>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {["overlay", "alert", "bundle", "asset", "pack"].map((cat, i) => {
                const catData = categories.find(c => c.category === cat);
                return (
                  <motion.div
                    key={cat}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link href={`/products?category=${cat}`}>
                      <div className="group relative border border-red-900/30 bg-card p-6 text-center hover:border-red-600/60 lava-pulse transition-all duration-300 cursor-pointer">
                        <div className="text-red-500 mb-3 flex justify-center">
                          {cat === "overlay" && <Layers className="w-8 h-8" />}
                          {cat === "alert" && <Zap className="w-8 h-8" />}
                          {cat === "bundle" && <Package className="w-8 h-8" />}
                          {cat === "asset" && <ShoppingBag className="w-8 h-8" />}
                          {cat === "pack" && <Package className="w-8 h-8" />}
                        </div>
                        <h3 className="font-bold uppercase tracking-widest text-sm text-white group-hover:text-red-400 transition-colors">
                          {cat}s
                        </h3>
                        {catData && (
                          <p className="text-xs text-gray-500 mt-1">{catData.count} items</p>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <p className="text-red-500 uppercase tracking-[0.5em] text-xs mb-3">Hand-Picked Horrors</p>
              <h2 className="font-creepster text-4xl text-white">Featured Products</h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href="/products">
                <button className="px-8 py-3 border border-red-800 text-red-500 uppercase tracking-widest text-sm hover:bg-red-950/30 transition-all">
                  View All Products
                </button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section className="py-20 px-4 border-t border-b border-red-900/20 bg-gradient-to-r from-red-950/20 via-black to-red-950/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-creepster text-5xl text-white mb-4 neon-text">
            Starting Soon?
          </h2>
          <p className="text-gray-400 mb-8 text-lg tracking-wider">
            Get the most terrifying streaming setups in the game. Your audience will never forget.
          </p>
          <Link href="/register">
            <button className="px-12 py-4 bg-red-700 hover:bg-red-600 text-white font-bold uppercase tracking-[0.3em] lava-pulse border border-red-500 transition-all">
              Join the Darkness
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}

const FALLBACK_IMAGES = HORROR_IMAGES.map(img => `/@assets/${img}`);

function ProductCard({ product, index }: { product: any; index: number }) {
  const imgSrc = FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
    >
      <Link href={`/products/${product.id}`}>
        <div className="group border border-red-900/30 bg-card hover:border-red-600/60 lava-pulse transition-all duration-300 overflow-hidden cursor-pointer">
          <div className="aspect-[3/4] overflow-hidden">
            <img
              src={imgSrc}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => { (e.target as HTMLImageElement).src = "/api/placeholder/400/500"; }}
            />
          </div>
          <div className="p-4">
            <span className="text-xs text-red-500 uppercase tracking-widest">{product.category}</span>
            <h3 className="font-bold text-white mt-1 group-hover:text-red-400 transition-colors line-clamp-2">
              {product.title}
            </h3>
            <p className="text-red-400 font-bold mt-2 font-creepster text-xl">
              ${product.price.toFixed(2)}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
