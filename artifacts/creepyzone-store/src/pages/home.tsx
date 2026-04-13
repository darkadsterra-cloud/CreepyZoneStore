import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useGetFeaturedProducts } from "@workspace/api-client-react";
import { ALL_IMAGES, CATEGORY_IMAGES, CATEGORY_META, getImageForProduct } from "@/lib/store-images";
import { X, ChevronLeft, ChevronRight, Zap, Music, Video, Download, Lock, Star, Play } from "lucide-react";
import { useAuthModal } from "@/App";

const ALL_CATS = ["animated","neon","horror","anime","vertical","interactive","minimal","grunge","overlay","alert","bundle","pack"];

function Lightbox({ images, startIndex, onClose }: { images: string[]; startIndex: number; onClose: () => void }) {
  const [index, setIndex] = useState(startIndex);

  const prev = useCallback(() => setIndex(i => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIndex(i => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "PrintScreen") {
        e.preventDefault();
        navigator.clipboard?.writeText("").catch(() => {});
      }
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose, prev, next]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
        onClick={onClose}
        onContextMenu={e => e.preventDefault()}
      >
        <button onClick={onClose}
          className="absolute top-4 right-4 z-[60] text-white bg-red-700/80 hover:bg-red-600 p-2 border border-red-500 transition-all">
          <X className="w-6 h-6" />
        </button>

        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-gray-300 text-sm px-4 py-1 border border-red-900/30 z-[60]">
          {index + 1} / {images.length}
        </div>

        <button onClick={e => { e.stopPropagation(); prev(); }}
          className="absolute left-3 md:left-6 z-[60] text-white bg-black/70 hover:bg-red-900/70 p-2 md:p-3 border border-red-900/40 transition-all">
          <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
        </button>

        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="max-w-[85vw] max-h-[85vh] mx-16 protected-media protected-media-lg"
          onClick={e => e.stopPropagation()}
          onContextMenu={e => e.preventDefault()}
        >
          <div className="wm" />
          <img src={images[index]} alt="" draggable={false}
            className="max-w-full max-h-[85vh] object-contain border border-red-900/30" />
        </motion.div>

        <button onClick={e => { e.stopPropagation(); next(); }}
          className="absolute right-3 md:right-6 z-[60] text-white bg-black/70 hover:bg-red-900/70 p-2 md:p-3 border border-red-900/40 transition-all">
          <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
        </button>

        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto z-[60]">
          {images.map((img, i) => (
            <button key={i}
              onClick={e => { e.stopPropagation(); setIndex(i); }}
              onContextMenu={e => e.preventDefault()}
              className={`w-12 h-16 flex-shrink-0 overflow-hidden border-2 transition-all protected-media ${
                i === index ? "border-red-500 opacity-100" : "border-red-900/30 opacity-50 hover:opacity-80"
              }`}>
              <div className="wm" />
              <img src={img} alt="" draggable={false} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function Home() {
  const { data: featuredData } = useGetFeaturedProducts();
  const featured = featuredData?.products ?? [];
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
  const { openAuthModal } = useAuthModal();

  const openLightbox = (images: string[], index: number) => setLightbox({ images, index });
  const closeLightbox = () => setLightbox(null);

  return (
    <div className="min-h-screen">

      {lightbox && (
        <Lightbox images={lightbox.images} startIndex={lightbox.index} onClose={closeLightbox} />
      )}

      {/* ── Hero ── */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="grid grid-cols-4 md:grid-cols-5 h-full opacity-25">
            {ALL_IMAGES.slice(0, 10).map((img, i) => (
              <div key={i} className="overflow-hidden protected-media" onContextMenu={e => e.preventDefault()}>
                <div className="wm" />
                <img src={img} alt="" draggable={false}
                  className="w-full h-full object-cover scale-110 hover:scale-100 transition-transform duration-700" />
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
            <button
              onClick={() => openAuthModal("register")}
              className="px-10 py-4 bg-red-700 hover:bg-red-600 text-white font-bold uppercase tracking-[0.3em] text-sm lava-pulse border border-red-500 transition-all duration-300">
              Join The Darkness
            </button>
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
        <div style={{ display: "flex", overflowX: "auto", scrollbarWidth: "none" }}>
          <div className="flex gap-3 min-w-max px-4">
            {ALL_IMAGES.map((img, i) => (
              <button key={i}
                onClick={() => openLightbox(ALL_IMAGES, i)}
                onContextMenu={e => e.preventDefault()}
                className="w-16 h-20 flex-shrink-0 border border-red-900/20 hover:border-red-500/60 transition-all cursor-pointer group relative protected-media">
                <div className="wm" />
                <img src={img} alt="" draggable={false}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </button>
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
                      <div className="aspect-[3/4] overflow-hidden relative protected-media"
                        onContextMenu={e => e.preventDefault()}>
                        <div className="wm" />
                        <img src={heroImg} alt={meta?.label ?? cat} draggable={false}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                        <div className="absolute top-3 left-3 w-9 h-9 bg-black/70 border border-red-900/40 flex items-center justify-center text-lg z-10">
                          {meta?.icon ?? "🎬"}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-0.5 border-t border-red-900/20">
                        {thumbs.map((t, ti) => (
                          <div key={ti} className="aspect-square overflow-hidden protected-media"
                            onContextMenu={e => e.preventDefault()}>
                            <div className="wm" />
                            <img src={t} alt="" draggable={false}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          </div>
                        ))}
                      </div>
                      <div className="absolute bottom-[calc(25%+2px)] left-0 right-0 px-3 pb-3 z-10">
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
        onImageClick={(imgs, idx) => openLightbox(imgs, idx)}
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
        onImageClick={(imgs, idx) => openLightbox(imgs, idx)}
      />

      {/* ── Horror Animation Studio Tool Section ── */}
      <section className="py-24 px-4 border-t border-red-900/20 bg-gradient-to-b from-black via-red-950/10 to-black relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-900/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-red-800/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-red-900/20 border border-red-800/40 px-4 py-2 mb-6">
              <Zap className="w-4 h-4 text-red-500" />
              <span className="text-red-400 uppercase tracking-[0.4em] text-xs font-bold">Featured Tool</span>
            </div>
            <h2 className="font-creepster text-5xl md:text-7xl text-white neon-text mb-4">
              Horror Animation Studio
            </h2>
            <p className="text-gray-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
              Create spine-chilling animated stream overlays directly in your browser. Upload your horror images, add haunting sound effects, voice overs, and export ready-to-stream videos — no software needed.
            </p>
          </motion.div>

          {/* Main content: Demo images + Features */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">

            {/* Left: Image showcase grid */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              {/* Main large image */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 row-span-2 relative overflow-hidden border border-red-900/40 group">
                  <img
                    src={CATEGORY_IMAGES.horror[0]}
                    alt="Horror Animation Studio"
                    draggable={false}
                    onContextMenu={e => e.preventDefault()}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    style={{ minHeight: "320px" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-red-700/80 border-2 border-red-500 flex items-center justify-center group-hover:bg-red-600 transition-all">
                      <Play className="w-7 h-7 text-white ml-1" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="text-xs text-red-400 uppercase tracking-widest bg-black/70 px-2 py-1 border border-red-900/30">
                      🎬 Live Preview
                    </span>
                  </div>
                </div>
                {[CATEGORY_IMAGES.horror[1], CATEGORY_IMAGES.horror[2], CATEGORY_IMAGES.animated[0], CATEGORY_IMAGES.horror[3]].map((img, i) => (
                  <div key={i} className="overflow-hidden border border-red-900/30 group relative">
                    <img
                      src={img}
                      alt=""
                      draggable={false}
                      onContextMenu={e => e.preventDefault()}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      style={{ minHeight: "100px" }}
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-all" />
                  </div>
                ))}
              </div>

              {/* Floating badge */}
              <div className="absolute -top-4 -right-4 bg-red-700 border border-red-500 px-4 py-2 z-10">
                <p className="text-white text-xs font-bold uppercase tracking-widest">In-Browser Tool</p>
              </div>
            </motion.div>

            {/* Right: Features list */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="space-y-6 mb-10">
                {[
                  {
                    icon: <Video className="w-5 h-5 text-red-500" />,
                    title: "Animated Horror Overlays",
                    desc: "Upload your images and apply spine-chilling animations — fire, blood drip, floating ash, lightning and more particle effects."
                  },
                  {
                    icon: <Music className="w-5 h-5 text-red-500" />,
                    title: "Sound Library & TTS",
                    desc: "Add ambient horror sounds, screams, effects, or text-to-speech voices directly to your animation. 100+ sounds included."
                  },
                  {
                    icon: <Zap className="w-5 h-5 text-red-500" />,
                    title: "Slideshow & Single Mode",
                    desc: "Create animated slideshows or single-image animations. Perfect for Starting Soon, BRB, and Ending screens."
                  },
                  {
                    icon: <Download className="w-5 h-5 text-red-500" />,
                    title: "Export in Multiple Formats",
                    desc: "Record and download your animation in 1080p, 4K, TikTok vertical, YouTube Shorts, OBS Canvas and more resolutions."
                  },
                ].map((feat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-4 items-start group"
                  >
                    <div className="w-10 h-10 bg-red-900/20 border border-red-900/40 flex items-center justify-center flex-shrink-0 group-hover:bg-red-900/40 transition-all">
                      {feat.icon}
                    </div>
                    <div>
                      <h4 className="text-white font-bold mb-1 group-hover:text-red-400 transition-colors">{feat.title}</h4>
                      <p className="text-gray-500 text-sm leading-relaxed">{feat.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/tools/horror-animation-studio">
                  <button className="px-8 py-4 bg-red-700 hover:bg-red-600 text-white font-bold uppercase tracking-[0.3em] text-sm lava-pulse border border-red-500 transition-all duration-300 w-full sm:w-auto">
                    🎬 Open Studio
                  </button>
                </Link>
                <a href="#studio-plans">
                  <button className="px-8 py-4 bg-transparent hover:bg-red-950/30 text-red-400 font-bold uppercase tracking-[0.2em] text-sm border border-red-900/50 transition-all duration-300 w-full sm:w-auto">
                    View Plans
                  </button>
                </a>
              </div>

              <p className="text-gray-600 text-xs mt-4 flex items-center gap-2">
                <Lock className="w-3 h-3" />
                Login with your CreepyZone account to access the studio
              </p>
            </motion.div>
          </div>

          {/* ── Studio Pricing Plans ── */}
          <div id="studio-plans">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <p className="text-red-500 uppercase tracking-[0.5em] text-xs mb-3">Studio Access</p>
              <h3 className="font-creepster text-4xl text-white">Choose Your Plan</h3>
              <p className="text-gray-500 mt-2">Create freely — unlock recording & downloads with a plan</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">

              {/* Free Plan */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="border border-red-900/30 bg-black/60 p-8 relative"
              >
                <div className="mb-6">
                  <h4 className="font-creepster text-2xl text-white mb-1">Free Access</h4>
                  <div className="flex items-end gap-1 mb-3">
                    <span className="font-creepster text-5xl text-white">$0</span>
                    <span className="text-gray-500 mb-2">/forever</span>
                  </div>
                  <p className="text-gray-500 text-sm">Perfect to explore the studio and preview your creations</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {[
                    { text: "Full studio access", ok: true },
                    { text: "All animations & effects", ok: true },
                    { text: "Sound library & TTS", ok: true },
                    { text: "Live preview in browser", ok: true },
                    { text: "Record & Download videos", ok: false },
                    { text: "4K / TikTok export", ok: false },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <span className={item.ok ? "text-red-500" : "text-gray-700"}>
                        {item.ok ? "✓" : "✗"}
                      </span>
                      <span className={item.ok ? "text-gray-300" : "text-gray-600 line-through"}>{item.text}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => openAuthModal("register")}
                  className="w-full py-3 border border-red-900/50 text-red-500 uppercase tracking-widest text-sm hover:bg-red-950/20 transition-all font-bold"
                >
                  Get Started Free
                </button>
              </motion.div>

              {/* Pro Plan */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="border border-red-600/60 bg-gradient-to-b from-red-950/30 to-black/80 p-8 relative"
              >
                {/* Popular badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-700 border border-red-500 px-4 py-1">
                  <span className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                    <Star className="w-3 h-3" /> Most Popular
                  </span>
                </div>

                <div className="mb-6">
                  <h4 className="font-creepster text-2xl text-white mb-1">Studio Pro</h4>
                  <div className="flex items-end gap-1 mb-3">
                    <span className="font-creepster text-5xl neon-text">$30</span>
                    <span className="text-gray-400 mb-2">/month</span>
                  </div>
                  <p className="text-gray-400 text-sm">Full power to record, download and publish your horror animations</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {[
                    { text: "Everything in Free", ok: true },
                    { text: "Record & Download videos", ok: true },
                    { text: "1080p & 4K export", ok: true },
                    { text: "TikTok, YouTube Shorts, OBS formats", ok: true },
                    { text: "Unlimited projects", ok: true },
                    { text: "Priority support", ok: true },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <span className="text-red-500">✓</span>
                      <span className="text-gray-300">{item.text}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => openAuthModal("register")}
                  className="w-full py-3 bg-red-700 hover:bg-red-600 text-white font-bold uppercase tracking-widest text-sm border border-red-500 lava-pulse transition-all"
                >
                  Unlock Pro — $30/mo
                </button>
              </motion.div>

            </div>

            {/* Bottom note */}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center text-gray-600 text-xs mt-6 flex items-center justify-center gap-2"
            >
              <Lock className="w-3 h-3" />
              Use your CreepyZone Store login to access the studio — no separate account needed
            </motion.p>
          </div>
        </div>
      </section>

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
                <button onClick={() => openLightbox(CATEGORY_IMAGES.anime, i)}
                  onContextMenu={e => e.preventDefault()}
                  className="group w-full aspect-[3/4] overflow-hidden border border-red-900/20 hover:border-purple-500/40 transition-all cursor-pointer block protected-media">
                  <div className="wm" />
                  <img src={img} alt="" draggable={false}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </button>
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
                <button onClick={() => openLightbox(CATEGORY_IMAGES.neon, i)}
                  onContextMenu={e => e.preventDefault()}
                  className={`w-full overflow-hidden border border-red-900/20 hover:border-red-500/40 transition-all cursor-pointer block protected-media ${i === 0 ? "row-span-2" : ""}`}>
                  <div className="wm" />
                  <img src={img} alt="" draggable={false}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    style={{ minHeight: i === 0 ? "280px" : "130px" }} />
                </button>
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
          <button
            onClick={() => openAuthModal("register")}
            className="px-12 py-4 bg-red-700 hover:bg-red-600 text-white font-bold uppercase tracking-[0.3em] lava-pulse border border-red-500 transition-all">
            Join the Darkness
          </button>
        </div>
      </section>
    </div>
  );
}

function ShowcaseSection({ title, subtitle, images, linkCat, reversed = false, onImageClick }: {
  title: string; subtitle: string; catKey: string;
  images: string[]; linkCat: string; reversed?: boolean;
  onImageClick: (images: string[], index: number) => void;
}) {
  const main = images[0];
  const rest = images.slice(1);
  return (
    <section className={`py-20 px-4 border-t border-red-900/20 ${reversed ? "bg-red-950/5" : ""}`}>
      <div className="max-w-7xl mx-auto">
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-10 items-center ${reversed ? "lg:flex-row-reverse" : ""}`}
          style={{ direction: reversed ? "rtl" : "ltr" }}>
          <div style={{ direction: "ltr" }} className="grid grid-cols-3 gap-2">
            <button onClick={() => onImageClick(images, 0)}
              onContextMenu={e => e.preventDefault()}
              className="col-span-2 row-span-2 overflow-hidden border border-red-900/30 cursor-pointer block protected-media">
              <div className="wm" />
              <img src={main} alt="" draggable={false}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                style={{ minHeight: "280px" }} />
            </button>
            {rest.slice(0, 4).map((img, i) => (
              <button key={i}
                onClick={() => onImageClick(images, i + 1)}
                onContextMenu={e => e.preventDefault()}
                className="overflow-hidden border border-red-900/20 cursor-pointer block protected-media">
                <div className="wm" />
                <img src={img} alt="" draggable={false}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                  style={{ minHeight: "100px" }} />
              </button>
            ))}
          </div>
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
  const imgSrc = (() => {
    try {
      const p = JSON.parse(product.previewImageUrl);
      if (Array.isArray(p)) {
        const img = p.find((f: any) => f.type === "image" || f.type === "animated");
        return img?.url ?? p[0]?.url ?? "";
      }
    } catch {}
    return product.previewImageUrl || getImageForProduct(product.id, product.category);
  })();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
      <Link href={`/products/${product.id}`}>
        <div className="group border border-red-900/30 bg-card hover:border-red-600/60 lava-pulse transition-all duration-300 overflow-hidden cursor-pointer">
          <div className="aspect-[3/4] overflow-hidden protected-media"
            onContextMenu={e => e.preventDefault()}>
            <div className="wm" />
            <img src={imgSrc} alt={product.title} draggable={false}
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

