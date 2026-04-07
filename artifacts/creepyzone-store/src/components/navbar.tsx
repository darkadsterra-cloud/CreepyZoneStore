import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useGetMe, useGetCart } from "@workspace/api-client-react";
import { ShoppingCart, User, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import logoImg from "@assets/WhatsApp-Image-2026-04-05-at-2.43.53-PM_1775551028444.jpg";

export function Navbar() {
  const { isAuthenticated, setToken } = useAuth();
  const [location] = useLocation();
  const { data: user } = useGetMe({ query: { enabled: isAuthenticated, queryKey: ["/api/auth/me"] } });
  const { data: cart } = useGetCart({ query: { enabled: isAuthenticated, queryKey: ["/api/cart"] } });
  const [mobileOpen, setMobileOpen] = useState(false);

  const cartItemsCount = cart?.items?.length || 0;

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/products", label: "Catalog" },
    { href: "/products?category=overlay", label: "Overlays" },
    { href: "/products?category=alert", label: "Alerts" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-red-900/30 bg-black/90 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <img
            src={logoImg}
            alt="CreepyZone Logo"
            className="w-10 h-10 rounded-full object-cover border border-purple-700/50 group-hover:border-purple-500 transition-all"
          />
          <span className="font-creepster text-2xl neon-text tracking-wider hidden sm:block">
            CreepyZone Store
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center space-x-6">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="text-gray-300 hover:text-red-500 hover-glitch transition-colors uppercase tracking-widest text-sm font-semibold"
            >
              {link.label}
            </Link>
          ))}
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
                <User className="w-6 h-6" />
              </Link>
              {user?.role === "admin" && (
                <Link href="/admin" className="text-purple-400 hover:text-purple-300 text-xs uppercase tracking-widest font-bold border border-purple-800/40 px-2 py-1">
                  Admin
                </Link>
              )}
              <button onClick={() => setToken(null)} className="text-gray-400 hover:text-red-500 transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="outline" className="border-red-900/50 text-red-500 hover:bg-red-950/30 hover:text-red-400 uppercase tracking-widest font-bold text-xs">
                Enter
              </Button>
            </Link>
          )}

          {/* Mobile menu button */}
          <button
            className="lg:hidden text-gray-400 hover:text-red-500 transition-colors ml-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <div className="w-5 space-y-1">
              <div className="h-0.5 bg-current" />
              <div className="h-0.5 bg-current" />
              <div className="h-0.5 bg-current" />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-red-900/20 bg-black/95 px-4 py-4 space-y-3">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block text-gray-300 hover:text-red-500 uppercase tracking-widest text-sm font-semibold py-2"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}

      {/* Blood Drips */}
      <div className="absolute bottom-0 w-full overflow-hidden flex justify-around px-10 pointer-events-none h-5">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="blood-drip"
            style={{
              left: `${(i / 15) * 100}%`,
              animationDelay: `${(i * 0.3) % 3}s`,
              height: `${10 + (i % 3) * 5}px`
            }}
          />
        ))}
      </div>
    </nav>
  );
}
