import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Check, Edit3, ExternalLink, Eye, EyeOff, ImagePlus, Loader2, MapPin, Plus, Trash2, X } from 'lucide-react';
import { api } from '../../lib/api';
import { fileToDataUrl, resolveImageUrl } from '../../lib/media';
import type { BranchLocation, GalleryItem, SiteSettings } from '../../types';

interface AdminWebsitePanelProps {
  onDataChanged: () => void;
}

export function AdminWebsitePanel({ onDataChanged }: AdminWebsitePanelProps) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [branches, setBranches] = useState<BranchLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Branch form state
  const [editingBranch, setEditingBranch] = useState<BranchLocation | null>(null);
  const [bName, setBName] = useState('');
  const [bLocation, setBLocation] = useState('');
  const [bMapLink, setBMapLink] = useState('');
  const [bPhone, setBPhone] = useState('');
  const [bWhatsapp, setBWhatsapp] = useState('');
  const [bHours, setBHours] = useState('');

  // New Gallery Item State
  const [gTitle, setGTitle] = useState('');
  const [gCategory, setGCategory] = useState('Fluted Panels');
  const [gLocation, setGLocation] = useState('');
  const [gDesc, setGDesc] = useState('');
  const [gImageUrl, setGImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, gRes, bRes] = await Promise.all([
        api.getAdminSettings(),
        api.getAdminGallery(),
        api.getAdminBranches(),
      ]);
      setSettings(sRes.settings);
      setGalleryItems(gRes.galleryItems);
      setBranches(bRes.branches);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load website settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleUploadField = async (
    e: ChangeEvent<HTMLInputElement>,
    onUrl: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await api.uploadImage(dataUrl, file.name);
      onUrl(res.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSavedNotice(false);
    setError(null);
    try {
      const res = await api.updateAdminSettings(settings);
      setSettings(res.settings);
      setSavedNotice(true);
      onDataChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddGallery = async (e: FormEvent) => {
    e.preventDefault();
    if (!gTitle.trim() || !gImageUrl.trim()) {
      setError('Please enter a gallery title and upload an image.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.createAdminGalleryItem({
        title: gTitle.trim(),
        category: gCategory.trim(),
        locationLabel: gLocation.trim(),
        description: gDesc.trim(),
        imageUrl: gImageUrl.trim(),
        isPublished: true,
      });
      setGTitle('');
      setGLocation('');
      setGDesc('');
      setGImageUrl('');
      await loadAll();
      onDataChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add gallery item.');
    } finally {
      setSaving(false);
    }
  };

  const toggleGalleryPublish = async (item: GalleryItem) => {
    try {
      await api.updateAdminGalleryItem(item.id, { isPublished: !item.isPublished });
      await loadAll();
      onDataChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update gallery item.');
    }
  };

  const deleteGallery = async (item: GalleryItem) => {
    try {
      await api.deleteAdminGalleryItem(item.id);
      await loadAll();
      onDataChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete gallery item.');
    }
  };

  const resetBranchForm = () => {
    setEditingBranch(null);
    setBName('');
    setBLocation('');
    setBMapLink('');
    setBPhone('');
    setBWhatsapp('');
    setBHours('');
  };

  const handleSaveBranch = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        branchName: bName.trim(),
        locationName: bLocation.trim(),
        mapLink: bMapLink.trim(),
        phoneNumber: bPhone.trim(),
        whatsappNumber: bWhatsapp.trim(),
        businessHours: bHours.trim(),
      };
      if (editingBranch) {
        await api.updateAdminBranch(editingBranch.id, payload);
      } else {
        await api.createAdminBranch(payload);
      }
      resetBranchForm();
      await loadAll();
      onDataChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save branch location.');
    } finally {
      setSaving(false);
    }
  };

  const toggleBranchPublish = async (branch: BranchLocation) => {
    try {
      await api.updateAdminBranch(branch.id, { isPublished: !branch.isPublished });
      await loadAll();
      onDataChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update branch visibility.');
    }
  };

  const deleteBranch = async (branch: BranchLocation) => {
    try {
      await api.deleteAdminBranch(branch.id);
      if (editingBranch?.id === branch.id) resetBranchForm();
      await loadAll();
      onDataChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete branch.');
    }
  };

  if (loading || !settings) {
    return (
      <div className="py-20 flex items-center justify-center text-stone-500 gap-2 text-sm">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Loading website content...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#1C1917]">
          Website & Gallery Management
        </h2>
        <p className="text-sm text-[#57534E]">
          Configure homepage copy, About Us narrative, business contact details, WhatsApp enquiry number, and gallery
          items.
        </p>
      </div>

      {error && <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">{error}</div>}
      {savedNotice && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Website settings updated and live on the public site.</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Contact & WhatsApp Configuration */}
        <div className="rounded-xl bg-white border border-stone-200 p-6 space-y-4">
          <h3 className="font-display text-xl font-semibold text-stone-900">
            Contact Details & WhatsApp Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                WhatsApp Number (with country code, e.g. 9198XXXXXXXX)
              </label>
              <input
                type="text"
                value={settings.whatsappNumber}
                onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                placeholder="Leave blank if not yet configured"
                className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-stone-300 text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Business Phone Number</label>
              <input
                type="text"
                value={settings.phoneNumber}
                onChange={(e) => setSettings({ ...settings, phoneNumber: e.target.value })}
                placeholder="Display phone number"
                className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-stone-300 text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Business Email</label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                placeholder="sales@royalfurnishing.com"
                className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-stone-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Business Hours</label>
              <input
                type="text"
                value={settings.businessHours}
                onChange={(e) => setSettings({ ...settings, businessHours: e.target.value })}
                placeholder="e.g. Mon – Sat, 10:00 AM – 7:30 PM"
                className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-stone-300 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Showroom / Warehouse Address</label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              placeholder="Full showroom street address and city"
              className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-stone-300 text-sm"
            />
          </div>
        </div>

        {/* Homepage Hero Content */}
        <div className="rounded-xl bg-white border border-stone-200 p-6 space-y-4">
          <h3 className="font-display text-xl font-semibold text-stone-900">Homepage Hero Content</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Hero Headline</label>
              <input
                type="text"
                value={settings.heroHeadline}
                onChange={(e) => setSettings({ ...settings, heroHeadline: e.target.value })}
                className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-stone-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Service Coverage Subtitle</label>
              <input
                type="text"
                value={settings.serviceCoverage}
                onChange={(e) => setSettings({ ...settings, serviceCoverage: e.target.value })}
                className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-stone-300 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Hero Description</label>
            <textarea
              rows={2}
              value={settings.heroDescription}
              onChange={(e) => setSettings({ ...settings, heroDescription: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <img
              src={resolveImageUrl(settings.heroImage)}
              alt="Hero backdrop"
              className="w-28 h-16 rounded-lg object-cover border border-stone-200"
            />
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-stone-300 text-xs font-semibold hover:bg-stone-50 cursor-pointer">
              <ImagePlus className="w-4 h-4" />
              <span>{uploading ? 'Uploading...' : 'Change Hero Image'}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => handleUploadField(e, (url) => setSettings({ ...settings, heroImage: url }))}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* About Us Content */}
        <div className="rounded-xl bg-white border border-stone-200 p-6 space-y-4">
          <h3 className="font-display text-xl font-semibold text-stone-900">About Us Content</h3>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">About Heading</label>
            <input
              type="text"
              value={settings.aboutHeading}
              onChange={(e) => setSettings({ ...settings, aboutHeading: e.target.value })}
              className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-stone-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">About Description</label>
            <textarea
              rows={4}
              value={settings.aboutBody}
              onChange={(e) => setSettings({ ...settings, aboutBody: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <img
              src={resolveImageUrl(settings.aboutImage)}
              alt="Showroom"
              className="w-24 h-16 rounded-lg object-cover border border-stone-200"
            />
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-stone-300 text-xs font-semibold hover:bg-stone-50 cursor-pointer">
              <ImagePlus className="w-4 h-4" />
              <span>{uploading ? 'Uploading...' : 'Change About Image'}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => handleUploadField(e, (url) => setSettings({ ...settings, aboutImage: url }))}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || uploading}
            className="px-6 py-3 min-h-[44px] rounded-lg bg-[#181615] text-[#E6CE97] text-sm font-semibold hover:bg-[#2A2624] cursor-pointer"
          >
            {saving ? 'Saving Settings...' : 'Save Website Settings'}
          </button>
        </div>
      </form>

      {/* Branches & Location Links Management */}
      <div className="rounded-xl bg-white border border-stone-200 p-6 space-y-6">
        <div>
          <h3 className="font-display text-2xl font-semibold text-stone-900">Branches & Location Links</h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Add all your Royal Furnishing showrooms, branches, or warehouses with their location name and Google Maps
            link. All published branches appear on the Contact page, Homepage, and Footer.
          </p>
        </div>

        <form onSubmit={handleSaveBranch} className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-stone-700">
              {editingBranch ? `Editing Branch: ${editingBranch.branchName}` : 'Add New Branch / Location'}
            </p>
            {editingBranch && (
              <button
                type="button"
                onClick={resetBranchForm}
                className="inline-flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel Edit</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              value={bName}
              onChange={(e) => setBName(e.target.value)}
              placeholder="Branch Name (e.g. Main Showroom) *"
              className="min-h-[42px] px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm"
            />
            <input
              type="text"
              required
              value={bLocation}
              onChange={(e) => setBLocation(e.target.value)}
              placeholder="Location Name / Full Address *"
              className="min-h-[42px] px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm"
            />
            <input
              type="url"
              value={bMapLink}
              onChange={(e) => setBMapLink(e.target.value)}
              placeholder="Google Maps Link (https://maps.google.com/...)"
              className="min-h-[42px] px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm sm:col-span-2"
            />
            <input
              type="text"
              value={bPhone}
              onChange={(e) => setBPhone(e.target.value)}
              placeholder="Branch Phone (optional)"
              className="min-h-[42px] px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm tabular-nums"
            />
            <input
              type="text"
              value={bWhatsapp}
              onChange={(e) => setBWhatsapp(e.target.value)}
              placeholder="Branch WhatsApp (e.g. 9198XXXXXXXX, optional)"
              className="min-h-[42px] px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm tabular-nums"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <input
              type="text"
              value={bHours}
              onChange={(e) => setBHours(e.target.value)}
              placeholder="Branch Hours (optional, e.g. 10 AM – 8 PM)"
              className="flex-1 min-h-[42px] px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm"
            />
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 min-h-[42px] px-5 py-2 rounded-lg bg-[#181615] text-[#E6CE97] text-xs font-semibold hover:bg-[#2A2624] cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{editingBranch ? 'Update Branch' : 'Add Branch'}</span>
            </button>
          </div>
        </form>

        {branches.length === 0 ? (
          <p className="text-sm text-stone-500">No branches added yet. Use the form above to add your showroom locations.</p>
        ) : (
          <div className="divide-y divide-stone-200 border border-stone-200 rounded-xl overflow-hidden">
            {branches.map((br) => (
              <div key={br.id} className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#8C6D32] shrink-0" />
                    <span className="font-semibold text-sm text-stone-900">{br.branchName}</span>
                  </div>
                  <p className="text-sm text-stone-600">{br.locationName}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
                    {br.phoneNumber && <span className="tabular-nums">Tel: {br.phoneNumber}</span>}
                    {br.whatsappNumber && <span className="tabular-nums">WhatsApp: {br.whatsappNumber}</span>}
                    {br.businessHours && <span>{br.businessHours}</span>}
                    {br.mapLink && (
                      <a
                        href={br.mapLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#8C6D32] font-medium hover:underline"
                      >
                        <span>Open Map Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleBranchPublish(br)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs font-semibold cursor-pointer ${
                      br.isPublished ? 'text-emerald-700' : 'text-stone-400'
                    }`}
                  >
                    {br.isPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{br.isPublished ? 'Visible' : 'Hidden'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBranch(br);
                      setBName(br.branchName);
                      setBLocation(br.locationName);
                      setBMapLink(br.mapLink);
                      setBPhone(br.phoneNumber);
                      setBWhatsapp(br.whatsappNumber);
                      setBHours(br.businessHours);
                    }}
                    className="p-2 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700 cursor-pointer"
                    title="Edit Branch"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteBranch(br)}
                    className="p-2 rounded-lg border border-stone-200 hover:bg-red-50 text-red-600 cursor-pointer"
                    title="Delete Branch"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gallery Management */}
      <div className="rounded-xl bg-white border border-stone-200 p-6 space-y-6">
        <div>
          <h3 className="font-display text-2xl font-semibold text-stone-900">Gallery Images</h3>
          <p className="text-xs text-stone-500">Add completed interior showcase photography or hide existing entries.</p>
        </div>

        <form onSubmit={handleAddGallery} className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              value={gTitle}
              onChange={(e) => setGTitle(e.target.value)}
              placeholder="Project / Look Title *"
              className="min-h-[40px] px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-sm"
            />
            <input
              type="text"
              required
              value={gCategory}
              onChange={(e) => setGCategory(e.target.value)}
              placeholder="Material Category"
              className="min-h-[40px] px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-sm"
            />
            <input
              type="text"
              value={gLocation}
              onChange={(e) => setGLocation(e.target.value)}
              placeholder="Project Type (e.g. Villa Lounge)"
              className="min-h-[40px] px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <input
              type="text"
              value={gDesc}
              onChange={(e) => setGDesc(e.target.value)}
              placeholder="Brief installation description..."
              className="sm:col-span-6 min-h-[40px] px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-sm"
            />
            <label className="sm:col-span-3 inline-flex items-center justify-center gap-2 min-h-[40px] px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-xs font-semibold cursor-pointer">
              <ImagePlus className="w-4 h-4" />
              <span>{gImageUrl ? 'Image Uploaded' : 'Upload Photo *'}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => handleUploadField(e, (url) => setGImageUrl(url))}
                className="hidden"
              />
            </label>
            <button
              type="submit"
              disabled={saving || uploading}
              className="sm:col-span-3 inline-flex items-center justify-center gap-2 min-h-[40px] px-4 py-1.5 rounded-lg bg-[#181615] text-[#E6CE97] text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Gallery</span>
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {galleryItems.map((item) => (
            <div key={item.id} className="rounded-xl border border-stone-200 overflow-hidden bg-stone-50 flex flex-col">
              <div className="aspect-[4/3] bg-stone-200 overflow-hidden">
                <img
                  src={resolveImageUrl(item.imageUrl)}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <div>
                  <p className="text-xs text-[#8C6D32] font-medium">{item.category}</p>
                  <p className="font-semibold text-sm text-stone-900 mt-0.5">{item.title}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => toggleGalleryPublish(item)}
                    className={`inline-flex items-center gap-1 text-xs font-semibold cursor-pointer ${
                      item.isPublished ? 'text-emerald-700' : 'text-stone-400'
                    }`}
                  >
                    {item.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    <span>{item.isPublished ? 'Visible' : 'Hidden'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteGallery(item)}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                    title="Delete gallery photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
