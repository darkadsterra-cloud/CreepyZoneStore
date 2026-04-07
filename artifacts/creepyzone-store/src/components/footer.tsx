import { Link } from "wouter";
import logoImg from "@assets/WhatsApp-Image-2026-04-05-at-2.43.53-PM_1775551028444.jpg";
import { Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-red-900/20 bg-black/80 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <img src={logoImg} alt="CreepyZone" className="w-10 h-10 rounded-full object-cover border border-purple-700/50" />
              <span className="font-creepster text-2xl text-white">CreepyZone Store</span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed mb-4 max-w-xs">
              Premium horror-themed digital assets for streamers. Dark overlays, animated alerts, and 
              terrifying stream packs crafted for the dark side of content creation.
            </p>
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <Mail className="w-4 h-4 text-red-500" />
              <a href="mailto:support@creepyzone.store" className="hover:text-red-400 transition-colors">
                support@creepyzone.store
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-red-500 uppercase tracking-widest text-xs font-bold mb-4">Shop</h3>
            <ul className="space-y-2">
              {[
                { href: "/products", label: "All Products" },
                { href: "/products?category=overlay", label: "Overlays" },
                { href: "/products?category=alert", label: "Alerts" },
                { href: "/products?category=bundle", label: "Bundles" },
                { href: "/products?category=asset", label: "Assets" },
                { href: "/products?category=pack", label: "Packs" },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-500 hover:text-red-400 transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="text-red-500 uppercase tracking-widest text-xs font-bold mb-4">Info</h3>
            <ul className="space-y-2">
              {[
                { href: "/about", label: "About Us" },
                { href: "/login", label: "Login" },
                { href: "/register", label: "Register" },
                { href: "/orders", label: "My Orders" },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-500 hover:text-red-400 transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <h4 className="text-gray-600 text-xs uppercase tracking-widest mb-2">Payment</h4>
              <p className="text-gray-600 text-xs">Payment methods & info managed via Admin Panel.</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-red-900/20 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-xs">
            &copy; 2026 CreepyZone Store. All rights reserved. Built in 2026.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-gray-700 text-xs uppercase tracking-widest">For Streamers. By Streamers.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
