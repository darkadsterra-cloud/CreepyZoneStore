import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useGetMe, useGetCart } from "@workspace/api-client-react";
import { ShoppingCart, User, LogOut, Menu } from "lucide-react";
import { Button } from "./ui/button";

export function Navbar() {
  const { isAuthenticated, setToken } = useAuth();
  const { data: user } = useGetMe({ query: { enabled: isAuthenticated, queryKey: ["/api/auth/me"] } });
  const { data: cart } = useGetCart({ query: { enabled: isAuthenticated, queryKey: ["/api/cart"] } });

  const cartItemsCount = cart?.items?.length || 0;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-red-900/30 bg-black/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-creepster text-3xl neon-text tracking-wider">
          CreepyZone Store
        </Link>

        <div className="hidden md:flex items-center space-x-6">
          <Link href="/products" className="text-gray-300 hover:text-red-500 hover-glitch transition-colors uppercase tracking-widest font-semibold">
            Catalog
          </Link>
          <Link href="/products?category=overlay" className="text-gray-300 hover:text-red-500 hover-glitch transition-colors uppercase tracking-widest font-semibold">
            Overlays
          </Link>
          <Link href="/products?category=alert" className="text-gray-300 hover:text-red-500 hover-glitch transition-colors uppercase tracking-widest font-semibold">
            Alerts
          </Link>
        </div>

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
            <div className="flex items-center space-x-4">
              <Link href="/orders" className="text-gray-300 hover:text-red-500 transition-colors">
                <User className="w-6 h-6" />
              </Link>
              {user?.role === "admin" && (
                <Link href="/admin" className="text-red-500 hover:text-red-400 text-sm uppercase tracking-widest font-bold">
                  Admin
                </Link>
              )}
              <button onClick={() => setToken(null)} className="text-gray-400 hover:text-red-500 transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="outline" className="border-red-900/50 text-red-500 hover:bg-red-950/30 hover:text-red-400 uppercase tracking-widest font-bold">
                Enter
              </Button>
            </Link>
          )}
        </div>
      </div>
      {/* Blood Drips */}
      <div className="absolute bottom-0 w-full overflow-hidden flex justify-around px-10 pointer-events-none h-5">
        {Array.from({ length: 15 }).map((_, i) => (
          <div 
            key={i} 
            className="blood-drip" 
            style={{ 
              left: `${Math.random() * 100}%`, 
              animationDelay: `${Math.random() * 3}s`,
              height: `${10 + Math.random() * 15}px`
            }} 
          />
        ))}
      </div>
    </nav>
  );
}
