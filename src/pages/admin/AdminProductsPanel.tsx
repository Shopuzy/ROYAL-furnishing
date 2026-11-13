import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  Edit3,
  Eye,
  EyeOff,
  FolderPlus,
  ImagePlus,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { api } from '../../lib/api';
import { fileToDataUrl, resolveImageUrl } from '../../lib/media';
import type {
  AvailabilityType,
  Category,
  Product,
  ProductColorDesign,
  ProductSpecification,
  StockStatus,
} from '../../types';

interface AdminProductsPanelProps {
  onDataChanged: () => void;
}

export function AdminProductsPanel({ onDataChanged }: AdminProductsPanelProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');

  // Product editor modal
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number>(1);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [specs, setSpecs] = useState<ProductSpecification[]>([]);
  const [colors, setColors] = useState<ProductColorDesign[]>([]);
  const [price, setPrice] = useState('');
  const [priceUnit, setPriceUnit] = useState('');
  const [stockStatus, setStockStatus] = useState<StockStatus>('In Stock');
  const [availabilityType, setAvailabilityType] = useState<AvailabilityType>('Both');
  const [isPublished, setIsPublished] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Category manager modal
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catImage, setCatImage] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodRes, catRes] = await Promise.all([api.getAdminProducts(), api.getAdminCategories()]);
      setProducts(prodRes.products);
      setCategories(catRes.categories);
      if (catRes.categories.length > 0 && !categoryId) {
        setCategoryId(catRes.categories[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load products.');
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateProduct = () => {
    setEditingProduct(null);
    setName('');
    setCategoryId(categories[0]?.id ?? 1);
    setDescription('');
    setImages([]);
    setSpecs([{ label: 'Dimensions', value: '' }]);
    setColors([{ name: '', hex: '#C8A45D', finish: '' }]);
    setPrice('');
    setPriceUnit('');
    setStockStatus('In Stock');
    setAvailabilityType('Both');
    setIsPublished(true);
    setFeatured(false);
    setShowProductForm(true);
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCategoryId(p.categoryId);
    setDescription(p.description);
    setImages(p.images);
    setSpecs(p.specifications.length ? p.specifications : [{ label: 'Dimensions', value: '' }]);
    setColors(p.colorsDesigns.length ? p.colorsDesigns : [{ name: '', hex: '#C8A45D', finish: '' }]);
    setPrice(p.price !== null ? String(p.price) : '');
    setPriceUnit(p.priceUnit ?? '');
    setStockStatus(p.stockStatus);
    setAvailabilityType(p.availabilityType);
    setIsPublished(p.isPublished);
    setFeatured(p.featured);
    setShowProductForm(true);
  };

  const handleMultiFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        const dataUrl = await fileToDataUrl(file);
        const res = await api.uploadImage(dataUrl, file.name);
        uploadedUrls.push(res.url);
      }
      setImages((prev) => [...prev, ...uploadedUrls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSaveProduct = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const cleanSpecs = specs.filter((s) => s.label.trim() && s.value.trim());
      const cleanColors = colors.filter((c) => c.name.trim());
      const payload = {
        name: name.trim(),
        categoryId,
        description: description.trim(),
        images,
        specifications: cleanSpecs,
        colorsDesigns: cleanColors,
        price: price.trim() ? Number(price) : null,
        priceUnit: priceUnit.trim() || null,
        stockStatus,
        availabilityType,
        isPublished,
        featured,
      };
      if (editingProduct) {
        await api.updateAdminProduct(editingProduct.id, payload);
      } else {
        await api.createAdminProduct(payload);
      }
      setShowProductForm(false);
      await loadData();
      onDataChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save product.');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (p: Product) => {
    try {
      await api.updateAdminProduct(p.id, { isPublished: !p.isPublished });
      await loadData();
      onDataChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle visibility.');
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await api.deleteAdminProduct(deleteTarget.id);
      setDeleteTarget(null);
      await loadData();
      onDataChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCategory = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingCategory) {
        await api.updateAdminCategory(editingCategory.id, {
          name: catName,
          description: catDesc,
          imageUrl: catImage,
        });
      } else {
        await api.createAdminCategory({
          name: catName,
          description: catDesc,
          imageUrl: catImage || '/src/assets/images/cat_decorative_wall_panels_1794552442030.jpg',
        });
      }
      setEditingCategory(null);
      setCatName('');
      setCatDesc('');
      setCatImage('');
      await loadData();
      onDataChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save category.');
    } finally {
      setSaving(false);
    }
  };

  const handleCategoryImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await api.uploadImage(dataUrl, file.name);
      setCatImage(res.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    setError(null);
    try {
      await api.deleteAdminCategory(cat.id);
      await loadData();
      onDataChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete category.');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchCat = catFilter === 'All' || String(p.categoryId) === catFilter;
    const matchSearch =
      !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.categoryName || '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#1C1917]">
            Products & Categories
          </h2>
          <p className="text-sm text-[#57534E]">
            Manage inventory, multiple images, optional pricing, finishes, and publish visibility.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowCategoriesModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-xs sm:text-sm font-semibold text-stone-800 cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Manage Categories</span>
          </button>
          <button
            type="button"
            onClick={openCreateProduct}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] rounded-lg bg-[#181615] text-[#E6CE97] text-xs sm:text-sm font-semibold hover:bg-[#2A2624] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 rounded-xl bg-white border border-stone-200">
        <div className="md:col-span-8 relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name or category..."
            className="w-full min-h-[42px] pl-10 pr-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-[#C8A45D]"
          />
        </div>
        <div className="md:col-span-4">
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-stone-200 text-sm bg-white"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">{error}</div>}

      {/* Products Table */}
      <div className="rounded-xl bg-white border border-stone-200 overflow-hidden">
        {loading ? (
          <div className="py-16 flex items-center justify-center text-stone-500 gap-2 text-sm">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading products...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-sm text-stone-500">No products found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-xs font-semibold text-stone-600">
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Stock & Supply</th>
                  <th className="py-3 px-4">Visibility</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={resolveImageUrl(p.images[0])}
                          alt={p.name}
                          className="w-12 h-10 rounded-md object-cover bg-stone-100 shrink-0"
                        />
                        <div>
                          <div className="font-medium text-stone-900">{p.name}</div>
                          <div className="text-xs text-stone-500">
                            {p.images.length} image{p.images.length === 1 ? '' : 's'}
                            {p.featured ? ' · Featured' : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-stone-700">{p.categoryName}</td>
                    <td className="py-3 px-4 tabular-nums font-medium text-stone-900 whitespace-nowrap">
                      {p.price !== null
                        ? `₹${p.price.toLocaleString('en-IN')}${p.priceUnit ? ` / ${p.priceUnit}` : ''}`
                        : 'Price on Request'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs font-medium text-stone-900">{p.stockStatus}</div>
                      <div className="text-xs text-stone-500">{p.availabilityType}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => togglePublish(p)}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                          p.isPublished ? 'text-emerald-700' : 'text-stone-400'
                        }`}
                      >
                        {p.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        <span>{p.isPublished ? 'Published' : 'Hidden'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditProduct(p)}
                          className="p-2 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700 cursor-pointer"
                          title="Edit Product"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(p)}
                          className="p-2 rounded-lg border border-stone-200 hover:bg-red-50 text-red-600 cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      {showProductForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form
            onSubmit={handleSaveProduct}
            className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white border border-stone-200 p-6 sm:p-8 shadow-2xl space-y-6"
          >
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <h3 className="font-display text-2xl font-semibold text-stone-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                type="button"
                onClick={() => setShowProductForm(false)}
                className="p-2 rounded-lg hover:bg-stone-100 text-stone-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-stone-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Category *</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-stone-300 text-sm"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm"
              />
            </div>

            {/* Multiple Images Upload */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-xs font-semibold text-stone-700">Product Images (Multiple Supported)</label>
                <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-stone-800 cursor-pointer">
                  <ImagePlus className="w-4 h-4" />
                  <span>{uploading ? 'Uploading...' : 'Upload Image Files'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    onChange={handleMultiFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="Or paste image URL..."
                  className="flex-1 min-h-[40px] px-3 py-1.5 rounded-lg border border-stone-300 text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (imageUrlInput.trim()) {
                      setImages((prev) => [...prev, imageUrlInput.trim()]);
                      setImageUrlInput('');
                    }
                  }}
                  className="px-4 py-2 rounded-lg border border-stone-300 text-xs font-semibold hover:bg-stone-50 cursor-pointer"
                >
                  Add URL
                </button>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {images.map((img, idx) => (
                    <div key={`${img}-${idx}`} className="relative aspect-[4/3] rounded-lg overflow-hidden border border-stone-200 group">
                      <img src={resolveImageUrl(img)} alt="Product preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-90 hover:bg-red-600 cursor-pointer"
                        title="Remove image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pricing, Stock, Supply */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Price (₹ Optional)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Leave blank for Quote"
                  className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-stone-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Price Unit</label>
                <input
                  type="text"
                  value={priceUnit}
                  onChange={(e) => setPriceUnit(e.target.value)}
                  placeholder="per sheet / sq.ft"
                  className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-stone-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Stock Availability</label>
                <select
                  value={stockStatus}
                  onChange={(e) => setStockStatus(e.target.value as StockStatus)}
                  className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-stone-300 text-sm"
                >
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Made to Order">Made to Order</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Supply Mode</label>
                <select
                  value={availabilityType}
                  onChange={(e) => setAvailabilityType(e.target.value as AvailabilityType)}
                  className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-stone-300 text-sm"
                >
                  <option value="Both">Retail & Wholesale</option>
                  <option value="Retail">Retail Only</option>
                  <option value="Wholesale">Wholesale Only</option>
                </select>
              </div>
            </div>

            {/* Specifications Builder */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">Specifications</label>
                <button
                  type="button"
                  onClick={() => setSpecs((prev) => [...prev, { label: '', value: '' }])}
                  className="text-xs font-semibold text-[#8C6D32] hover:underline cursor-pointer"
                >
                  + Add Specification
                </button>
              </div>
              {specs.map((sp, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2">
                  <input
                    type="text"
                    value={sp.label}
                    onChange={(e) =>
                      setSpecs((prev) => prev.map((item, i) => (i === idx ? { ...item, label: e.target.value } : item)))
                    }
                    placeholder="e.g. Thickness"
                    className="col-span-5 min-h-[38px] px-3 py-1.5 rounded-lg border border-stone-300 text-xs"
                  />
                  <input
                    type="text"
                    value={sp.value}
                    onChange={(e) =>
                      setSpecs((prev) => prev.map((item, i) => (i === idx ? { ...item, value: e.target.value } : item)))
                    }
                    placeholder="e.g. 18 mm"
                    className="col-span-6 min-h-[38px] px-3 py-1.5 rounded-lg border border-stone-300 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setSpecs((prev) => prev.filter((_, i) => i !== idx))}
                    className="col-span-1 flex items-center justify-center text-stone-400 hover:text-red-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Colours & Designs Builder */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">Available Colours & Designs</label>
                <button
                  type="button"
                  onClick={() => setColors((prev) => [...prev, { name: '', hex: '#C8A45D', finish: '' }])}
                  className="text-xs font-semibold text-[#8C6D32] hover:underline cursor-pointer"
                >
                  + Add Colour / Design
                </button>
              </div>
              {colors.map((cd, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    type="color"
                    value={cd.hex || '#C8A45D'}
                    onChange={(e) =>
                      setColors((prev) => prev.map((item, i) => (i === idx ? { ...item, hex: e.target.value } : item)))
                    }
                    className="col-span-2 sm:col-span-1 h-9 w-full rounded border border-stone-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={cd.name}
                    onChange={(e) =>
                      setColors((prev) => prev.map((item, i) => (i === idx ? { ...item, name: e.target.value } : item)))
                    }
                    placeholder="Shade name (e.g. Dark Walnut)"
                    className="col-span-5 min-h-[38px] px-3 py-1.5 rounded-lg border border-stone-300 text-xs"
                  />
                  <input
                    type="text"
                    value={cd.finish || ''}
                    onChange={(e) =>
                      setColors((prev) => prev.map((item, i) => (i === idx ? { ...item, finish: e.target.value } : item)))
                    }
                    placeholder="Finish (e.g. Matte)"
                    className="col-span-4 sm:col-span-5 min-h-[38px] px-3 py-1.5 rounded-lg border border-stone-300 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setColors((prev) => prev.filter((_, i) => i !== idx))}
                    className="col-span-1 flex items-center justify-center text-stone-400 hover:text-red-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2">
              <label className="inline-flex items-center gap-2 text-sm text-stone-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 accent-[#181615]"
                />
                <span>Published on Public Website</span>
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-stone-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 accent-[#181615]"
                />
                <span>Featured on Homepage</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setShowProductForm(false)}
                className="px-4 py-2.5 rounded-lg border border-stone-200 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || uploading}
                className="px-6 py-2.5 rounded-lg bg-[#181615] text-[#E6CE97] text-xs font-semibold hover:bg-[#2A2624] cursor-pointer"
              >
                {saving ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories Modal */}
      {showCategoriesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-stone-200 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-display text-2xl font-semibold text-stone-900">Manage Categories</h3>
              <button
                type="button"
                onClick={() => setShowCategoriesModal(false)}
                className="p-2 rounded-lg hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
              <p className="text-xs font-semibold text-stone-700">
                {editingCategory ? `Editing: ${editingCategory.name}` : 'Add New Category'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Category Name *"
                  className="min-h-[40px] px-3 py-1.5 rounded-lg border border-stone-300 text-sm bg-white"
                />
                <label className="inline-flex items-center justify-center gap-2 min-h-[40px] px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-xs font-semibold cursor-pointer">
                  <ImagePlus className="w-4 h-4" />
                  <span>{catImage ? 'Image Ready (Replace)' : 'Upload Category Image'}</span>
                  <input type="file" accept="image/*" onChange={handleCategoryImageUpload} className="hidden" />
                </label>
              </div>
              <input
                type="text"
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                placeholder="Short category description"
                className="w-full min-h-[40px] px-3 py-1.5 rounded-lg border border-stone-300 text-sm bg-white"
              />
              <div className="flex justify-end gap-2">
                {editingCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategory(null);
                      setCatName('');
                      setCatDesc('');
                      setCatImage('');
                    }}
                    className="px-3 py-2 rounded-lg border border-stone-300 text-xs font-semibold cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-[#181615] text-[#E6CE97] text-xs font-semibold cursor-pointer"
                >
                  {editingCategory ? 'Update Category' : 'Add Category'}
                </button>
              </div>
            </form>

            <div className="divide-y divide-stone-200 border border-stone-200 rounded-xl overflow-hidden">
              {categories.map((cat) => (
                <div key={cat.id} className="p-3.5 flex items-center justify-between gap-3 bg-white">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={resolveImageUrl(cat.imageUrl)}
                      alt={cat.name}
                      className="w-12 h-9 rounded object-cover bg-stone-100 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-stone-900 truncate">{cat.name}</p>
                      <p className="text-xs text-stone-500 truncate">
                        {cat.productCount ?? 0} product{(cat.productCount ?? 0) === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(cat);
                        setCatName(cat.name);
                        setCatDesc(cat.description);
                        setCatImage(cat.imageUrl);
                      }}
                      className="p-2 rounded-lg border border-stone-200 hover:bg-stone-100 cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat)}
                      className="p-2 rounded-lg border border-stone-200 hover:bg-red-50 text-red-600 cursor-pointer"
                      title="Delete category (must have 0 products)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm rounded-2xl bg-white border border-stone-200 p-6 shadow-xl">
            <h3 className="font-display text-xl font-semibold text-stone-900">Delete Product?</h3>
            <p className="mt-2 text-sm text-stone-600">
              Remove <span className="font-semibold">{deleteTarget.name}</span> from the catalog permanently?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-stone-200 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold cursor-pointer"
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
