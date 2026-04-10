import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, EyeOff } from "lucide-react";
import { useLogin, useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register";
}

export function AuthModal({ isOpen, onClose, defaultTab = "register" }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "register">(defaultTab);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { setToken } = useAuth();
  const { toast } = useToast();
  const login = useLogin();
  const register = useRegister();

  const reset = () => {
    setEmail(""); setUsername(""); setPassword(""); setShowPassword(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await login.mutateAsync({ data: { email, password } });
      setToken(result.token);
      toast({ title: "Welcome back", description: `Entered as ${result.user.username}` });
      handleClose();
    } catch {
      toast({ title: "Access denied", description: "Invalid email or password.", variant: "destructive" });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await register.mutateAsync({ data: { email, username, password } });
      setToken(result.token);
      toast({ title: "Welcome to the darkness", description: `Account created for ${result.user.username}` });
      handleClose();
    } catch {
      toast({ title: "Registration failed", description: "Email may already be in use.", variant: "destructive" });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          onClick={handleClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md border border-red-900/40 bg-[#0a0000] z-10 overflow-hidden"
            style={{ boxShadow: "0 0 60px rgba(180,0,0,0.2)" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Decorative corners */}
            <div className="absolute top-0 left-0 w-12 h-12 border-r border-b border-red-700/50 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-l border-t border-red-700/50 pointer-events-none" />

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-600 hover:text-red-500 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Tabs */}
            <div className="flex border-b border-red-900/30">
              <button
                onClick={() => { setTab("register"); reset(); }}
                className={`flex-1 py-4 text-xs uppercase tracking-widest font-bold transition-all ${
                  tab === "register"
                    ? "text-white bg-red-700/20 border-b-2 border-red-500"
                    : "text-gray-600 hover:text-gray-400"
                }`}
              >
                Join the Darkness
              </button>
              <button
                onClick={() => { setTab("login"); reset(); }}
                className={`flex-1 py-4 text-xs uppercase tracking-widest font-bold transition-all ${
                  tab === "login"
                    ? "text-white bg-red-700/20 border-b-2 border-red-500"
                    : "text-gray-600 hover:text-gray-400"
                }`}
              >
                Enter the Lair
              </button>
            </div>

            <div className="p-8">
              <div className="text-center mb-6">
                <h2 className="font-creepster text-3xl text-white neon-text">
                  {tab === "register" ? "Create Account" : "Welcome Back"}
                </h2>
                <p className="text-gray-600 text-xs uppercase tracking-widest mt-1">
                  {tab === "register" ? "Join thousands of dark streamers" : "Login to access your collection"}
                </p>
              </div>

              <AnimatePresence mode="wait">
                {tab === "register" ? (
                  <motion.form key="register"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.15 }}
                    onSubmit={handleRegister}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs text-red-500 uppercase tracking-widest mb-1.5">Email</label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                        className="w-full px-4 py-3 bg-black/60 border border-red-900/30 focus:border-red-600 outline-none text-white transition-colors text-sm"
                        placeholder="your@email.com" />
                    </div>
                    <div>
                      <label className="block text-xs text-red-500 uppercase tracking-widest mb-1.5">Username</label>
                      <input type="text" value={username} onChange={e => setUsername(e.target.value)} required
                        className="w-full px-4 py-3 bg-black/60 border border-red-900/30 focus:border-red-600 outline-none text-white transition-colors text-sm"
                        placeholder="darkstreamer" />
                    </div>
                    <div>
                      <label className="block text-xs text-red-500 uppercase tracking-widest mb-1.5">Password</label>
                      <div className="relative">
                        <input type={showPassword ? "text" : "password"} value={password}
                          onChange={e => setPassword(e.target.value)} required minLength={6}
                          className="w-full px-4 py-3 bg-black/60 border border-red-900/30 focus:border-red-600 outline-none text-white transition-colors text-sm pr-12"
                          placeholder="••••••••" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-red-500 transition-colors">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <button type="submit" disabled={register.isPending}
                      className="w-full py-4 bg-red-700 hover:bg-red-600 text-white font-bold uppercase tracking-[0.3em] lava-pulse border border-red-500 transition-all disabled:opacity-50 mt-2">
                      {register.isPending ? "Creating..." : "Create Account"}
                    </button>
                    <p className="text-center text-gray-600 text-xs">
                      Already a soul?{" "}
                      <button type="button" onClick={() => { setTab("login"); reset(); }}
                        className="text-red-500 hover:text-red-400 uppercase tracking-widest">
                        Enter the lair
                      </button>
                    </p>
                  </motion.form>
                ) : (
                  <motion.form key="login"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.15 }}
                    onSubmit={handleLogin}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs text-red-500 uppercase tracking-widest mb-1.5">Email</label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                        className="w-full px-4 py-3 bg-black/60 border border-red-900/30 focus:border-red-600 outline-none text-white transition-colors text-sm"
                        placeholder="your@email.com" />
                    </div>
                    <div>
                      <label className="block text-xs text-red-500 uppercase tracking-widest mb-1.5">Password</label>
                      <div className="relative">
                        <input type={showPassword ? "text" : "password"} value={password}
                          onChange={e => setPassword(e.target.value)} required
                          className="w-full px-4 py-3 bg-black/60 border border-red-900/30 focus:border-red-600 outline-none text-white transition-colors text-sm pr-12"
                          placeholder="••••••••" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-red-500 transition-colors">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <button type="submit" disabled={login.isPending}
                      className="w-full py-4 bg-red-700 hover:bg-red-600 text-white font-bold uppercase tracking-[0.3em] lava-pulse border border-red-500 transition-all disabled:opacity-50 mt-2">
                      {login.isPending ? "Entering..." : "Enter"}
                    </button>
                    <p className="text-center text-gray-600 text-xs">
                      New soul?{" "}
                      <button type="button" onClick={() => { setTab("register"); reset(); }}
                        className="text-red-500 hover:text-red-400 uppercase tracking-widest">
                        Join the darkness
                      </button>
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
