import { Link } from "wouter";
import { motion } from "framer-motion";
import { useGetFeaturedProducts } from "@workspace/api-client-react";
import { ALL_IMAGES, CATEGORY_IMAGES, CATEGORY_META, getImageForProduct } from "@/lib/store-images";

const ALL_CATS = ["animated","neon","horror","anime","vertical","interactive","minimal","grunge","overlay","alert","bundle","pack"];

export default function Home() {
  const { data: featuredData } = useGetFeaturedProducts();
  const featured = featuredData?.products ?? [];

  return (
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="grid grid-cols-4 md:grid-cols-5 h-full opacity-25">
            {ALL_IMAGES.slice(0, 10).map((img, i) => (
              <div key={i} className="overflow-hidden">
                <img src={img} alt="" className="w-full h-full object-cover scale-110 hover:scale-100 transition-transform duration-700" />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/40" />
        </div>

        <div className="relative z-10 text-center px-4">
          <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <p className="text-red-500 uppercase tracking-[0.5em] text-sm font-bold mb-4 hover-glitch">Premium Digital Assets</p>
            <h1 className="font-creepster text-6xl md:text-9xl neon-text mb-6 leading-none">CREEPYZONE</h1>
            <h2 className="font-creepster text-4xl md:text-6xl text-red-700 mb-8">STORE</h2>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 tracking-widest uppercase">
              Horror-Grade Stream Overlays, Animated Alerts & Dark Digital Assets
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center">
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
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <div className="w-0.5 h-10 bg-gradient-to-b from-red-500 to-transparent mx-auto" />
        </div>
      </section>

      {/* ── Preview Strip ── */}
      <section className="py-6 overflow-hidden border-t border-b border-red-900/20 bg-black/60">
        <div className="flex gap-3 animate-none" style={{ display: "flex", overflowX: "auto", scrollbarWidth: "none" }}>
          <div className="flex gap-3 min-w-max px-4">
            {ALL_IMAGES.map((img, i) => (
              <div key={i} className="w-20 h-28 flex-shrink-0 overflow-hidden border border-red-900/20 hover:border-red-500/40 transition-all">
                <img src={img} alt="" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Products ── */}
      {featured.length > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
              <p className="text-red-500 uppercase tracking-[0.5em] text-xs mb-3">Hand-Picked Horrors</p>
              <h2 className="font-creepster text-5xl text-white neon-text">Featured Products</h2>
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

      {/* ── All Categories Grid ── */}
      <section className="py-20 px-4 border-t border-red-900/20">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
            <p className="text-red-500 uppercase tracking-[0.5em] text-xs mb-3">Shop by Category</p>
            <h2 className="font-creepster text-5xl text-white">Choose Your Darkness</h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {ALL_CATS.map((cat, i) => {
              const meta = CATEGORY_META[cat];
              const imgs = CATEGORY_IMAGES[cat] ?? ALL_IMAGES;
              const heroImg = imgs[0];
              const thumbs = imgs.slice(1, 4);
              return (
                <motion.div key={cat}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                  <Link href={`/products?category=${cat}`}>
                    <div className="group relative border border-red-900/30 hover:border-red-600/60 transition-all duration-300 overflow-hidden cursor-pointer bg-card lava-pulse">
                      {/* Main hero image */}
                      <div className="aspect-[3/4] overflow-hidden relative">
                        <img src={heroImg} alt={meta?.label ?? cat}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                        {/* Icon badge */}
                        <div className="absolute top-3 left-3 w-9 h-9 bg-black/70 border border-red-900/40 flex items-center justify-center text-lg">
                          {meta?.icon ?? "🎬"}
                        </div>
                      </div>
                      {/* Thumbnail row */}
                      <div className="grid grid-cols-3 gap-0.5 border-t border-red-900/20">
                        {thumbs.map((t, ti) => (
                          <div key={ti} className="aspect-square overflow-hidden">
                            <img src={t} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          </div>
                        ))}
                      </div>
                      {/* Label overlay */}
                      <div className="absolute bottom-[calc(25%+2px)] left-0 right-0 px-3 pb-3">
                        <h3 className="font-creepster text-lg text-white group-hover:text-red-400 transition-colors leading-tight">
                          {meta?.label ?? cat}
                        </h3>
                        <p className="text-gray-500 text-xs mt-0.5 leading-tight hidden sm:block">{meta?.desc}</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Showcase: Starting Soon ── */}
      <ShowcaseSection
        title="Starting Soon Screens"
        subtitle="Scare Your Viewers From the First Second"
        catKey="horror"
        images={[
          CATEGORY_IMAGES.horror[0], CATEGORY_IMAGES.horror[1],
          CATEGORY_IMAGES.horror[2], CATEGORY_IMAGES.horror[3],
          CATEGORY_IMAGES.horror[4], CATEGORY_IMAGES.animated[0],
        ]}
        linkCat="horror"
      />

      {/* ── Showcase: BRB / Ending ── */}
      <ShowcaseSection
        title="BRB & Ending Screens"
        subtitle="Keep Your Audience Hooked While You're Away"
        catKey="bundle"
        images={[
          CATEGORY_IMAGES.pack[0], CATEGORY_IMAGES.pack[1],
          CATEGORY_IMAGES.pack[2], CATEGORY_IMAGES.pack[3],
          CATEGORY_IMAGES.alert[0], CATEGORY_IMAGES.alert[1],
        ]}
        linkCat="bundle"
        reversed
      />

      {/* ── Anime / VTuber Spotlight ── */}
      <section className="py-20 px-4 border-t border-red-900/20 bg-gradient-to-b from-black to-red-950/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-red-500 uppercase tracking-[0.5em] text-xs mb-2">🌸 Trending Now</p>
            <h2 className="font-creepster text-4xl text-white">Anime & VTuber Collection</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {CATEGORY_IMAGES.anime.map((img, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <Link href="/products?category=anime">
                  <div className="group aspect-[3/4] overflow-hidden border border-red-900/20 hover:border-purple-500/40 transition-all cursor-pointer">
                    <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/products?category=anime">
              <button className="px-8 py-3 border border-purple-800/50 text-purple-400 uppercase tracking-widest text-sm hover:bg-purple-950/20 transition-all">
                Browse Anime Collection
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Neon / Frame Overlay ── */}
      <section className="py-20 px-4 border-t border-red-900/20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-red-500 uppercase tracking-[0.5em] text-xs mb-2">🌐 Cyberpunk Style</p>
            <h2 className="font-creepster text-5xl text-white mb-4">Neon Overlays & Frames</h2>
            <p className="text-gray-500 leading-relaxed mb-6">
              RGB glowing borders, sci-fi HUD designs, and electric lightning frames. Built for gaming streamers who want maximum visual impact.
            </p>
            <Link href="/products?category=neon">
              <button className="px-8 py-3 bg-red-700 hover:bg-red-600 text-white font-bold uppercase tracking-widest text-sm border border-red-500 lava-pulse transition-all">
                Shop Neon Collection
              </button>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORY_IMAGES.neon.slice(0, 4).map((img, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className={`overflow-hidden border border-red-900/20 hover:border-red-500/40 transition-all ${i === 0 ? "row-span-2" : ""}`}>
                  <img src={img} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    style={{ minHeight: i === 0 ? "280px" : "130px" }} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-4 border-t border-b border-red-900/20 bg-gradient-to-r from-red-950/20 via-black to-red-950/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-creepster text-5xl text-white mb-4 neon-text">Starting Soon?</h2>
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

function ShowcaseSection({ title, subtitle, images, linkCat, reversed = false }: {
  title: string; subtitle: string; catKey: string;
  images: string[]; linkCat: string; reversed?: boolean;
}) {
  const main = images[0];
  const rest = images.slice(1);
  return (
    <section className={`py-20 px-4 border-t border-red-900/20 ${reversed ? "bg-red-950/5" : ""}`}>
      <div className="max-w-7xl mx-auto">
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-10 items-center ${reversed ? "lg:flex-row-reverse" : ""}`}
          style={{ direction: reversed ? "rtl" : "ltr" }}>
          {/* Images side */}
          <div style={{ direction: "ltr" }} className="grid grid-cols-3 gap-2">
            <div className="col-span-2 row-span-2 overflow-hidden border border-red-900/30">
              <img src={main} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" style={{ minHeight: "280px" }} />
            </div>
            {rest.slice(0, 4).map((img, i) => (
              <div key={i} className="overflow-hidden border border-red-900/20">
                <img src={img} alt="" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" style={{ minHeight: "100px" }} />
              </div>
            ))}
          </div>
          {/* Text side */}
          <div style={{ direction: "ltr" }}>
            <p className="text-red-500 uppercase tracking-[0.5em] text-xs mb-3">Premium Assets</p>
            <h2 className="font-creepster text-4xl text-white mb-4">{title}</h2>
            <p className="text-gray-500 leading-relaxed mb-6">{subtitle}</p>
            <Link href={`/products?category=${linkCat}`}>
              <button className="px-8 py-3 bg-red-700 hover:bg-red-600 text-white font-bold uppercase tracking-widest text-sm border border-red-500 lava-pulse transition-all">
                Browse Collection
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product, index }: { product: any; index: number }) {
  const imgSrc = getImageForProduct(product.id, product.category);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
      <Link href={`/products/${product.id}`}>
        <div className="group border border-red-900/30 bg-card hover:border-red-600/60 lava-pulse transition-all duration-300 overflow-hidden cursor-pointer">
          <div className="aspect-[3/4] overflow-hidden">
            <img src={imgSrc} alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
          <div className="p-4">
            <span className="text-xs text-red-500 uppercase tracking-widest">{product.category}</span>
            <h3 className="font-bold text-white mt-1 group-hover:text-red-400 transition-colors line-clamp-2">{product.title}</h3>
            <p className="text-red-400 font-bold mt-2 font-creepster text-xl">${product.price.toFixed(2)}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
