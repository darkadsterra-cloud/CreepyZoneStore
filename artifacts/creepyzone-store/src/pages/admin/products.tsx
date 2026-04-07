import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useListProducts, useDeleteProduct, useCreateProduct, useGetMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Trash2, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = ["overlay", "alert", "bundle", "asset", "pack"] as const;

export default function AdminProducts() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", price: 0, category: "overlay" as typeof CATEGORIES[number],
    previewImageUrl: "", downloadFileName: "", featured: false, previewVideoUrl: null as string | null,
  });

  const { data: me } = useGetMe({ query: { enabled: isAuthenticated } });
  const { data, isLoading } = useListProducts({}, { query: { enabled: isAuthenticated && me?.role === "admin" } });
  const deleteProduct = useDeleteProduct();
  const createProduct = useCreateProduct();

  const products = data?.products ?? [];

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteProduct.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product deleted" });
    } catch {
      toast({ title: "Error", description: "Could not delete.", variant: "destructive" });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProduct.mutateAsync({ data: { ...form, price: Number(form.price) } });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product created" });
      setShowForm(false);
      setForm({ title: "", description: "", price: 0, category: "overlay", previewImageUrl: "", downloadFileName: "", featured: false, previewVideoUrl: null });
    } catch {
      toast({ title: "Error", description: "Could not create product.", variant: "destructive" });
    }
  };

  if (!isAuthenticated || (me && me.role !== "admin")) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="font-creepster text-4xl text-red-500">Access Denied</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <p className="text-red-500 uppercase tracking-[0.5em] text-xs mb-2">Control Center</p>
            <h1 className="font-creepster text-4xl text-white">Manage Products</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-6 py-3 bg-red-700 hover:bg-red-600 text-white font-bold uppercase tracking-widest text-sm border border-red-500 lava-pulse transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>

        {/* Admin Nav */}
        <div className="flex gap-4 mb-8">
          <Link href="/admin">
            <button className="px-6 py-2 border border-red-900/30 text-gray-400 hover:border-red-700/50 hover:text-red-400 font-bold uppercase tracking-widest text-sm transition-all">
              Dashboard
            </button>
          </Link>
          <Link href="/admin/products">
            <button className="px-6 py-2 bg-red-700 border border-red-500 text-white font-bold uppercase tracking-widest text-sm">
              Products
            </button>
          </Link>
        </div>

        {/* Create Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-red-900/40 bg-card p-6 mb-8 relative"
          >
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-500 hover:text-red-500">
              <X className="w-5 h-5" />
            </button>
            <h2 className="font-creepster text-2xl text-white mb-6">New Product</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-red-500 uppercase tracking-widest mb-1">Title</label>
                <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required
                  className="w-full px-3 py-2 bg-background border border-red-900/30 focus:border-red-600 outline-none text-white" />
              </div>
              <div>
                <label className="block text-xs text-red-500 uppercase tracking-widest mb-1">Price ($)</label>
                <input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({...f, price: parseFloat(e.target.value)}))} required
                  className="w-full px-3 py-2 bg-background border border-red-900/30 focus:border-red-600 outline-none text-white" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-red-500 uppercase tracking-widest mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} required rows={3}
                  className="w-full px-3 py-2 bg-background border border-red-900/30 focus:border-red-600 outline-none text-white resize-none" />
              </div>
              <div>
                <label className="block text-xs text-red-500 uppercase tracking-widest mb-1">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value as any}))}
                  className="w-full px-3 py-2 bg-background border border-red-900/30 focus:border-red-600 outline-none text-white">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-red-500 uppercase tracking-widest mb-1">Download Filename</label>
                <input value={form.downloadFileName} onChange={e => setForm(f => ({...f, downloadFileName: e.target.value}))} required
                  placeholder="product-name.zip"
                  className="w-full px-3 py-2 bg-background border border-red-900/30 focus:border-red-600 outline-none text-white" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-red-500 uppercase tracking-widest mb-1">Preview Image URL</label>
                <input value={form.previewImageUrl} onChange={e => setForm(f => ({...f, previewImageUrl: e.target.value}))} required
                  className="w-full px-3 py-2 bg-background border border-red-900/30 focus:border-red-600 outline-none text-white" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="featured" checked={form.featured} onChange={e => setForm(f => ({...f, featured: e.target.checked}))}
                  className="w-4 h-4 accent-red-500" />
                <label htmlFor="featured" className="text-xs text-gray-400 uppercase tracking-widest">Featured</label>
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button type="submit" disabled={createProduct.isPending}
                  className="px-8 py-3 bg-red-700 hover:bg-red-600 text-white font-bold uppercase tracking-widest text-sm border border-red-500 disabled:opacity-50">
                  {createProduct.isPending ? "Creating..." : "Create Product"}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Products Table */}
        {isLoading ? (
          <div className="text-red-500 text-center py-20 font-creepster text-2xl animate-pulse">Loading...</div>
        ) : (
          <div className="border border-red-900/30 bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-red-900/20">
                  <th className="px-4 py-3 text-left text-xs text-red-500 uppercase tracking-widest">Product</th>
                  <th className="px-4 py-3 text-left text-xs text-red-500 uppercase tracking-widest hidden md:table-cell">Category</th>
                  <th className="px-4 py-3 text-left text-xs text-red-500 uppercase tracking-widest">Price</th>
                  <th className="px-4 py-3 text-left text-xs text-red-500 uppercase tracking-widest hidden sm:table-cell">Featured</th>
                  <th className="px-4 py-3 text-right text-xs text-red-500 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-900/10">
                {products.map(product => (
                  <tr key={product.id} className="hover:bg-red-950/10 transition-colors">
                    <td className="px-4 py-3 text-white font-bold">{product.title}</td>
                    <td className="px-4 py-3 text-gray-400 hidden md:table-cell uppercase text-xs">{product.category}</td>
                    <td className="px-4 py-3 text-red-400 font-bold">${product.price.toFixed(2)}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`text-xs ${product.featured ? "text-green-400" : "text-gray-600"}`}>
                        {product.featured ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
