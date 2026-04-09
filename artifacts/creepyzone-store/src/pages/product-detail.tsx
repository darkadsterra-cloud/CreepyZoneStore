import { useState } from "react";
import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { useGetProduct, useAddToCart, useGetCart } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { ShoppingCart, ArrowLeft, Download, Star, ChevronLeft, ChevronRight, Music, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getImageForProduct } from "@/lib/store-images";

type MediaFile = { url: string; name: string; type: "image" | "video" | "audio" | "animated" };

function parseMedia(raw: string, fallback: string): MediaFile[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  if (raw) return [{ url: raw, name: "preview", type: "image" }];
  if (fallback) return [{ url: fallback, name: "preview", type: "image" }];
  return [];
}

function MediaThumb({ file, active, onClick }: { file: MediaFile; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-16 h-16 flex-shrink-0 border-2 overflow-hidden transition-all ${active ? "border-red-500" : "border-red-900/30 hover:border-red-700/60"}`}
    >
      {file.type === "image" || file.type === "animated" ? (
        <img src={file.url} alt="" className="w-full h-full object-cover" />
      ) : file.type === "video" ? (
        <div className="w-full h-full bg-black flex items-center justify-center">
          <Video className="w-5 h-5 text-blue-400" />
        </div>
      ) : (
        <div className="w-full h-full bg-black flex items-center justify-center">
          <Music className="w-5 h-5 text-purple-400" />
        </div>
      )}
    </button>
  );
}

function MediaViewer({ files }: { files: MediaFile[] }) {
  const [index, setIndex] = useState(0);
  const current = files[index];
  if (!current) return null;

  const prev = () => setIndex(i => (i - 1 + files.length) % files.length);
  const next = () => setIndex(i => (i + 1) % files.length);

  return (
    <div className="space-y-3">
      <div className="relative aspect-[3/4] border border-red-900/30 bg-black overflow-hidden">
        {current.type === "image" || current.type === "animated" ? (
          <img src={current.url} alt="" className="w-full h-full object-cover" />
        ) : current.type === "video" ? (
          <video src={current.url} controls autoPlay loop muted className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-black/80">
            <Music className="w-16 h-16 text-purple-400" />
            <p className="text-gray-400 text-sm">{current.name}</p>
            <audio src={current.url} controls className="w-3/4" />
          </div>
        )}
        {files.length > 1 && (
          <>
            <button onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-red-900/70 text-white p-1.5 transition-all">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-red-900/70 text-white p-1.5 transition-all">
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-2 right-2 bg-black/70 text-xs text-gray-300 px-2 py-1">
              {index + 1} / {files.length}
            </div>
          </>
        )}
      </div>
      {files.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {files.map((f, i) => (
            <MediaThumb key={i} file={f} active={i === index} onClick={() => setIndex(i)} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductDetail() {
  const [, params] = useRoute("/products/:id");
  const id = parseInt(params?.id ?? "0");
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useGetProduct(id, { query: { enabled: !!id } });
  const { data: cart } = useGetCart({ query: { enabled: isAuthenticated } });
  const addToCart = useAddToCart();

  const inCart = cart?.items?.some(i => i.productId === id) ?? false;

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast({ title: "Login required", description: "Please login to purchase.", variant: "destructive" });
      return;
    }
    try {
      await addToCart.mutateAsync({ data: { productId: id } });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({ title: "Added to cart", description: "Item added to your cart." });
    } catch {
      toast({ title: "Error", description: "Could not add to cart.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 font-creepster text-2xl neon-text animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="font-creepster text-4xl text-white">Product Not Found</h1>
        <Link href="/products">
          <button className="text-red-500 border border-red-900/50 px-6 py-2 hover:bg-red-950/30">Back to Catalog</button>
        </Link>
      </div>
    );
  }

  const fallback = getImageForProduct(product.id, product.category);
  const mediaFiles = parseMedia(product.previewImageUrl, fallback);

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <Link href="/products">
          <button className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors mb-8 uppercase tracking-widest text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Catalog
          </button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="relative">
            <MediaViewer files={mediaFiles} />
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-red-700 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="font-creepster text-white text-2xl">${product.price.toFixed(0)}</div>
                <div className="text-red-200 text-xs">.{String(Math.round((product.price % 1) * 100)).padStart(2, "0")}</div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col justify-center">
            <span className="text-red-500 uppercase tracking-[0.5em] text-xs mb-3">{product.category}</span>
            <h1 className="font-creepster text-5xl text-white mb-6 hover-glitch cursor-default">{product.title}</h1>

            <div className="flex items-center gap-2 mb-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 text-red-500 fill-current" />
              ))}
              <span className="text-gray-500 text-sm ml-2">Horror-rated</span>
            </div>

            <p className="text-gray-400 leading-relaxed mb-8 text-lg">{product.description}</p>

            {mediaFiles.length > 1 && (
              <div className="flex gap-2 mb-6 flex-wrap">
                {[
                  { type: "image", label: "Images", color: "text-gray-300 border-gray-700" },
                  { type: "animated", label: "GIFs", color: "text-green-400 border-green-900" },
                  { type: "video", label: "Videos", color: "text-blue-400 border-blue-900" },
                  { type: "audio", label: "Audio", color: "text-purple-400 border-purple-900" },
                ].map(({ type, label, color }) => {
                  const count = mediaFiles.filter(f => f.type === type).length;
                  if (!count) return null;
                  return (
                    <span key={type} className={`text-xs border px-2 py-0.5 ${color}`}>
                      {count} {label}
                    </span>
                  );
                })}
              </div>
            )}

            <div className="border-t border-red-900/20 pt-6 mb-8">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-red-500" />
                  <span>Instant Download</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-red-500" />
                  <span>Secure Purchase</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <span className="font-creepster text-5xl text-red-400">${product.price.toFixed(2)}</span>
            </div>

            {inCart ? (
              <div className="flex gap-4">
                <div className="flex-1 py-4 bg-red-900/20 border border-red-700 text-red-400 text-center font-bold uppercase tracking-widest">In Cart</div>
                <Link href="/cart">
                  <button className="px-6 py-4 border border-red-900/50 text-gray-400 hover:text-white hover:border-red-700 uppercase tracking-widest text-sm transition-all">View Cart</button>
                </Link>
              </div>
            ) : (
              <button onClick={handleAddToCart} disabled={addToCart.isPending}
                className="w-full py-4 bg-red-700 hover:bg-red-600 text-white font-bold uppercase tracking-[0.3em] lava-pulse border border-red-500 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                <ShoppingCart className="w-5 h-5" />
                {addToCart.isPending ? "Adding..." : "Add to Cart"}
              </button>
            )}

            {!isAuthenticated && (
              <p className="text-gray-600 text-sm text-center mt-4">
                <Link href="/login" className="text-red-500 hover:underline">Login</Link> to purchase
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
