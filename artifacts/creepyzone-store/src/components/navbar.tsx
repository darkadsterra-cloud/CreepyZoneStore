import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useGetMe, useGetCart } from "@workspace/api-client-react";
import { ShoppingCart, User, LogOut, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useRef, useEffect } from "react";
import logoImg from "@assets/WhatsApp-Image-2026-04-05-at-2.43.53-PM_1775551028444.jpg";

const CATEGORIES = [
  { slug: "animated", label: "Animated Bundles", icon: "🎬" },
  { slug: "neon", label: "Neon / Cyberpunk", icon: "🌐" },
  { slug: "horror", label: "Horror / Jumpscare", icon: "💀" },
  { slug: "anime", label: "Anime / VTuber", icon: "🌸" },
  { slug: "vertical", label: "Vertical / TikTok", icon: "📱" },
  { slug: "interactive", label: "Interactive Overlays", icon: "🎮" },
  { slug: "minimal", label: "Minimal / Clean", icon: "✨" },
  { slug: "grunge", label: "Grunge / Retro / VHS", icon: "📼" },
  { slug: "overlay", label: "All Overlays", icon: "🖼️" },
  { slug: "alert", label: "All Alerts", icon: "⚡" },
  { slug: "bundle", label: "Full Bundles", icon: "📦" },
  { slug: "pack", label: "Sound Packs", icon: "🔊" },
];

export function Navbar() {
  const { isAuthenticated, setToken } = useAuth();
  const { data: user } = useGetMe({ query: { enabled: isAuthenticated, queryKey: ["/api/auth/me"] } });
  const { data: cart } = useGetCart({ query: { enabled: isAuthenticated, queryKey: ["/api/cart"] } });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const catalogRef = useRef<HTMLDivElement>(null);

  const cartItemsCount = cart?.items?.length || 0;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (catalogRef.current && !catalogRef.current.contains(e.target as Node)) {
        setCatalogOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-red-900/30 bg-black/90 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
          <img src={logoImg} alt="CreepyZone Logo"
            className="w-10 h-10 rounded-full object-cover border border-purple-700/50 group-hover:border-purple-400 transition-all" />
          <span className="font-creepster text-xl neon-text tracking-wider hidden sm:block">CreepyZone Store</span>
        </Link>

        {/* Desktop Nav - only 3 links */}
        <div className="hidden lg:flex items-center space-x-8">
          <Link href="/" className="text-gray-300 hover:text-red-500 hover-glitch transition-colors uppercase tracking-widest text-sm font-semibold">
            Home
          </Link>
          <Link href="/about" className="text-gray-300 hover:text-red-500 hover-glitch transition-colors uppercase tracking-widest text-sm font-semibold">
            About
          </Link>

          {/* Catalog dropdown */}
          <div ref={catalogRef} className="relative">
            <button
              onClick={() => setCatalogOpen(!catalogOpen)}
              className="flex items-center gap-1 text-gray-300 hover:text-red-500 transition-colors uppercase tracking-widest text-sm font-semibold"
            >
              Catalog <ChevronDown className={`w-3 h-3 transition-transform ${catalogOpen ? "rotate-180" : ""}`} />
            </button>

            {catalogOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-72 border border-red-900/40 bg-black/95 backdrop-blur-md shadow-2xl"
                style={{ boxShadow: "0 0 30px rgba(180,0,0,0.15)" }}>
                <div className="p-2">
                  <Link href="/products" onClick={() => setCatalogOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-white font-bold hover:bg-red-950/30 transition-colors border-b border-red-900/20 mb-1">
                    <span>🛒</span>
                    <span className="uppercase tracking-widest text-sm">All Products</span>
                  </Link>
                  <div className="grid grid-cols-1 gap-0.5">
                    {CATEGORIES.map(cat => (
                      <Link
                        key={cat.slug}
                        href={`/products?category=${cat.slug}`}
                        onClick={() => setCatalogOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white hover:bg-red-950/20 transition-colors"
                      >
                        <span className="text-sm">{cat.icon}</span>
                        <span className="text-xs uppercase tracking-wider">{cat.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-4">
          <Link href="/cart" className="relative text-gray-300 hover:text-red-500 transition-colors">
            <ShoppingCart className="w-6 h-6" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {cartItemsCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              <Link href="/orders" className="text-gray-300 hover:text-red-500 transition-colors">
                <User className="w-5 h-5" />
              </Link>
              {user?.role === "admin" && (
                <Link href="/admin" className="text-purple-400 hover:text-purple-300 text-xs uppercase tracking-widest font-bold border border-purple-800/40 px-2 py-1">
                  Admin
                </Link>
              )}
              <button onClick={() => setToken(null)} className="text-gray-500 hover:text-red-500 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="outline" className="border-red-900/50 text-red-500 hover:bg-red-950/30 hover:text-red-400 uppercase tracking-widest font-bold text-xs">
                Enter
              </Button>
            </Link>
          )}

          {/* Mobile hamburger */}
          <button className="lg:hidden text-gray-400 hover:text-red-500 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}>
            <div className="w-5 space-y-1.5">
              <div className={`h-0.5 bg-current transition-all ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
              <div className={`h-0.5 bg-current transition-all ${mobileOpen ? "opacity-0" : ""}`} />
              <div className={`h-0.5 bg-current transition-all ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-red-900/20 bg-black/95 px-4 py-4">
          <Link href="/" onClick={() => setMobileOpen(false)} className="block text-gray-300 hover:text-red-500 uppercase tracking-widest text-sm font-semibold py-2 border-b border-red-900/10">Home</Link>
          <Link href="/about" onClick={() => setMobileOpen(false)} className="block text-gray-300 hover:text-red-500 uppercase tracking-widest text-sm font-semibold py-2 border-b border-red-900/10">About</Link>
          <div className="py-2 border-b border-red-900/10">
            <p className="text-red-500 text-xs uppercase tracking-widest font-bold mb-2">Catalog</p>
            <div className="grid grid-cols-2 gap-1">
              {CATEGORIES.map(cat => (
                <Link key={cat.slug} href={`/products?category=${cat.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-gray-400 hover:text-white py-1.5 text-xs uppercase tracking-wider">
                  <span>{cat.icon}</span>{cat.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Blood Drips */}
      <div className="absolute bottom-0 w-full overflow-hidden flex justify-around pointer-events-none h-5">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="blood-drip"
            style={{ left: `${(i / 15) * 100}%`, animationDelay: `${(i * 0.3) % 3}s`, height: `${10 + (i % 3) * 5}px` }} />
        ))}
      </div>
    </nav>
  );
}
