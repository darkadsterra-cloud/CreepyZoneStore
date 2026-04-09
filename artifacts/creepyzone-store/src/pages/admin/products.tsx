import { useState, useRef } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useListProducts, useDeleteProduct, useCreateProduct, useUpdateProduct, useGetMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Trash2, Plus, X, Pencil, ChevronDown, ChevronUp, Star, Eye, Upload, Image, FileArchive, CheckCircle, Music, Video, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = ["overlay","alert","bundle","asset","pack","animated","neon","horror","anime","vertical","interactive","minimal","grunge"] as const;
type Category = typeof CATEGORIES[number];

interface MediaFile { url: string; name: string; type: "image" | "video" | "audio" | "animated"; }

interface ProductForm {
  title: string; description: string; price: number; category: Category;
  previewImageUrl: string; downloadFileName: string; featured: boolean; previewVideoUrl: string;
}
const EMPTY_FORM: ProductForm = { title:"",description:"",price:9.99,category:"overlay",previewImageUrl:"",downloadFileName:"",featured:false,previewVideoUrl:"" };

const LIMITS = { image: 20, animated: 20, video: 5, audio: 5 };
const ACCEPT = ".jpg,.jpeg,.png,.gif,.webp,.mp4,.webm,.mov,.mp3,.wav,.ogg";

function getIcon(type: string) {
  if (type === "video") return <Video className="w-4 h-4" />;
  if (type === "audio") return <Music className="w-4 h-4" />;
  if (type === "animated") return <ImageIcon className="w-4 h-4 text-purple-400" />;
  return <Image className="w-4 h-4" />;
}

