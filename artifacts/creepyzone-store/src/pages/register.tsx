import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { setToken } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const register = useRegister();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await register.mutateAsync({ data: { email, username, password } });
      setToken(result.token);
      toast({ title: "Welcome to the darkness", description: `Account created for ${result.user.username}` });
      setLocation("/");
    } catch {
      toast({ title: "Registration failed", description: "Email may already be in use.", variant: "destructive" });
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
          <div className="absolute top-0 left-0 w-16 h-16 border-r border-b border-red-700/50" />
          <div className="absolute bottom-0 right-0 w-16 h-16 border-l border-t border-red-700/50" />

          <div className="text-center mb-8">
            <h1 className="font-creepster text-4xl text-white neon-text mb-2">Join the Darkness</h1>
            <p className="text-gray-500 text-sm uppercase tracking-widest">Create your account</p>
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
              <label className="block text-xs text-red-500 uppercase tracking-widest mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 bg-background border border-red-900/30 focus:border-red-600 outline-none text-white transition-colors"
                placeholder="darkstreamer"
              />
            </div>
            <div>
              <label className="block text-xs text-red-500 uppercase tracking-widest mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-background border border-red-900/30 focus:border-red-600 outline-none text-white transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={register.isPending}
              className="w-full py-4 bg-red-700 hover:bg-red-600 text-white font-bold uppercase tracking-[0.3em] lava-pulse border border-red-500 transition-all disabled:opacity-50"
            >
              {register.isPending ? "Entering..." : "Create Account"}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-600 text-sm">
            Already a soul?{" "}
            <Link href="/login" className="text-red-500 hover:text-red-400 uppercase tracking-widest">
              Enter the lair
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
