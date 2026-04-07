import { motion } from "framer-motion";
import { Link } from "wouter";
import { Layers, Zap, Package, Shield, Download, Star } from "lucide-react";
import logoImg from "@assets/WhatsApp-Image-2026-04-05-at-2.43.53-PM_1775551028444.jpg";

const FEATURES = [
  {
    icon: Layers,
    title: "Stream Overlays",
    desc: "Fully animated, horror-themed overlays designed for OBS Studio, Streamlabs, and XSplit. Set the perfect dark atmosphere for your audience.",
  },
  {
    icon: Zap,
    title: "Animated Alerts",
    desc: "Terrify your viewers with blood-dripping follower alerts, jump-scare sub notifications, and spine-chilling donation animations.",
  },
  {
    icon: Package,
    title: "Complete Bundles",
    desc: "Everything you need in one dark package — overlays, alerts, panels, and more. The ultimate setup for horror streamers.",
  },
  {
    icon: Download,
    title: "Instant Download",
    desc: "Purchase once, download immediately. All files are delivered digitally right after checkout — no waiting, no hassle.",
  },
  {
    icon: Shield,
    title: "Commercial License",
    desc: "Full commercial streaming rights included with every purchase. Use on Twitch, YouTube, TikTok, Kick, and all major platforms.",
  },
  {
    icon: Star,
    title: "OBS Compatible",
    desc: "Every product is built to work flawlessly with OBS Studio, Streamlabs OBS, XSplit, and browser-source-supported software.",
  },
];

export default function About() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-24 px-4 text-center border-b border-red-900/20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/10 to-transparent pointer-events-none" />
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <img
            src={logoImg}
            alt="CreepyZone"
            className="w-32 h-32 rounded-full object-cover mx-auto mb-6 border-2 border-purple-700/60"
            style={{ boxShadow: "0 0 30px rgba(128,0,255,0.4)" }}
          />
          <p className="text-red-500 uppercase tracking-[0.5em] text-xs mb-3">Who We Are</p>
          <h1 className="font-creepster text-5xl md:text-7xl text-white neon-text mb-6">CreepyZone Store</h1>
          <p className="text-gray-400 text-lg max-w-3xl mx-auto leading-relaxed">
            The darkest corner of the streaming world. We craft premium horror-grade digital assets — overlays, alerts, 
            and stream packs — for content creators who dare to stream in the shadows.
          </p>
        </motion.div>
      </section>

      {/* Story */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
          >
            <div>
              <p className="text-red-500 uppercase tracking-[0.5em] text-xs mb-3">Our Story</p>
              <h2 className="font-creepster text-4xl text-white mb-6">Born from the Dark</h2>
              <p className="text-gray-400 leading-relaxed mb-4">
                CreepyZone Store was founded in 2024 by a team of dark-arts designers and veteran streamers who 
                felt the horror streaming community deserved better. Most stream asset stores are bright, 
                poppy, and generic — we built the opposite.
              </p>
              <p className="text-gray-400 leading-relaxed mb-4">
                Every product we create is hand-crafted for maximum atmospheric impact. From blood-dripping alerts 
                to fog-filled overlays, we design every pixel with horror in mind.
              </p>
              <p className="text-gray-400 leading-relaxed">
                Whether you stream horror games, true crime content, or just want a darker aesthetic, 
                CreepyZone Store is your one-stop shop for the perfect spooky setup.
              </p>
            </div>
            <div className="border border-red-900/30 p-6 bg-card relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-r border-b border-red-700/50" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-l border-t border-red-700/50" />
              <div className="space-y-4">
                {[
                  { label: "Products Available", value: "50+" },
                  { label: "Happy Streamers", value: "1,000+" },
                  { label: "Platforms Supported", value: "All Major" },
                  { label: "Founded", value: "2024" },
                ].map(stat => (
                  <div key={stat.label} className="flex justify-between items-center border-b border-red-900/20 pb-3 last:border-0">
                    <span className="text-gray-500 text-sm uppercase tracking-widest">{stat.label}</span>
                    <span className="font-creepster text-2xl text-red-400">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 border-t border-red-900/20 bg-gradient-to-b from-red-950/5 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-red-500 uppercase tracking-[0.5em] text-xs mb-3">What We Offer</p>
            <h2 className="font-creepster text-4xl text-white">Everything for the Dark Streamer</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="border border-red-900/30 bg-card p-6 hover:border-red-600/50 lava-pulse transition-all"
              >
                <feature.icon className="w-8 h-8 text-red-500 mb-4" />
                <h3 className="font-bold text-white mb-2 uppercase tracking-widest text-sm">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-red-500 uppercase tracking-[0.5em] text-xs mb-3">How It Works</p>
          <h2 className="font-creepster text-4xl text-white mb-12">Simple as Darkness</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Browse", desc: "Explore our catalog of dark overlays, alerts, bundles, and assets." },
              { step: "02", title: "Purchase", desc: "Add items to cart and complete your secure checkout in seconds." },
              { step: "03", title: "Download", desc: "Access your files instantly from My Orders and import into OBS." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="text-center"
              >
                <div className="font-creepster text-6xl text-red-900/50 mb-4">{item.step}</div>
                <h3 className="font-bold text-white text-lg mb-2 uppercase tracking-widest">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 border-t border-red-900/20 bg-red-950/10 text-center">
        <h2 className="font-creepster text-4xl text-white mb-4 neon-text">Ready to Enter the Dark?</h2>
        <p className="text-gray-500 mb-8">Join thousands of horror streamers who chose the darkness.</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/products">
            <button className="px-10 py-3 bg-red-700 hover:bg-red-600 text-white font-bold uppercase tracking-widest border border-red-500 lava-pulse transition-all">
              Shop Now
            </button>
          </Link>
          <Link href="/register">
            <button className="px-10 py-3 border border-red-900/50 text-red-400 hover:bg-red-950/30 font-bold uppercase tracking-widest transition-all">
              Create Account
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