function MediaGrid({ files, uploading, onUpload, onRemove }: {
  files: MediaFile[]; uploading: boolean;
  onUpload: (f: File) => void; onRemove: (i: number) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const counts = { image: 0, animated: 0, video: 0, audio: 0 };
  files.forEach(f => { counts[f.type]++; });
  const canUpload = counts.image < LIMITS.image || counts.animated < LIMITS.animated || counts.video < LIMITS.video || counts.audio < LIMITS.audio;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2 text-xs text-center">
        {(["image","animated","video","audio"] as const).map(t => (
          <div key={t} className={`p-1.5 border ${counts[t] >= LIMITS[t] ? "border-red-700/50 bg-red-950/20" : "border-red-900/20"}`}>
            <div className="text-gray-400 capitalize">{t === "animated" ? "GIFs" : t === "audio" ? "MP3" : t === "video" ? "MP4" : "Images"}</div>
            <div className={`font-bold ${counts[t] >= LIMITS[t] ? "text-red-400" : "text-white"}`}>{counts[t]}/{LIMITS[t]}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {files.map((f, i) => (
          <div key={i} className="relative group aspect-square border border-red-900/20 bg-black/40 overflow-hidden">
            {f.type === "image" || f.type === "animated" ? (
              <img src={f.url} alt={f.name} className="w-full h-full object-cover" />
            ) : f.type === "video" ? (
              <video src={f.url} className="w-full h-full object-cover" muted />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                <Music className="w-6 h-6 text-purple-400" />
                <span className="text-xs text-gray-500 truncate px-1">{f.name.slice(0,8)}</span>
              </div>
            )}
            {i === 0 && f.type === "image" && (
              <div className="absolute top-0 left-0 right-0 bg-red-700/80 text-white text-xs text-center py-0.5">Main</div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-xs text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className={f.type === "audio" ? "text-purple-400" : f.type === "video" ? "text-blue-400" : f.type === "animated" ? "text-green-400" : "text-gray-300"}>
                {f.type}
              </span>
            </div>
            <button type="button" onClick={() => onRemove(i)}
              className="absolute top-1 right-1 bg-black/80 text-red-400 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity rounded">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {canUpload && (
          <div onClick={() => ref.current?.click()}
            className="aspect-square border-2 border-dashed border-red-900/30 hover:border-red-600/50 cursor-pointer flex flex-col items-center justify-center gap-1 transition-all bg-black/20">
            {uploading ? (
              <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Upload className="w-5 h-5 text-red-500/50" />
                <span className="text-xs text-gray-600 text-center px-1">Add File</span>
              </>
            )}
          </div>
        )}
      </div>

      <input ref={ref} type="file" accept={ACCEPT} className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }} />
      <p className="text-xs text-gray-600">Images/GIFs: JPG, PNG, GIF, WEBP • Videos: MP4, WEBM • Audio: MP3, WAV</p>
    </div>
  );
}

function FormFields({ form, setForm, isUpdate, onSubmit, onCancel, loading,
  uploadingProduct, uploadingMedia, uploadedProduct, mediaFiles,
  onUploadProduct, onUploadMedia, onRemoveMedia }: {
  form: ProductForm; setForm: React.Dispatch<React.SetStateAction<ProductForm>>;
  isUpdate?: boolean; onSubmit: (e: React.FormEvent) => void; onCancel: () => void;
  loading: boolean; uploadingProduct: boolean; uploadingMedia: boolean;
  uploadedProduct: {name:string;url:string}|null; mediaFiles: MediaFile[];
  onUploadProduct: (f: File) => void; onUploadMedia: (f: File) => void; onRemoveMedia: (i: number) => void;
}) {
  const productRef = useRef<HTMLInputElement>(null);
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-xs text-red-500 uppercase tracking-widest mb-1">Product Title *</label>
          <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required
            placeholder="e.g. Blood Moon Horror Overlay Bundle"
            className="w-full px-3 py-2 bg-background border border-red-900/30 focus:border-red-600 outline-none text-white" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-red-500 uppercase tracking-widest mb-1">Description *</label>
          <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} required rows={4}
            placeholder="Describe what's included..."
            className="w-full px-3 py-2 bg-background border border-red-900/30 focus:border-red-600 outline-none text-white resize-none" />
        </div>
        <div>
          <label className="block text-xs text-red-500 uppercase tracking-widest mb-1">Price (USD) *</label>
          <input type="number" step="0.01" min="0.99" value={form.price}
            onChange={e => setForm(f => ({...f, price: parseFloat(e.target.value)||0}))} required
            className="w-full px-3 py-2 bg-background border border-red-900/30 focus:border-red-600 outline-none text-white" />
        </div>
        <div>
          <label className="block text-xs text-red-500 uppercase tracking-widest mb-1">Category *</label>
          <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value as Category}))}
            className="w-full px-3 py-2 bg-background border border-red-900/30 focus:border-red-600 outline-none text-white">
            {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
          </select>
        </div>
      </div>

      <div className="border border-red-900/20 p-4 bg-black/20 space-y-4">
        <h3 className="text-xs text-red-500 uppercase tracking-widest font-bold flex items-center gap-2">
          <Upload className="w-3 h-3" /> Product Files
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-widest mb-2">Download File (ZIP/Pack)</label>
            <div onClick={() => productRef.current?.click()}
              className={`border-2 border-dashed ${uploadedProduct ? "border-green-600/50 bg-green-950/10" : "border-red-900/30 hover:border-red-600/50"} transition-all cursor-pointer`}>
              <input ref={productRef} type="file" accept=".zip,.rar,.7z,.mp4,.webm" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) onUploadProduct(f); e.target.value=""; }} />
              <div className="p-4 text-center">
                {uploadingProduct ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-gray-400">Uploading...</span>
                  </div>
                ) : uploadedProduct ? (
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                    <span className="text-xs text-green-400 font-bold">{uploadedProduct.name}</span>
                    <span className="text-xs text-gray-500">Click to replace</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <FileArchive className="w-8 h-8 text-red-500/50" />
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Upload Product File</span>
                    <span className="text-xs text-gray-600">ZIP, RAR, 7Z (max 200MB)</span>
                    <div className="flex items-center gap-2 mt-1 px-4 py-1.5 border border-red-800/50 text-red-500 text-xs uppercase tracking-widest">
                      <Upload className="w-3 h-3" /> Choose File
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-2">
              <label className="block text-xs text-gray-600 mb-1">Or enter filename manually:</label>
              <input value={form.downloadFileName} onChange={e => setForm(f => ({...f, downloadFileName: e.target.value}))} required
                placeholder="product-pack.zip"
                className="w-full px-3 py-2 bg-background border border-red-900/20 focus:border-red-600 outline-none text-white text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-widest mb-2">
              Preview Media
              <span className="ml-2 text-gray-600 normal-case text-xs">({mediaFiles.length} files)</span>
            </label>
            <MediaGrid files={mediaFiles} uploading={uploadingMedia} onUpload={onUploadMedia} onRemove={onRemoveMedia} />
            {mediaFiles.length === 0 && (
              <div className="mt-2">
                <label className="block text-xs text-gray-600 mb-1">Or enter main image URL:</label>
                <input value={form.previewImageUrl} onChange={e => setForm(f => ({...f, previewImageUrl: e.target.value}))}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-background border border-red-900/20 focus:border-red-600 outline-none text-white text-sm" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input type="checkbox" id={`feat-${isUpdate?"ed":"new"}`} checked={form.featured}
          onChange={e => setForm(f => ({...f, featured: e.target.checked}))} className="w-4 h-4 accent-red-500" />
        <label htmlFor={`feat-${isUpdate?"ed":"new"}`} className="text-gray-300 text-sm">
          <span className="text-yellow-500">★</span> Feature this product on homepage
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-red-900/20">
        <button type="button" onClick={onCancel}
          className="px-6 py-2 border border-red-900/30 text-gray-500 hover:text-white text-sm uppercase tracking-widest">Cancel</button>
        <button type="submit" disabled={loading}
          className="px-8 py-2 bg-red-700 hover:bg-red-600 text-white font-bold uppercase tracking-widest text-sm border border-red-500 disabled:opacity-50">
          {loading ? "Saving..." : isUpdate ? "Update Product" : "Create Product"}
        </button>
      </div>
    </form>
  );
}

export default function AdminProducts() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number|null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [expandedId, setExpandedId] = useState<number|null>(null);
  const [uploadingProduct, setUploadingProduct] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadedProductFile, setUploadedProductFile] = useState<{name:string;url:string}|null>(null);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);

  const { data: me } = useGetMe({ query: { enabled: isAuthenticated }});
  const { data, isLoading } = useListProducts({}, { query: { enabled: isAuthenticated && me?.role==="admin" }});
  const deleteProduct = useDeleteProduct();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const products = data?.products ?? [];
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/products"] });
  const getToken = () => localStorage.getItem("creepyzone_token") ?? "";

  const handleUploadProduct = async (file: File) => {
    setUploadingProduct(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload/product", {
        method: "POST", headers: { Authorization: `Bearer ${getToken()}` }, body: fd,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setUploadedProductFile({ name: data.originalName, url: data.downloadUrl });
      setForm(f => ({...f, downloadFileName: data.filename}));
      toast({ title: "Product file uploaded!", description: data.originalName });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally { setUploadingProduct(false); }
  };

  const handleUploadMedia = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const type: MediaFile["type"] = ["mp4","webm","mov"].includes(ext) ? "video"
      : ["mp3","wav","ogg"].includes(ext) ? "audio"
      : ext === "gif" ? "animated" : "image";

    const counts = { image: 0, animated: 0, video: 0, audio: 0 };
    mediaFiles.forEach(f => { counts[f.type]++; });
    if (counts[type] >= LIMITS[type]) {
      toast({ title: `Max ${LIMITS[type]} ${type} files allowed`, variant: "destructive" });
      return;
    }

    setUploadingMedia(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload/image", {
        method: "POST", headers: { Authorization: `Bearer ${getToken()}` }, body: fd,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const newFile: MediaFile = { url: data.imageUrl, name: data.filename, type: data.fileType ?? type };
      const newFiles = [...mediaFiles, newFile];
      setMediaFiles(newFiles);
      // First image = main preview
      const firstImage = newFiles.find(f => f.type === "image" || f.type === "animated");
      if (firstImage) setForm(f => ({...f, previewImageUrl: firstImage.url}));
      toast({ title: `${type === "audio" ? "Audio" : type === "video" ? "Video" : type === "animated" ? "GIF" : "Image"} uploaded!` });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally { setUploadingMedia(false); }
  };

  const handleRemoveMedia = (index: number) => {
    const newFiles = mediaFiles.filter((_, i) => i !== index);
    setMediaFiles(newFiles);
    const firstImage = newFiles.find(f => f.type === "image" || f.type === "animated");
    setForm(f => ({...f, previewImageUrl: firstImage?.url ?? ""}));
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      await deleteProduct.mutateAsync({ id });
      invalidate();
      toast({ title: "Product deleted" });
    } catch { toast({ title: "Error", variant: "destructive" }); }
  };

  const startEdit = (product: any) => {
    setEditingId(product.id);
    setUploadedProductFile(null);
    // Try to parse stored media JSON, fallback to single image
    let parsedMedia: MediaFile[] = [];
    try {
      const parsed = JSON.parse(product.previewImageUrl);
      if (Array.isArray(parsed)) parsedMedia = parsed;
    } catch {
      if (product.previewImageUrl) parsedMedia = [{ url: product.previewImageUrl, name: "current", type: "image" }];
    }
    setMediaFiles(parsedMedia);
    setForm({
      title: product.title, description: product.description, price: product.price,
      category: product.category, previewImageUrl: product.previewImageUrl ?? "",
      downloadFileName: product.downloadFileName ?? "", featured: product.featured,
      previewVideoUrl: product.previewVideoUrl ?? "",
    });
    setShowCreate(false);
  };

  const resetForm = () => {
    setShowCreate(false); setEditingId(null); setForm(EMPTY_FORM);
    setUploadedProductFile(null); setMediaFiles([]);
  };

  // Build previewImageUrl — store JSON array if multiple files, else single URL
  const buildPreviewImageUrl = () => {
    if (mediaFiles.length === 0) return form.previewImageUrl;
    if (mediaFiles.length === 1) return mediaFiles[0].url;
    return JSON.stringify(mediaFiles);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const previewImageUrl = buildPreviewImageUrl();
      await createProduct.mutateAsync({ data: { ...form, previewImageUrl, price: Number(form.price), previewVideoUrl: form.previewVideoUrl||null }});
      invalidate();
      toast({ title: "Product created!" });
      resetForm();
    } catch (err: any) { toast({ title: "Error", description: err?.message, variant: "destructive" }); }
  };

  const handleUpdate = async (id: number, e: React.FormEvent) => {
    e.preventDefault();
    try {
      const previewImageUrl = buildPreviewImageUrl();
      await updateProduct.mutateAsync({ id, data: { ...form, previewImageUrl, price: Number(form.price), previewVideoUrl: form.previewVideoUrl||null }});
      invalidate();
      toast({ title: "Product updated!" });
      setEditingId(null);
    } catch (err: any) { toast({ title: "Error", description: err?.message, variant: "destructive" }); }
  };

  const toggleFeatured = async (product: any) => {
    try {
      await updateProduct.mutateAsync({ id: product.id, data: { ...product, featured: !product.featured }});
      invalidate();
      toast({ title: product.featured ? "Removed from featured" : "Added to featured" });
    } catch { toast({ title: "Error", variant: "destructive" }); }
  };

  // Helper to get display image from product
  const getDisplayImage = (product: any) => {
    try {
      const parsed = JSON.parse(product.previewImageUrl);
      if (Array.isArray(parsed)) {
        const img = parsed.find((f: MediaFile) => f.type === "image" || f.type === "animated");
        return img?.url ?? parsed[0]?.url ?? "";
      }
    } catch {}
    return product.previewImageUrl ?? "";
  };

  if (!isAuthenticated || (me && me.role !== "admin")) {
    return <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="font-creepster text-4xl text-red-500">Access Denied</h1>
      <Link href="/"><button className="text-gray-400 border border-red-900/30 px-6 py-2">Go Home</button></Link>
    </div>;
  }

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-6">
          <div>
            <p className="text-red-500 uppercase tracking-[0.5em] text-xs mb-1">Admin Panel</p>
            <h1 className="font-creepster text-4xl text-white">Product Manager</h1>
          </div>
          <button onClick={() => { setShowCreate(!showCreate); setEditingId(null); setForm(EMPTY_FORM); setUploadedProductFile(null); setMediaFiles([]); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-700 hover:bg-red-600 text-white font-bold uppercase tracking-widest text-sm border border-red-500 lava-pulse transition-all">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>

        <div className="flex gap-3 mb-8">
          <Link href="/admin"><button className="px-5 py-2 border border-red-900/30 text-gray-400 hover:border-red-700/50 hover:text-red-400 font-bold uppercase tracking-widest text-xs transition-all">Dashboard</button></Link>
          <Link href="/admin/products"><button className="px-5 py-2 bg-red-700 border border-red-500 text-white font-bold uppercase tracking-widest text-xs">Products</button></Link>
        </div>

        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}}
              className="border border-red-900/40 bg-card p-6 mb-8 overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-creepster text-2xl text-white">Add New Product</h2>
                <button onClick={resetForm} className="text-gray-600 hover:text-red-500"><X className="w-5 h-5" /></button>
              </div>
              <FormFields form={form} setForm={setForm} onSubmit={handleCreate} onCancel={resetForm}
                loading={createProduct.isPending} uploadingProduct={uploadingProduct} uploadingMedia={uploadingMedia}
                uploadedProduct={uploadedProductFile} mediaFiles={mediaFiles}
                onUploadProduct={handleUploadProduct} onUploadMedia={handleUploadMedia} onRemoveMedia={handleRemoveMedia} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="border border-red-900/20 bg-card p-4 text-center">
            <div className="font-creepster text-3xl text-red-400">{products.length}</div>
            <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Total Products</div>
          </div>
          <div className="border border-yellow-900/20 bg-card p-4 text-center">
            <div className="font-creepster text-3xl text-yellow-500">{products.filter(p=>p.featured).length}</div>
            <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Featured</div>
          </div>
          <div className="border border-purple-900/20 bg-card p-4 text-center">
            <div className="font-creepster text-3xl text-purple-400">{[...new Set(products.map(p=>p.category))].length}</div>
            <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Categories</div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-red-500 text-center py-20 font-creepster text-2xl animate-pulse">Loading...</div>
        ) : (
          <div className="space-y-2">
            {products.map(product => (
              <div key={product.id} className="border border-red-900/30 bg-card overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  {getDisplayImage(product) && (
                    <div className="w-12 h-14 flex-shrink-0 overflow-hidden border border-red-900/20">
                      <img src={getDisplayImage(product)} alt={product.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-bold truncate">{product.title}</span>
                      {product.featured && <span className="text-yellow-500 text-xs flex items-center gap-1"><Star className="w-3 h-3 fill-current" />Featured</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-red-500 uppercase">{product.category}</span>
                      <span className="text-red-400 font-bold">${product.price.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={()=>toggleFeatured(product)}
                      className={`p-2 transition-colors ${product.featured?"text-yellow-500":"text-gray-600 hover:text-yellow-500"}`}>
                      <Star className={`w-4 h-4 ${product.featured?"fill-current":""}`} />
                    </button>
                    <button onClick={()=>setExpandedId(expandedId===product.id?null:product.id)} className="p-2 text-gray-600 hover:text-blue-400 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={()=>{startEdit(product);setExpandedId(product.id);}} className="p-2 text-gray-600 hover:text-red-400 transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={()=>handleDelete(product.id,product.title)} className="p-2 text-gray-600 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button onClick={()=>setExpandedId(expandedId===product.id?null:product.id)} className="p-2 text-gray-600">
                      {expandedId===product.id?<ChevronUp className="w-4 h-4"/>:<ChevronDown className="w-4 h-4"/>}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId===product.id && (
                    <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden">
                      <div className="border-t border-red-900/20 p-6 bg-black/20">
                        {editingId===product.id ? (
                          <>
                            <h3 className="font-bold text-white uppercase tracking-widest text-sm mb-4">Edit Product</h3>
                            <FormFields form={form} setForm={setForm} isUpdate
                              onSubmit={e=>handleUpdate(product.id,e)} onCancel={resetForm}
                              loading={updateProduct.isPending} uploadingProduct={uploadingProduct} uploadingMedia={uploadingMedia}
                              uploadedProduct={uploadedProductFile} mediaFiles={mediaFiles}
                              onUploadProduct={handleUploadProduct} onUploadMedia={handleUploadMedia} onRemoveMedia={handleRemoveMedia} />
                          </>
                        ) : (
                          <div className="space-y-3">
                            <div>
                              <span className="text-xs text-red-500 uppercase tracking-widest">Description</span>
                              <p className="text-gray-400 text-sm mt-1 leading-relaxed">{product.description}</p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                              <div><span className="text-gray-600 uppercase tracking-widest">Download File</span><p className="text-gray-300 mt-0.5">{product.downloadFileName}</p></div>
                              <div><span className="text-gray-600 uppercase tracking-widest">Category</span><p className="text-gray-300 mt-0.5 capitalize">{product.category}</p></div>
                              <div><span className="text-gray-600 uppercase tracking-widest">Price</span><p className="text-red-400 mt-0.5">${product.price.toFixed(2)}</p></div>
                              <div><span className="text-gray-600 uppercase tracking-widest">Featured</span><p className={`mt-0.5 ${product.featured?"text-yellow-500":"text-gray-500"}`}>{product.featured?"Yes ★":"No"}</p></div>
                            </div>
                            <button onClick={()=>startEdit(product)}
                              className="flex items-center gap-2 px-4 py-2 border border-red-900/40 text-red-400 hover:bg-red-950/20 text-sm uppercase tracking-widest transition-all mt-2">
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
        {products.length===0 && !isLoading && (
          <div className="text-center py-20 border border-red-900/20">
            <p className="text-gray-500 mb-4">No products yet.</p>
            <button onClick={()=>setShowCreate(true)} className="px-6 py-2 bg-red-700 text-white border border-red-500 uppercase tracking-widest text-sm">Add Product</button>
          </div>
        )}
      </div>
    </div>
  );
}
