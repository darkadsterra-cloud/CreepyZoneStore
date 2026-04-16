import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useGetMe, useGetCart } from "@workspace/api-client-react";
import { ShoppingCart, User, LogOut, ChevronDown, Search, X, Wrench } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useRef, useEffect } from "react";
import logoImg from "@assets/WhatsApp-Image-2026-04-05-at-2.43.53-PM_1775551028444.jpg";
import { useAuthModal } from "@/App";

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

const TOOLS = [
  {
    label: "Horror Animation Studio",
    icon: "🎭",
    desc: "Livestream overlay generator",
    url: "https://horror-animation-studio-ch2eau0cz-darkadsterra-1219s-projects.vercel.app",
  },
];

export function Navbar() {
  const { isAuthenticated, setToken } = useAuth();
  const { data: user } = useGetMe({ query: { enabled: isAuthenticated, queryKey: ["/api/auth/me"] } });
  const { data: cart } = useGetCart({ query: { enabled: isAuthenticated, queryKey: ["/api/cart"] } });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDesktop, setIsDesktop] = useState(false);
  const catalogRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();
  const { openAuthModal } = useAuthModal();

  const cartItemsCount = cart?.items?.length || 0;

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", () => setTimeout(check, 100));
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (catalogRef.current && !catalogRef.current.contains(e.target as Node)) setCatalogOpen(false);
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) setToolsOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [searchOpen]);

  useEffect(() => {
    if (isDesktop) { setMobileOpen(false); setSearchOpen(false); }
  }, [isDesktop]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      setLocation(`/products?search=${encodeURIComponent(q)}`);
      setSearchOpen(false);
      setSearchQuery("");
      setMobileOpen(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-red-900/30 bg-black/90 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
          <img src={logoImg} alt="CreepyZone Logo"
            className="w-10 h-10 rounded-full object-cover border border-purple-700/50 group-hover:border-purple-400 transition-all" />
          <span className="font-creepster text-xl neon-text tracking-wider hidden sm:block">CreepyZone Store</span>
        </Link>

        {/* Desktop Nav */}
        {isDesktop && (
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-gray-300 hover:text-red-500 hover-glitch transition-colors uppercase tracking-widest text-sm font-semibold">
              Home
            </Link>
            <Link href="/about" className="text-gray-300 hover:text-red-500 hover-glitch transition-colors uppercase tracking-widest text-sm font-semibold">
              About
            </Link>

            {/* Catalog Dropdown */}
            <div ref={catalogRef} className="relative">
              <button onClick={() => { setCatalogOpen(!catalogOpen); setToolsOpen(false); }}
                className="flex items-center gap-1 text-gray-300 hover:text-red-500 transition-colors uppercase tracking-widest text-sm font-semibold">
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
                        <Link key={cat.slug} href={`/products?category=${cat.slug}`}
                          onClick={() => setCatalogOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white hover:bg-red-950/20 transition-colors">
                          <span className="text-sm">{cat.icon}</span>
                          <span className="text-xs uppercase tracking-wider">{cat.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Featured Tools Dropdown */}
            <div ref={toolsRef} className="relative">
              <button onClick={() => { setToolsOpen(!toolsOpen); setCatalogOpen(false); }}
                className="flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-widest text-sm font-semibold border border-purple-800/40 px-3 py-1">
                <Wrench className="w-3 h-3" />
                Tools <ChevronDown className={`w-3 h-3 transition-transform ${toolsOpen ? "rotate-180" : ""}`} />
              </button>
              {toolsOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-80 border border-purple-900/40 bg-black/95 backdrop-blur-md shadow-2xl"
                  style={{ boxShadow: "0 0 30px rgba(120,0,180,0.15)" }}>
                  <div className="p-2">
                    <p className="text-purple-500 text-xs uppercase tracking-widest font-bold px-4 py-2 border-b border-purple-900/20 mb-1">
                      ⚡ Featured Tools
                    </p>
                    {TOOLS.map((tool, i) => (
                      <a key={i} href={tool.url} target="_blank" rel="noopener noreferrer"
                        onClick={() => setToolsOpen(false)}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-purple-950/20 transition-colors group">
                        <span className="text-2xl">{tool.icon}</span>
                        <div>
                          <p className="text-white text-sm font-bold group-hover:text-purple-300 transition-colors">{tool.label}</p>
                          <p className="text-gray-600 text-xs mt-0.5">{tool.desc}</p>
                        </div>
                        <span className="ml-auto text-purple-600 text-xs uppercase tracking-widest self-center">Open →</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search Bar desktop */}
        {isDesktop && (
          <div className="flex-1 max-w-xs">
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <div className="flex-1 flex items-center border border-red-600/60 bg-black/80">
                  <Search className="w-4 h-4 text-red-500 mx-3 flex-shrink-0" />
                  <input ref={searchRef} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="flex-1 bg-transparent py-2 pr-3 text-white text-sm outline-none placeholder-gray-600" />
                  <button type="button" onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                    className="px-2 text-gray-600 hover:text-red-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ) : (
              <button onClick={() => setSearchOpen(true)}
                className="w-full flex items-center gap-3 border border-red-900/20 hover:border-red-700/40 px-3 py-2 text-gray-600 hover:text-gray-400 transition-all text-sm">
                <Search className="w-4 h-4" />
                <span className="text-xs uppercase tracking-widest">Search products...</span>
              </button>
            )}
          </div>
        )}

        {/* Right Side */}
        <div className="flex items-center space-x-3">
          {!isDesktop && (
            <button onClick={() => setSearchOpen(!searchOpen)}
              className="text-gray-400 hover:text-red-500 transition-colors">
              <Search className="w-5 h-5" />
            </button>
          )}

          <Link href="/cart" className="relative text-gray-300 hover:text-red-500 transition-colors">
            <ShoppingCart className="w-6 h-6" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {cartItemsCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center space-x-2">
              <Link href="/orders" className="text-gray-300 hover:text-red-500 transition-colors">
                <User className="w-5 h-5" />
              </Link>
              {user?.role === "admin" && (
                <Link href="/admin"
                  className="text-purple-400 hover:text-purple-300 text-xs uppercase tracking-widest font-bold border border-purple-800/40 px-2 py-1">
                  Admin
                </Link>
              )}
              <button onClick={() => setToken(null)} className="text-gray-500 hover:text-red-500 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => openAuthModal("register")}
              className="border-red-900/50 text-red-500 hover:bg-red-950/30 hover:text-red-400 uppercase tracking-widest font-bold text-xs">
              Enter
            </Button>
          )}

          {!isDesktop && (
            <button className="text-gray-400 hover:text-red-500 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}>
              <div className="w-5 space-y-1.5">
                <div className={`h-0.5 bg-current transition-all ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
                <div className={`h-0.5 bg-current transition-all ${mobileOpen ? "opacity-0" : ""}`} />
                <div className={`h-0.5 bg-current transition-all ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Mobile search bar */}
      {!isDesktop && searchOpen && (
        <div className="border-t border-red-900/20 bg-black/95 px-4 py-3">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="flex-1 flex items-center border border-red-600/60 bg-black/80">
              <Search className="w-4 h-4 text-red-500 mx-3 flex-shrink-0" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search products..." autoFocus
                className="flex-1 bg-transparent py-2.5 pr-3 text-white text-sm outline-none placeholder-gray-600" />
            </div>
            <button type="submit"
              className="px-4 py-2.5 bg-red-700 text-white text-xs uppercase tracking-widest font-bold border border-red-500">
              Go
            </button>
          </form>
        </div>
      )}

      {/* Mobile Menu */}
      {!isDesktop && mobileOpen && (
        <div className="border-t border-red-900/20 bg-black/95 px-4 py-4">
          <Link href="/" onClick={() => setMobileOpen(false)}
            className="block text-gray-300 hover:text-red-500 uppercase tracking-widest text-sm font-semibold py-2 border-b border-red-900/10">
            Home
          </Link>
          <Link href="/about" onClick={() => setMobileOpen(false)}
            className="block text-gray-300 hover:text-red-500 uppercase tracking-widest text-sm font-semibold py-2 border-b border-red-900/10">
            About
          </Link>
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
          <div className="py-2 border-b border-red-900/10">
            <p className="text-purple-500 text-xs uppercase tracking-widest font-bold mb-2">⚡ Featured Tools</p>
            {TOOLS.map((tool, i) => (
              <a key={i} href={tool.url} target="_blank" rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 text-purple-400 hover:text-white py-1.5 text-xs uppercase tracking-wider">
                <span>{tool.icon}</span>{tool.label}
              </a>
            ))}
          </div>
          {!isAuthenticated && (
            <button onClick={() => { setMobileOpen(false); openAuthModal("register"); }}
              className="w-full mt-3 py-3 bg-red-700 text-white font-bold uppercase tracking-widest text-sm border border-red-500">
              Join The Darkness
            </button>
          )}
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
