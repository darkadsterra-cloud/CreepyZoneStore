import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useListProducts, useDeleteProduct, useCreateProduct, useUpdateProduct, useGetMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Trash2, Plus, X, Pencil, ChevronDown, ChevronUp, Star, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = ["overlay", "alert", "bundle", "asset", "pack"] as const;
type Category = typeof CATEGORIES[number];

interface ProductForm {
  title: string;
  description: string;
  price: number;
  category: Category;
  previewImageUrl: string;
  downloadFileName: string;
  featured: boolean;
  previewVideoUrl: string;
}

const EMPTY_FORM: ProductForm = {
  title: "", description: "", price: 9.99, category: "overlay",
  previewImageUrl: "", downloadFileName: "", featured: false, previewVideoUrl: "",
};

export default function AdminProducts() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: me } = useGetMe({ query: { enabled: isAuthenticated } });
  const { data, isLoading } = useListProducts({}, { query: { enabled: isAuthenticated && me?.role === "admin" } });
  const deleteProduct = useDeleteProduct();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const products = data?.products ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/products"] });

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deleteProduct.mutateAsync({ id });
      invalidate();
      toast({ title: "Product deleted" });
    } catch {
      toast({ title: "Error", description: "Could not delete.", variant: "destructive" });
    }
  };

  const startEdit = (product: any) => {
    setEditingId(product.id);
    setForm({
      title: product.title,
      description: product.description,
      price: product.price,
      category: product.category,
      previewImageUrl: product.previewImageUrl ?? "",
      downloadFileName: product.downloadFileName ?? "",
      featured: product.featured,
      previewVideoUrl: product.previewVideoUrl ?? "",
    });
    setShowCreate(false);
  };

  const cancelEdit = () => { setEditingId(null); setForm(EMPTY_FORM); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProduct.mutateAsync({
        data: {
          ...form,
          price: Number(form.price),
          previewVideoUrl: form.previewVideoUrl || null,
        }
      });
      invalidate();
      toast({ title: "Product created" });
      setShowCreate(false);
      setForm(EMPTY_FORM);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Could not create.", variant: "destructive" });
    }
  };

  const handleUpdate = async (id: number, e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProduct.mutateAsync({
        id,
        data: {
          ...form,
          price: Number(form.price),
          previewVideoUrl: form.previewVideoUrl || null,
        }
      });
      invalidate();
      toast({ title: "Product updated" });
      setEditingId(null);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Could not update.", variant: "destructive" });
    }
  };

  const toggleFeatured = async (product: any) => {
    try {
      await updateProduct.mutateAsync({ id: product.id, data: { ...product, featured: !product.featured } });
      invalidate();
      toast({ title: product.featured ? "Removed from featured" : "Added to featured" });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  if (!isAuthenticated || (me && me.role !== "admin")) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="font-creepster text-4xl text-red-500">Access Denied</h1>
        <Link href="/"><button className="text-gray-400 border border-red-900/30 px-6 py-2 hover:bg-red-950/20">Go Home</button></Link>
      </div>
    );
  }

  const FormFields = ({ isUpdate, onSubmit, loading }: { isUpdate?: boolean; onSubmit: (e: React.FormEvent) => void; loading: boolean }) => (
    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <label className="block text-xs text-red-500 uppercase tracking-widest mb-1">Product Title *</label>
        <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required
          placeholder="e.g. Blood Moon Overlay Pack"
          className="w-full px-3 py-2 bg-background border border-red-900/30 focus:border-red-600 outline-none text-white" />
      </div>
      <div className="md:col-span-2">
        <label className="block text-xs text-red-500 uppercase tracking-widest mb-1">Description *</label>
        <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} required rows={4}
          placeholder="Describe what this product includes, compatibility, features, etc."
          className="w-full px-3 py-2 bg-background border border-red-900/30 focus:border-red-600 outline-none text-white resize-none" />
      </div>
      <div>
        <label className="block text-xs text-red-500 uppercase tracking-widest mb-1">Price (USD) *</label>
        <input type="number" step="0.01" min="0.99" value={form.price}
          onChange={e => setForm(f => ({...f, price: parseFloat(e.target.value) || 0}))} required
          className="w-full px-3 py-2 bg-background border border-red-900/30 focus:border-red-600 outline-none text-white" />
      </div>
      <div>
        <label className="block text-xs text-red-500 uppercase tracking-widest mb-1">Category *</label>
        <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value as Category}))}
          className="w-full px-3 py-2 bg-background border border-red-900/30 focus:border-red-600 outline-none text-white">
          {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs text-red-500 uppercase tracking-widest mb-1">Download Filename *</label>
        <input value={form.downloadFileName} onChange={e => setForm(f => ({...f, downloadFileName: e.target.value}))} required
          placeholder="product-name.zip"
          className="w-full px-3 py-2 bg-background border border-red-900/30 focus:border-red-600 outline-none text-white" />
        <p className="text-gray-600 text-xs mt-1">File name customers will receive when downloading</p>
      </div>
      <div>
        <label className="block text-xs text-red-500 uppercase tracking-widest mb-1">Preview Image URL *</label>
        <input value={form.previewImageUrl} onChange={e => setForm(f => ({...f, previewImageUrl: e.target.value}))} required
          placeholder="https://... or leave as store images"
          className="w-full px-3 py-2 bg-background border border-red-900/30 focus:border-red-600 outline-none text-white" />
        <p className="text-gray-600 text-xs mt-1">URL of the product preview image shown to customers</p>
      </div>
      <div>
        <label className="block text-xs text-red-500 uppercase tracking-widest mb-1">Preview Video URL</label>
        <input value={form.previewVideoUrl} onChange={e => setForm(f => ({...f, previewVideoUrl: e.target.value}))}
          placeholder="https://youtube.com/... (optional)"
          className="w-full px-3 py-2 bg-background border border-red-900/30 focus:border-red-600 outline-none text-white" />
      </div>
      <div className="flex items-center gap-3 pt-2">
        <input type="checkbox" id={`featured-${isUpdate ? 'edit' : 'new'}`} checked={form.featured}
          onChange={e => setForm(f => ({...f, featured: e.target.checked}))}
          className="w-4 h-4 accent-red-500" />
        <label htmlFor={`featured-${isUpdate ? 'edit' : 'new'}`} className="text-gray-300 text-sm">
          <span className="text-yellow-500">★</span> Featured product (shown on homepage)
        </label>
      </div>
      <div className="md:col-span-2 flex justify-end gap-3 pt-2 border-t border-red-900/20">
        <button type="button"
          onClick={() => { setShowCreate(false); setEditingId(null); setForm(EMPTY_FORM); }}
          className="px-6 py-2 border border-red-900/30 text-gray-500 hover:text-white transition-all text-sm uppercase tracking-widest">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="px-8 py-2 bg-red-700 hover:bg-red-600 text-white font-bold uppercase tracking-widest text-sm border border-red-500 disabled:opacity-50 lava-pulse">
          {loading ? "Saving..." : isUpdate ? "Update Product" : "Create Product"}
        </button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-end mb-6">
          <div>
            <p className="text-red-500 uppercase tracking-[0.5em] text-xs mb-1">Admin Panel</p>
            <h1 className="font-creepster text-4xl text-white">Product Manager</h1>
          </div>
          <button
            onClick={() => { setShowCreate(!showCreate); setEditingId(null); setForm(EMPTY_FORM); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-700 hover:bg-red-600 text-white font-bold uppercase tracking-widest text-sm border border-red-500 lava-pulse transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>

        {/* Admin Nav */}
        <div className="flex gap-3 mb-8">
          <Link href="/admin"><button className="px-5 py-2 border border-red-900/30 text-gray-400 hover:border-red-700/50 hover:text-red-400 font-bold uppercase tracking-widest text-xs transition-all">Dashboard</button></Link>
          <Link href="/admin/products"><button className="px-5 py-2 bg-red-700 border border-red-500 text-white font-bold uppercase tracking-widest text-xs">Products</button></Link>
        </div>

        {/* Create Form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border border-red-900/40 bg-card p-6 mb-8 relative overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-creepster text-2xl text-white">New Product</h2>
                <button onClick={() => setShowCreate(false)} className="text-gray-600 hover:text-red-500"><X className="w-5 h-5" /></button>
              </div>
              <FormFields onSubmit={handleCreate} loading={createProduct.isPending} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="border border-red-900/20 bg-card p-4 text-center">
            <div className="font-creepster text-3xl text-red-400">{products.length}</div>
            <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Total Products</div>
          </div>
          <div className="border border-yellow-900/20 bg-card p-4 text-center">
            <div className="font-creepster text-3xl text-yellow-500">{products.filter(p => p.featured).length}</div>
            <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Featured</div>
          </div>
          <div className="border border-green-900/20 bg-card p-4 text-center">
            <div className="font-creepster text-3xl text-green-400">
              {[...new Set(products.map(p => p.category))].length}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Categories</div>
          </div>
        </div>

        {/* Products List */}
        {isLoading ? (
          <div className="text-red-500 text-center py-20 font-creepster text-2xl animate-pulse">Loading...</div>
        ) : (
          <div className="space-y-2">
            {products.map(product => (
              <div key={product.id} className="border border-red-900/30 bg-card overflow-hidden">
                {/* Product Row */}
                <div className="flex items-center gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-bold truncate">{product.title}</span>
                      {product.featured && <span className="text-yellow-500 text-xs flex items-center gap-1"><Star className="w-3 h-3 fill-current" />Featured</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-red-500 uppercase">{product.category}</span>
                      <span className="text-red-400 font-bold">${product.price.toFixed(2)}</span>
                      <span className="text-gray-600 text-xs truncate hidden sm:block">{product.downloadFileName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleFeatured(product)}
                      title={product.featured ? "Remove from featured" : "Add to featured"}
                      className={`p-2 transition-colors ${product.featured ? "text-yellow-500 hover:text-yellow-400" : "text-gray-600 hover:text-yellow-500"}`}
                    >
                      <Star className={`w-4 h-4 ${product.featured ? "fill-current" : ""}`} />
                    </button>
                    <button
                      onClick={() => setExpandedId(expandedId === product.id ? null : product.id)}
                      className="p-2 text-gray-600 hover:text-blue-400 transition-colors"
                      title="View description"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { startEdit(product); setExpandedId(product.id); }}
                      className="p-2 text-gray-600 hover:text-red-400 transition-colors"
                      title="Edit product"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id, product.title)}
                      className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                      title="Delete product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setExpandedId(expandedId === product.id ? null : product.id)}
                      className="p-2 text-gray-600"
                    >
                      {expandedId === product.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded: Description + Edit Form */}
                <AnimatePresence>
                  {expandedId === product.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-red-900/20 p-6 bg-black/20">
                        {editingId === product.id ? (
                          <>
                            <h3 className="font-bold text-white uppercase tracking-widest text-sm mb-4">Edit Product</h3>
                            <FormFields
                              isUpdate
                              onSubmit={(e) => handleUpdate(product.id, e)}
                              loading={updateProduct.isPending}
                            />
                          </>
                        ) : (
                          <div className="space-y-3">
                            <div>
                              <span className="text-xs text-red-500 uppercase tracking-widest">Description</span>
                              <p className="text-gray-400 text-sm mt-1 leading-relaxed">{product.description}</p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                              <div>
                                <span className="text-gray-600 uppercase tracking-widest">Download File</span>
                                <p className="text-gray-300 mt-0.5">{product.downloadFileName}</p>
                              </div>
                              <div>
                                <span className="text-gray-600 uppercase tracking-widest">Category</span>
                                <p className="text-gray-300 mt-0.5 capitalize">{product.category}</p>
                              </div>
                              <div>
                                <span className="text-gray-600 uppercase tracking-widest">Price</span>
                                <p className="text-red-400 mt-0.5">${product.price.toFixed(2)}</p>
                              </div>
                              <div>
                                <span className="text-gray-600 uppercase tracking-widest">Featured</span>
                                <p className={`mt-0.5 ${product.featured ? "text-yellow-500" : "text-gray-500"}`}>
                                  {product.featured ? "Yes ★" : "No"}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => startEdit(product)}
                              className="flex items-center gap-2 px-4 py-2 border border-red-900/40 text-red-400 hover:bg-red-950/20 text-sm uppercase tracking-widest transition-all mt-2"
                            >
                              <Pencil className="w-3 h-3" /> Edit This Product
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}

        {products.length === 0 && !isLoading && (
          <div className="text-center py-20 border border-red-900/20">
            <p className="text-gray-500 mb-4">No products yet. Add your first product above.</p>
            <button onClick={() => setShowCreate(true)}
              className="px-6 py-2 bg-red-700 text-white border border-red-500 uppercase tracking-widest text-sm">
              Add Product
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
