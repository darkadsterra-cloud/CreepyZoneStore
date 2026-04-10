import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ParticleEffects } from "@/components/particle-effects";
import { ChatWidget } from "@/components/chat-widget";
import { AuthModal } from "@/components/auth-modal";
import { useState, createContext, useContext } from "react";
import Home from "@/pages/home";
import About from "@/pages/about";
import Products from "@/pages/products";
import ProductDetail from "@/pages/product-detail";
import Cart from "@/pages/cart";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Orders from "@/pages/orders";
import OrderDetail from "@/pages/order-detail";
import AdminDashboard from "@/pages/admin/index";
import AdminProducts from "@/pages/admin/products";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

// Global auth modal context
interface AuthModalContextType {
  openAuthModal: (tab?: "login" | "register") => void;
}
export const AuthModalContext = createContext<AuthModalContextType>({ openAuthModal: () => {} });
export const useAuthModal = () => useContext(AuthModalContext);

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/products" component={Products} />
      <Route path="/products/:id" component={ProductDetail} />
      <Route path="/cart" component={Cart} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/orders" component={Orders} />
      <Route path="/orders/:id" component={OrderDetail} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">("register");

  const openAuthModal = (tab: "login" | "register" = "register") => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <AuthModalContext.Provider value={{ openAuthModal }}>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <div className="min-h-screen bg-background flex flex-col">
                <ParticleEffects />
                <Navbar />
                <main className="flex-1">
                  <Router />
                </main>
                <Footer />
                <ChatWidget />
                <AuthModal
                  isOpen={authModalOpen}
                  onClose={() => setAuthModalOpen(false)}
                  defaultTab={authModalTab}
                />
              </div>
            </WouterRouter>
            <Toaster />
          </AuthModalContext.Provider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
