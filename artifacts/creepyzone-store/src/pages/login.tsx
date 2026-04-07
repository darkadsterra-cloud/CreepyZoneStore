import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { setToken } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const login = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await login.mutateAsync({ data: { email, password } });
      setToken(result.token);
      toast({ title: "Welcome back", description: `Entered as ${result.user.username}` });
      setLocation("/");
    } catch {
      toast({ title: "Access denied", description: "Invalid email or password.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-red-900/40 bg-card p-8 relative overflow-hidden"
        >
          {/* Decorative corner */}
          <div className="absolute top-0 left-0 w-16 h-16 border-r border-b border-red-700/50" />
          <div className="absolute bottom-0 right-0 w-16 h-16 border-l border-t border-red-700/50" />

          <div className="text-center mb-8">
            <h1 className="font-creepster text-4xl text-white neon-text mb-2">Enter the Lair</h1>
            <p className="text-gray-500 text-sm uppercase tracking-widest">Login to access your dark collection</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs text-red-500 uppercase tracking-widest mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-background border border-red-900/30 focus:border-red-600 outline-none text-white transition-colors"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-xs text-red-500 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-background border border-red-900/30 focus:border-red-600 outline-none text-white transition-colors pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-red-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={login.isPending}
              className="w-full py-4 bg-red-700 hover:bg-red-600 text-white font-bold uppercase tracking-[0.3em] lava-pulse border border-red-500 transition-all disabled:opacity-50"
            >
              {login.isPending ? "Entering..." : "Enter"}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-600 text-sm">
            New soul?{" "}
            <Link href="/register" className="text-red-500 hover:text-red-400 uppercase tracking-widest">
              Join the darkness
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
