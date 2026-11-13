import type {
  AdminOverviewStats,
  AdminUser,
  BranchLocation,
  Category,
  Enquiry,
  GalleryItem,
  Order,
  OrderItem,
  Product,
  ProductColorDesign,
  ProductSpecification,
  SiteSettings,
} from '../types';
import { getSupabaseClient } from './supabase';

const DEFAULT_SETTINGS: SiteSettings = {
  brandName: 'ROYAL FURNISHING',
  heroHeadline: 'Transform Your Walls with Modern Elegance',
  heroDescription:
    'Discover premium decorative panels and modern interior materials to transform your residential and commercial spaces.',
  heroImage: '/src/assets/images/hero_luxury_living_room_1794552439172.jpg',
  aboutHeading: 'Quality Materials. Royal Interiors.',
  aboutBody:
    'Royal Furnishing supplies precision-crafted decorative interior materials for homes, offices, hospitality venues, and large commercial developments. From architectural WPC fluted louvers to high-gloss UV marble sheets and acoustic charcoal panels, every surface is curated for enduring elegance in both retail and wholesale quantities.',
  aboutImage: '/src/assets/images/about_showroom_craft_1794552442731.jpg',
  whatsappNumber: '',
  phoneNumber: '',
  contactEmail: '',
  address: '',
  businessHours: '',
  serviceCoverage: 'Retail & Wholesale Supply',
};

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `item-${Date.now()}`
  );
}

async function makeUniqueSlug(base: string, table: 'products' | 'categories', excludeId?: number): Promise<string> {
  const supabase = getSupabaseClient();
  let candidate = base;
  let counter = 1;
  while (true) {
    let query = supabase.from(table).select('id').eq('slug', candidate);
    if (excludeId !== undefined) {
      query = query.neq('id', excludeId);
    }
    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return candidate;
    counter += 1;
    candidate = `${base}-${counter}`;
  }
}

function parseJsonValue<T>(raw: unknown, fallback: T): T {
  if (raw === null || raw === undefined) return fallback;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }
  return raw as T;
}

function mapCategoryRow(row: Record<string, unknown>, productCount?: number): Category {
  return {
    id: Number(row.id),
    name: String(row.name ?? ''),
    slug: String(row.slug ?? ''),
    description: String(row.description ?? ''),
    imageUrl: String(row.image_url ?? ''),
    sortOrder: Number(row.sort_order ?? 0),
    isActive: Boolean(row.is_active),
    productCount,
  };
}

function mapProductRow(row: Record<string, unknown>): Product {
  const categoryObj = row.categories as { name?: string; slug?: string } | null | undefined;
  return {
    id: Number(row.id),
    name: String(row.name ?? ''),
    slug: String(row.slug ?? ''),
    categoryId: Number(row.category_id),
    categoryName: categoryObj?.name ? String(categoryObj.name) : undefined,
    categorySlug: categoryObj?.slug ? String(categoryObj.slug) : undefined,
    description: String(row.description ?? ''),
    images: parseJsonValue<string[]>(row.images_json, []),
    specifications: parseJsonValue<ProductSpecification[]>(row.specifications_json, []),
    colorsDesigns: parseJsonValue<ProductColorDesign[]>(row.colors_designs_json, []),
    price: row.price !== null && row.price !== undefined ? Number(row.price) : null,
    priceUnit: row.price_unit ? String(row.price_unit) : null,
    stockStatus: String(row.stock_status ?? 'In Stock') as Product['stockStatus'],
    availabilityType: String(row.availability_type ?? 'Both') as Product['availabilityType'],
    isPublished: Boolean(row.is_published),
    featured: Boolean(row.featured),
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  };
}

function mapEnquiryRow(row: Record<string, unknown>): Enquiry {
  return {
    id: Number(row.id),
    enquiryCode: String(row.enquiry_code ?? ''),
    customerName: String(row.customer_name ?? ''),
    mobileNumber: String(row.mobile_number ?? ''),
    email: row.email ? String(row.email) : null,
    productId: row.product_id !== null && row.product_id !== undefined ? Number(row.product_id) : null,
    productName: String(row.product_name ?? ''),
    categoryName: String(row.category_name ?? ''),
    quantity: String(row.quantity ?? ''),
    enquiryType: String(row.enquiry_type ?? 'Retail') as Enquiry['enquiryType'],
    deliveryLocation: String(row.delivery_location ?? ''),
    message: String(row.message ?? ''),
    status: String(row.status ?? 'New') as Enquiry['status'],
    internalNotes: String(row.internal_notes ?? ''),
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  };
}

function mapOrderRow(row: Record<string, unknown>): Order {
  return {
    id: Number(row.id),
    orderCode: String(row.order_code ?? ''),
    enquiryId: row.enquiry_id !== null && row.enquiry_id !== undefined ? Number(row.enquiry_id) : null,
    customerName: String(row.customer_name ?? ''),
    mobileNumber: String(row.mobile_number ?? ''),
    email: row.email ? String(row.email) : null,
    deliveryLocation: String(row.delivery_location ?? ''),
    items: parseJsonValue<OrderItem[]>(row.items_json, []),
    orderType: String(row.order_type ?? 'Retail') as Order['orderType'],
    totalAmount: row.total_amount !== null && row.total_amount !== undefined ? Number(row.total_amount) : null,
    status: String(row.status ?? 'New') as Order['status'],
    notes: String(row.notes ?? ''),
    confirmedAt: row.confirmed_at ? String(row.confirmed_at) : null,
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  };
}

function mapGalleryRow(row: Record<string, unknown>): GalleryItem {
  return {
    id: Number(row.id),
    title: String(row.title ?? ''),
    category: String(row.category ?? ''),
    locationLabel: String(row.location_label ?? ''),
    description: String(row.description ?? ''),
    imageUrl: String(row.image_url ?? ''),
    sortOrder: Number(row.sort_order ?? 0),
    isPublished: Boolean(row.is_published),
    createdAt: String(row.created_at ?? ''),
  };
}

function mapBranchRow(row: Record<string, unknown>): BranchLocation {
  return {
    id: Number(row.id),
    branchName: String(row.branch_name ?? ''),
    locationName: String(row.location_name ?? ''),
    mapLink: String(row.map_link ?? ''),
    phoneNumber: String(row.phone_number ?? ''),
    whatsappNumber: String(row.whatsapp_number ?? ''),
    businessHours: String(row.business_hours ?? ''),
    sortOrder: Number(row.sort_order ?? 0),
    isPublished: Boolean(row.is_published),
    createdAt: String(row.created_at ?? ''),
  };
}

function mapSettingsRows(rows: Array<{ key: string; value: string }>): SiteSettings {
  const map: Record<string, string> = {};
  for (const r of rows) {
    map[r.key] = r.value;
  }
  return {
    brandName: map.brandName ?? DEFAULT_SETTINGS.brandName,
    heroHeadline: map.heroHeadline ?? DEFAULT_SETTINGS.heroHeadline,
    heroDescription: map.heroDescription ?? DEFAULT_SETTINGS.heroDescription,
    heroImage: map.heroImage ?? DEFAULT_SETTINGS.heroImage,
    aboutHeading: map.aboutHeading ?? DEFAULT_SETTINGS.aboutHeading,
    aboutBody: map.aboutBody ?? DEFAULT_SETTINGS.aboutBody,
    aboutImage: map.aboutImage ?? DEFAULT_SETTINGS.aboutImage,
    whatsappNumber: map.whatsappNumber ?? '',
    phoneNumber: map.phoneNumber ?? '',
    contactEmail: map.contactEmail ?? '',
    address: map.address ?? '',
    businessHours: map.businessHours ?? '',
    serviceCoverage: map.serviceCoverage ?? DEFAULT_SETTINGS.serviceCoverage,
  };
}

async function assertAdminSession(): Promise<AdminUser> {
  const supabase = getSupabaseClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw new Error(sessionError.message);
  const user = sessionData.session?.user;
  if (!user) throw new Error('Unauthorized. Administrator authentication is required.');

  const { data: adminRow, error: adminErr } = await supabase
    .from('admin_users')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (adminErr || !adminRow) {
    await supabase.auth.signOut().catch(() => {});
    throw new Error('Unauthorized. This account is not an active administrator.');
  }

  return {
    id: 1,
    username: String(adminRow.email ?? user.email ?? 'admin'),
    email: String(adminRow.email ?? user.email ?? ''),
    name: String(adminRow.name ?? 'Administrator'),
    role: 'admin',
    createdAt: String(adminRow.created_at ?? user.created_at ?? ''),
  };
}

function dataUrlToBlob(dataUrl: string): { blob: Blob; ext: string } {
  const match = /^data:(image\/(png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) {
    throw new Error('Only valid PNG, JPEG, or WebP images are supported.');
  }
  const mime = match[1];
  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  const binary = atob(match[3]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  if (bytes.length > 8 * 1024 * 1024) {
    throw new Error('Uploaded image exceeds 8 MB size limit.');
  }
  return { blob: new Blob([bytes], { type: mime }), ext };
}

function isMissingSchemaError(err: { code?: string; message?: string } | null | undefined): boolean {
  if (!err) return false;
  if (err.code === 'PGRST205' || err.code === 'PGRST202' || err.code === '42P01' || err.code === '42883') return true;
  return /schema cache|does not exist|Could not find the table|Could not find the function/i.test(err.message ?? '');
}

async function tryLocalPublicFallback<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') ?? '';
    if (!res.ok || !contentType.includes('application/json')) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const supabaseApi = {
  // Public
  async getBootstrap() {
    const supabase = getSupabaseClient();
    const [settingsRes, categoriesRes, countsRes, featuredRes, galleryRes, branchesRes] = await Promise.all([
      supabase.from('site_settings').select('key, value'),
      supabase.from('categories').select('*').eq('is_active', true).order('sort_order', { ascending: true }).order('id', { ascending: true }),
      supabase.from('products').select('category_id').eq('is_published', true),
      supabase
        .from('products')
        .select('*, categories(name, slug)')
        .eq('is_published', true)
        .eq('featured', true)
        .order('updated_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(8),
      supabase
        .from('gallery_items')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .order('id', { ascending: false }),
      supabase
        .from('branches')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .order('id', { ascending: true }),
    ]);

    const firstError =
      settingsRes.error ||
      categoriesRes.error ||
      featuredRes.error ||
      galleryRes.error ||
      branchesRes.error;

    if (firstError) {
      if (isMissingSchemaError(firstError)) {
        const localBoot = await tryLocalPublicFallback<{
          settings: SiteSettings;
          categories: Category[];
          featuredProducts: Product[];
          galleryItems: GalleryItem[];
          branches: BranchLocation[];
        }>('/api/public/bootstrap');
        if (localBoot) return localBoot;
        return {
          settings: DEFAULT_SETTINGS,
          categories: [],
          featuredProducts: [],
          galleryItems: [],
          branches: [],
        };
      }
      throw new Error(firstError.message);
    }

    const countMap = new Map<number, number>();
    for (const row of countsRes.data ?? []) {
      const cid = Number(row.category_id);
      countMap.set(cid, (countMap.get(cid) ?? 0) + 1);
    }

    return {
      settings: mapSettingsRows((settingsRes.data ?? []) as Array<{ key: string; value: string }>),
      categories: (categoriesRes.data ?? []).map((row) =>
        mapCategoryRow(row as Record<string, unknown>, countMap.get(Number(row.id)) ?? 0)
      ),
      featuredProducts: (featuredRes.data ?? []).map((row) => mapProductRow(row as Record<string, unknown>)),
      galleryItems: (galleryRes.data ?? []).map((row) => mapGalleryRow(row as Record<string, unknown>)),
      branches: (branchesRes.data ?? []).map((row) => mapBranchRow(row as Record<string, unknown>)),
    };
  },

  async getProducts(params?: { category?: string; search?: string; availability?: string }) {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('products')
      .select('*, categories!inner(name, slug, is_active)')
      .eq('is_published', true)
      .eq('categories.is_active', true);

    if (params?.category && params.category !== 'all') {
      query = query.eq('categories.slug', params.category);
    }
    if (params?.availability && (params.availability === 'Retail' || params.availability === 'Wholesale')) {
      query = query.in('availability_type', [params.availability, 'Both']);
    }

    const { data, error } = await query
      .order('featured', { ascending: false })
      .order('updated_at', { ascending: false })
      .order('id', { ascending: false });

    if (error) {
      if (isMissingSchemaError(error)) {
        const q = new URLSearchParams();
        if (params?.category) q.set('category', params.category);
        if (params?.search) q.set('search', params.search);
        if (params?.availability) q.set('availability', params.availability);
        const qs = q.toString();
        const localProds = await tryLocalPublicFallback<{ products: Product[] }>(
          `/api/public/products${qs ? `?${qs}` : ''}`
        );
        return localProds ?? { products: [] };
      }
      throw new Error(error.message);
    }

    let products = (data ?? []).map((row) => mapProductRow(row as Record<string, unknown>));
    if (params?.search?.trim()) {
      const q = params.search.trim().toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.categoryName ?? '').toLowerCase().includes(q)
      );
    }
    return { products };
  },

  async getProductBySlug(slug: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('products')
      .select('*, categories!inner(name, slug, is_active)')
      .eq('slug', slug)
      .eq('is_published', true)
      .eq('categories.is_active', true)
      .maybeSingle();

    if (error) {
      if (isMissingSchemaError(error)) {
        const localProd = await tryLocalPublicFallback<{ product: Product; relatedProducts: Product[] }>(
          `/api/public/products/${encodeURIComponent(slug)}`
        );
        if (localProd) return localProd;
      }
      throw new Error(error.message);
    }
    if (!data) throw new Error('Product not found.');

    const product = mapProductRow(data as Record<string, unknown>);
    const { data: relatedData, error: relErr } = await supabase
      .from('products')
      .select('*, categories(name, slug)')
      .eq('category_id', product.categoryId)
      .neq('id', product.id)
      .eq('is_published', true)
      .order('featured', { ascending: false })
      .order('id', { ascending: false })
      .limit(3);

    if (relErr) throw new Error(relErr.message);

    return {
      product,
      relatedProducts: (relatedData ?? []).map((row) => mapProductRow(row as Record<string, unknown>)),
    };
  },

  async submitEnquiry(payload: {
    customerName: string;
    mobileNumber: string;
    email?: string;
    productId?: number | null;
    productName: string;
    categoryName: string;
    quantity: string;
    enquiryType: 'Retail' | 'Wholesale';
    deliveryLocation: string;
    message?: string;
  }) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('submit_public_enquiry', {
      p_customer_name: payload.customerName,
      p_mobile_number: payload.mobileNumber,
      p_email: payload.email || null,
      p_product_id: payload.productId ?? null,
      p_product_name: payload.productName || 'General Enquiry',
      p_category_name: payload.categoryName || 'General',
      p_quantity: payload.quantity,
      p_enquiry_type: payload.enquiryType,
      p_delivery_location: payload.deliveryLocation,
      p_message: payload.message ?? '',
    });

    if (error) {
      if (isMissingSchemaError(error)) {
        const localRes = await tryLocalPublicFallback<{ enquiry: Enquiry }>('/api/public/enquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (localRes) return localRes;
      }
      throw new Error(error.message);
    }
    return { enquiry: mapEnquiryRow(data as Record<string, unknown>) };
  },

  async submitOrderRequest(payload: {
    customerName: string;
    mobileNumber: string;
    email?: string;
    deliveryLocation: string;
    orderType: 'Retail' | 'Wholesale';
    notes?: string;
    items: OrderItem[];
  }) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('submit_public_order', {
      p_customer_name: payload.customerName,
      p_mobile_number: payload.mobileNumber,
      p_email: payload.email || null,
      p_delivery_location: payload.deliveryLocation,
      p_order_type: payload.orderType,
      p_notes: payload.notes ?? '',
      p_items: payload.items,
    });

    if (error) {
      if (isMissingSchemaError(error)) {
        const localRes = await tryLocalPublicFallback<{ order: Order }>('/api/public/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (localRes) return localRes;
      }
      throw new Error(error.message);
    }
    return { order: mapOrderRow(data as Record<string, unknown>) };
  },

  // Auth
  async getAuthMe() {
    try {
      const user = await assertAdminSession();
      return { hasAdmin: true, authenticated: true, user };
    } catch {
      return { hasAdmin: true, authenticated: false, user: null };
    }
  },

  async setupAdmin(_payload: { name: string; username: string; email: string; password: string; recoveryCode: string }) {
    throw new Error('In Supabase mode, administrator accounts are created in your Supabase Authentication dashboard.');
  },

  async loginAdmin(payload: { identifier: string; password: string }) {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: payload.identifier.trim(),
      password: payload.password,
    });
    if (error) throw new Error(error.message);
    const user = await assertAdminSession();
    return { user };
  },

  async logoutAdmin() {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    return { ok: true };
  },

  async resetAdminPassword(payload: { identifier: string; recoveryCode?: string; newPassword?: string }) {
    const supabase = getSupabaseClient();
    const email = payload.identifier.trim();
    if (!email || !email.includes('@')) {
      throw new Error('Please enter your registered administrator email address.');
    }

    const configuredSiteUrl = String(import.meta.env.VITE_SITE_URL ?? '').trim().replace(/\/+$/, '');
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const isLoopback = hostname === '127.0.0.1' || hostname.endsWith('.local') || hostname === 'localhost';
    const baseUrl = isLoopback && configuredSiteUrl ? configuredSiteUrl : currentOrigin || configuredSiteUrl;
    const redirectTo = `${baseUrl}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw new Error(error.message);
    return {
      ok: true,
      message: 'Password reset email sent. Check your inbox and open the reset link to set a new password.',
    };
  },

  async completeRecoveryPassword(newPassword: string) {
    const supabase = getSupabaseClient();
    if (newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long.');
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
    return { ok: true };
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const admin = await assertAdminSession();
    if (newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long.');
    }
    const supabase = getSupabaseClient();
    const { error: verifyErr } = await supabase.auth.signInWithPassword({
      email: admin.email,
      password: currentPassword,
    });
    if (verifyErr) throw new Error('Current password is incorrect.');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
    return { ok: true };
  },

  async updateRecoveryCode() {
    throw new Error('Password recovery is managed securely via your Supabase Administrator email.');
  },

  // Admin Overview
  async getAdminOverview(): Promise<AdminOverviewStats> {
    await assertAdminSession();
    const supabase = getSupabaseClient();
    const [enqRes, ordRes, prodRes] = await Promise.all([
      supabase.from('enquiries').select('*').order('created_at', { ascending: false }).order('id', { ascending: false }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }).order('id', { ascending: false }),
      supabase.from('products').select('id, is_published'),
    ]);

    if (enqRes.error) throw new Error(enqRes.error.message);
    if (ordRes.error) throw new Error(ordRes.error.message);
    if (prodRes.error) throw new Error(prodRes.error.message);

    const enquiries = (enqRes.data ?? []).map((r) => mapEnquiryRow(r as Record<string, unknown>));
    const orders = (ordRes.data ?? []).map((r) => mapOrderRow(r as Record<string, unknown>));
    const products = prodRes.data ?? [];

    return {
      totalEnquiries: enquiries.length,
      newEnquiries: enquiries.filter((e) => e.status === 'New').length,
      pendingQuotations:
        enquiries.filter((e) => e.status === 'New' || e.status === 'Contacted').length +
        orders.filter((o) => o.status === 'New' || o.status === 'Contacted' || o.status === 'Quotation Sent').length,
      confirmedOrders: orders.filter((o) => o.status === 'Confirmed' || o.status === 'Processing').length,
      completedOrders: orders.filter((o) => o.status === 'Completed').length,
      totalProducts: products.length,
      publishedProducts: products.filter((p) => Boolean(p.is_published)).length,
      recentEnquiries: enquiries.slice(0, 5),
      recentOrders: orders.slice(0, 5),
    };
  },

  // Admin Enquiries
  async getAdminEnquiries(params?: { search?: string; status?: string; type?: string; from?: string; to?: string }) {
    await assertAdminSession();
    const supabase = getSupabaseClient();
    let query = supabase.from('enquiries').select('*').order('created_at', { ascending: false }).order('id', { ascending: false });

    if (params?.status && params.status !== 'All') query = query.eq('status', params.status);
    if (params?.type && params.type !== 'All') query = query.eq('enquiry_type', params.type);
    if (params?.from) query = query.gte('created_at', `${params.from}T00:00:00.000Z`);
    if (params?.to) query = query.lte('created_at', `${params.to}T23:59:59.999Z`);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    let enquiries = (data ?? []).map((r) => mapEnquiryRow(r as Record<string, unknown>));
    if (params?.search?.trim()) {
      const q = params.search.trim().toLowerCase();
      enquiries = enquiries.filter(
        (e) =>
          e.enquiryCode.toLowerCase().includes(q) ||
          e.customerName.toLowerCase().includes(q) ||
          e.mobileNumber.toLowerCase().includes(q) ||
          e.productName.toLowerCase().includes(q) ||
          e.deliveryLocation.toLowerCase().includes(q)
      );
    }
    return { enquiries };
  },

  async updateAdminEnquiry(id: number, payload: { status?: string; internalNotes?: string }) {
    await assertAdminSession();
    const supabase = getSupabaseClient();
    const updates: Record<string, unknown> = {};
    if (payload.status !== undefined) updates.status = payload.status;
    if (payload.internalNotes !== undefined) updates.internal_notes = payload.internalNotes;

    const { data, error } = await supabase.from('enquiries').update(updates).eq('id', id).select('*').single();
    if (error) throw new Error(error.message);
    return { enquiry: mapEnquiryRow(data as Record<string, unknown>) };
  },

  async deleteAdminEnquiry(id: number) {
    await assertAdminSession();
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('enquiries').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { ok: true };
  },

  async convertEnquiryToOrder(id: number, payload?: { totalAmount?: number | null; status?: string }) {
    await assertAdminSession();
    const supabase = getSupabaseClient();

    const { data: existing, error: fetchErr } = await supabase.from('enquiries').select('*').eq('id', id).single();
    if (fetchErr || !existing) throw new Error('Enquiry not found.');

    const enquiry = mapEnquiryRow(existing as Record<string, unknown>);
    const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    const year = new Date().getFullYear();
    const orderCode = `RF-ORD-${year}-${(count ?? 0) + 1001}${Math.floor(10 + Math.random() * 89)}`;
    const status = payload?.status || 'Quotation Sent';
    const confirmedAt = status === 'Confirmed' ? new Date().toISOString() : null;

    const { data: createdOrder, error: insertErr } = await supabase
      .from('orders')
      .insert({
        order_code: orderCode,
        enquiry_id: enquiry.id,
        customer_name: enquiry.customerName,
        mobile_number: enquiry.mobileNumber,
        email: enquiry.email,
        delivery_location: enquiry.deliveryLocation,
        items_json: [
          {
            productId: enquiry.productId,
            productName: enquiry.productName || 'Custom Interior Material',
            categoryName: enquiry.categoryName || 'General',
            quantity: enquiry.quantity || '1',
          },
        ],
        order_type: enquiry.enquiryType,
        total_amount: payload?.totalAmount ?? null,
        status,
        notes: enquiry.message || enquiry.internalNotes || '',
        confirmed_at: confirmedAt,
      })
      .select('*')
      .single();

    if (insertErr) throw new Error(insertErr.message);

    await supabase.from('enquiries').update({ status: 'Converted to Order' }).eq('id', enquiry.id);

    return { order: mapOrderRow(createdOrder as Record<string, unknown>) };
  },

  // Admin Orders
  async getAdminOrders(params?: { search?: string; status?: string; from?: string; to?: string }) {
    await assertAdminSession();
    const supabase = getSupabaseClient();
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false }).order('id', { ascending: false });

    if (params?.status && params.status !== 'All') query = query.eq('status', params.status);
    if (params?.from) query = query.gte('created_at', `${params.from}T00:00:00.000Z`);
    if (params?.to) query = query.lte('created_at', `${params.to}T23:59:59.999Z`);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    let orders = (data ?? []).map((r) => mapOrderRow(r as Record<string, unknown>));
    if (params?.search?.trim()) {
      const q = params.search.trim().toLowerCase();
      orders = orders.filter(
        (o) =>
          o.orderCode.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.mobileNumber.toLowerCase().includes(q) ||
          o.deliveryLocation.toLowerCase().includes(q)
      );
    }
    return { orders };
  },

  async createAdminOrder(payload: Partial<Order>) {
    await assertAdminSession();
    const supabase = getSupabaseClient();
    const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    const year = new Date().getFullYear();
    const orderCode = `RF-ORD-${year}-${(count ?? 0) + 1001}${Math.floor(10 + Math.random() * 89)}`;
    const status = payload.status || 'New';

    const { data, error } = await supabase
      .from('orders')
      .insert({
        order_code: orderCode,
        enquiry_id: null,
        customer_name: String(payload.customerName ?? '').trim(),
        mobile_number: String(payload.mobileNumber ?? '').trim(),
        email: payload.email ? String(payload.email).trim() : null,
        delivery_location: String(payload.deliveryLocation ?? '').trim(),
        items_json: payload.items ?? [],
        order_type: payload.orderType === 'Wholesale' ? 'Wholesale' : 'Retail',
        total_amount: payload.totalAmount ?? null,
        status,
        notes: String(payload.notes ?? '').trim(),
        confirmed_at: status === 'Confirmed' ? new Date().toISOString() : null,
      })
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return { order: mapOrderRow(data as Record<string, unknown>) };
  },

  async updateAdminOrder(id: number, payload: Partial<Order>) {
    await assertAdminSession();
    const supabase = getSupabaseClient();
    const { data: existing, error: fetchErr } = await supabase.from('orders').select('*').eq('id', id).single();
    if (fetchErr || !existing) throw new Error('Order not found.');

    const updates: Record<string, unknown> = {};
    if (payload.status !== undefined) {
      updates.status = payload.status;
      if (payload.status === 'Confirmed' && !existing.confirmed_at) {
        updates.confirmed_at = new Date().toISOString();
      }
    }
    if (payload.totalAmount !== undefined) updates.total_amount = payload.totalAmount;
    if (payload.notes !== undefined) updates.notes = payload.notes;
    if (payload.items !== undefined) updates.items_json = payload.items;

    const { data, error } = await supabase.from('orders').update(updates).eq('id', id).select('*').single();
    if (error) throw new Error(error.message);
    return { order: mapOrderRow(data as Record<string, unknown>) };
  },

  async deleteAdminOrder(id: number) {
    await assertAdminSession();
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { ok: true };
  },

  // Admin Products
  async getAdminProducts() {
    await assertAdminSession();
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name, slug)')
      .order('updated_at', { ascending: false })
      .order('id', { ascending: false });
    if (error) throw new Error(error.message);
    return { products: (data ?? []).map((r) => mapProductRow(r as Record<string, unknown>)) };
  },

  async createAdminProduct(payload: Partial<Product>) {
    await assertAdminSession();
    const supabase = getSupabaseClient();
    const name = String(payload.name ?? '').trim();
    if (!name || !payload.categoryId) throw new Error('Product name and category are required.');

    const slug = await makeUniqueSlug(slugify(name), 'products');
    const { data, error } = await supabase
      .from('products')
      .insert({
        name,
        slug,
        category_id: Number(payload.categoryId),
        description: String(payload.description ?? '').trim(),
        images_json: Array.isArray(payload.images) ? payload.images.filter(Boolean) : [],
        specifications_json: Array.isArray(payload.specifications) ? payload.specifications : [],
        colors_designs_json: Array.isArray(payload.colorsDesigns) ? payload.colorsDesigns : [],
        price: payload.price !== undefined && payload.price !== null ? Number(payload.price) : null,
        price_unit: payload.priceUnit ? String(payload.priceUnit).trim() : null,
        stock_status: payload.stockStatus || 'In Stock',
        availability_type: payload.availabilityType || 'Both',
        is_published: payload.isPublished !== false,
        featured: Boolean(payload.featured),
      })
      .select('*, categories(name, slug)')
      .single();

    if (error) throw new Error(error.message);
    return { product: mapProductRow(data as Record<string, unknown>) };
  },

  async updateAdminProduct(id: number, payload: Partial<Product>) {
    await assertAdminSession();
    const supabase = getSupabaseClient();
    const { data: existing, error: fetchErr } = await supabase.from('products').select('*').eq('id', id).single();
    if (fetchErr || !existing) throw new Error('Product not found.');

    const updates: Record<string, unknown> = {};
    if (payload.name !== undefined) {
      const trimmed = payload.name.trim();
      if (!trimmed) throw new Error('Product name cannot be empty.');
      updates.name = trimmed;
      if (trimmed !== existing.name) {
        updates.slug = await makeUniqueSlug(slugify(trimmed), 'products', id);
      }
    }
    if (payload.categoryId !== undefined) updates.category_id = Number(payload.categoryId);
    if (payload.description !== undefined) updates.description = payload.description;
    if (payload.images !== undefined) updates.images_json = payload.images.filter(Boolean);
    if (payload.specifications !== undefined) updates.specifications_json = payload.specifications;
    if (payload.colorsDesigns !== undefined) updates.colors_designs_json = payload.colorsDesigns;
    if (payload.price !== undefined) updates.price = payload.price;
    if (payload.priceUnit !== undefined) updates.price_unit = payload.priceUnit;
    if (payload.stockStatus !== undefined) updates.stock_status = payload.stockStatus;
    if (payload.availabilityType !== undefined) updates.availability_type = payload.availabilityType;
    if (payload.isPublished !== undefined) updates.is_published = payload.isPublished;
    if (payload.featured !== undefined) updates.featured = payload.featured;

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select('*, categories(name, slug)')
      .single();

    if (error) throw new Error(error.message);
    return { product: mapProductRow(data as Record<string, unknown>) };
  },

  async deleteAdminProduct(id: number) {
    await assertAdminSession();
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { ok: true };
  },

  // Admin Categories
  async getAdminCategories() {
    await assertAdminSession();
    const supabase = getSupabaseClient();
    const [catRes, prodRes] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order', { ascending: true }).order('id', { ascending: true }),
      supabase.from('products').select('category_id'),
    ]);
    if (catRes.error) throw new Error(catRes.error.message);
    const counts = new Map<number, number>();
    for (const r of prodRes.data ?? []) {
      const cid = Number(r.category_id);
      counts.set(cid, (counts.get(cid) ?? 0) + 1);
    }
    return {
      categories: (catRes.data ?? []).map((r) =>
        mapCategoryRow(r as Record<string, unknown>, counts.get(Number(r.id)) ?? 0)
      ),
    };
  },

  async createAdminCategory(payload: Partial<Category>) {
    await assertAdminSession();
    const supabase = getSupabaseClient();
    const name = String(payload.name ?? '').trim();
    if (!name) throw new Error('Category name is required.');
    const slug = await makeUniqueSlug(slugify(name), 'categories');

    const { data, error } = await supabase
      .from('categories')
      .insert({
        name,
        slug,
        description: String(payload.description ?? '').trim(),
        image_url: String(payload.imageUrl ?? '').trim(),
        sort_order: Number(payload.sortOrder ?? 10),
        is_active: payload.isActive !== false,
      })
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return { category: mapCategoryRow(data as Record<string, unknown>) };
  },

  async updateAdminCategory(id: number, payload: Partial<Category>) {
    await assertAdminSession();
    const supabase = getSupabaseClient();
    const { data: existing, error: fetchErr } = await supabase.from('categories').select('*').eq('id', id).single();
    if (fetchErr || !existing) throw new Error('Category not found.');

    const updates: Record<string, unknown> = {};
    if (payload.name !== undefined) {
      const trimmed = payload.name.trim();
      updates.name = trimmed;
      if (trimmed !== existing.name) {
        updates.slug = await makeUniqueSlug(slugify(trimmed), 'categories', id);
      }
    }
    if (payload.description !== undefined) updates.description = payload.description;
    if (payload.imageUrl !== undefined) updates.image_url = payload.imageUrl;
    if (payload.sortOrder !== undefined) updates.sort_order = payload.sortOrder;
    if (payload.isActive !== undefined) updates.is_active = payload.isActive;

    const { data, error } = await supabase.from('categories').update(updates).eq('id', id).select('*').single();
    if (error) throw new Error(error.message);
    return { category: mapCategoryRow(data as Record<string, unknown>) };
  },

  async deleteAdminCategory(id: number) {
    await assertAdminSession();
    const supabase = getSupabaseClient();
    const { count } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('category_id', id);
    if ((count ?? 0) > 0) {
      throw new Error('Cannot delete category while products are assigned to it.');
    }
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { ok: true };
  },

  // Admin Gallery
  async getAdminGallery() {
    await assertAdminSession();
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('gallery_items')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('id', { ascending: false });
    if (error) throw new Error(error.message);
    return { galleryItems: (data ?? []).map((r) => mapGalleryRow(r as Record<string, unknown>)) };
  },

  async createAdminGalleryItem(payload: Partial<GalleryItem>) {
    await assertAdminSession();
    const supabase = getSupabaseClient();
    const title = String(payload.title ?? '').trim();
    const imageUrl = String(payload.imageUrl ?? '').trim();
    if (!title || !imageUrl) throw new Error('Title and image are required for gallery items.');

    const { data, error } = await supabase
      .from('gallery_items')
      .insert({
        title,
        category: String(payload.category ?? 'Interior Application').trim(),
        location_label: String(payload.locationLabel ?? '').trim(),
        description: String(payload.description ?? '').trim(),
        image_url: imageUrl,
        sort_order: Number(payload.sortOrder ?? 0),
        is_published: payload.isPublished !== false,
      })
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return { galleryItem: mapGalleryRow(data as Record<string, unknown>) };
  },

  async updateAdminGalleryItem(id: number, payload: Partial<GalleryItem>) {
    await assertAdminSession();
    const supabase = getSupabaseClient();
    const updates: Record<string, unknown> = {};
    if (payload.title !== undefined) updates.title = payload.title.trim();
    if (payload.category !== undefined) updates.category = payload.category.trim();
    if (payload.locationLabel !== undefined) updates.location_label = payload.locationLabel.trim();
    if (payload.description !== undefined) updates.description = payload.description.trim();
    if (payload.imageUrl !== undefined) updates.image_url = payload.imageUrl.trim();
    if (payload.sortOrder !== undefined) updates.sort_order = payload.sortOrder;
    if (payload.isPublished !== undefined) updates.is_published = payload.isPublished;

    const { data, error } = await supabase.from('gallery_items').update(updates).eq('id', id).select('*').single();
    if (error) throw new Error(error.message);
    return { galleryItem: mapGalleryRow(data as Record<string, unknown>) };
  },

  async deleteAdminGalleryItem(id: number) {
    await assertAdminSession();
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('gallery_items').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { ok: true };
  },

  // Admin Settings
  async getAdminSettings() {
    await assertAdminSession();
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('site_settings').select('key, value');
    if (error) throw new Error(error.message);
    return { settings: mapSettingsRows((data ?? []) as Array<{ key: string; value: string }>) };
  },

  async updateAdminSettings(payload: Partial<SiteSettings>) {
    await assertAdminSession();
    const supabase = getSupabaseClient();
    const allowedKeys: Array<keyof SiteSettings> = [
      'brandName',
      'heroHeadline',
      'heroDescription',
      'heroImage',
      'aboutHeading',
      'aboutBody',
      'aboutImage',
      'whatsappNumber',
      'phoneNumber',
      'contactEmail',
      'address',
      'businessHours',
      'serviceCoverage',
    ];
    const rows = allowedKeys
      .filter((k) => payload[k] !== undefined)
      .map((k) => ({ key: k, value: String(payload[k] ?? '').trim() }));

    if (rows.length > 0) {
      const { error } = await supabase.from('site_settings').upsert(rows, { onConflict: 'key' });
      if (error) throw new Error(error.message);
    }
    return this.getAdminSettings();
  },

  // Admin Branches
  async getAdminBranches() {
    await assertAdminSession();
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });
    if (error) throw new Error(error.message);
    return { branches: (data ?? []).map((r) => mapBranchRow(r as Record<string, unknown>)) };
  },

  async createAdminBranch(payload: Partial<BranchLocation>) {
    await assertAdminSession();
    const supabase = getSupabaseClient();
    const branchName = String(payload.branchName ?? '').trim();
    const locationName = String(payload.locationName ?? '').trim();
    const mapLink = String(payload.mapLink ?? '').trim();
    if (!branchName || !locationName) throw new Error('Branch name and location name are required.');
    if (mapLink && !/^https?:\/\//i.test(mapLink)) {
      throw new Error('Location map link must start with https:// or http://');
    }

    const { data, error } = await supabase
      .from('branches')
      .insert({
        branch_name: branchName,
        location_name: locationName,
        map_link: mapLink,
        phone_number: String(payload.phoneNumber ?? '').trim(),
        whatsapp_number: String(payload.whatsappNumber ?? '').trim(),
        business_hours: String(payload.businessHours ?? '').trim(),
        sort_order: Number(payload.sortOrder ?? 0),
        is_published: payload.isPublished !== false,
      })
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return { branch: mapBranchRow(data as Record<string, unknown>) };
  },

  async updateAdminBranch(id: number, payload: Partial<BranchLocation>) {
    await assertAdminSession();
    const supabase = getSupabaseClient();
    const updates: Record<string, unknown> = {};
    if (payload.branchName !== undefined) updates.branch_name = payload.branchName.trim();
    if (payload.locationName !== undefined) updates.location_name = payload.locationName.trim();
    if (payload.mapLink !== undefined) {
      const link = payload.mapLink.trim();
      if (link && !/^https?:\/\//i.test(link)) {
        throw new Error('Location map link must start with https:// or http://');
      }
      updates.map_link = link;
    }
    if (payload.phoneNumber !== undefined) updates.phone_number = payload.phoneNumber.trim();
    if (payload.whatsappNumber !== undefined) updates.whatsapp_number = payload.whatsappNumber.trim();
    if (payload.businessHours !== undefined) updates.business_hours = payload.businessHours.trim();
    if (payload.sortOrder !== undefined) updates.sort_order = payload.sortOrder;
    if (payload.isPublished !== undefined) updates.is_published = payload.isPublished;

    const { data, error } = await supabase.from('branches').update(updates).eq('id', id).select('*').single();
    if (error) throw new Error(error.message);
    return { branch: mapBranchRow(data as Record<string, unknown>) };
  },

  async deleteAdminBranch(id: number) {
    await assertAdminSession();
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('branches').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { ok: true };
  },

  // Admin Reports
  async getAdminReports(params?: { from?: string; to?: string }) {
    await assertAdminSession();
    const supabase = getSupabaseClient();
    let enqQuery = supabase.from('enquiries').select('*').order('created_at', { ascending: false });
    let ordQuery = supabase.from('orders').select('*').order('created_at', { ascending: false });

    if (params?.from) {
      enqQuery = enqQuery.gte('created_at', `${params.from}T00:00:00.000Z`);
      ordQuery = ordQuery.gte('created_at', `${params.from}T00:00:00.000Z`);
    }
    if (params?.to) {
      enqQuery = enqQuery.lte('created_at', `${params.to}T23:59:59.999Z`);
      ordQuery = ordQuery.lte('created_at', `${params.to}T23:59:59.999Z`);
    }

    const [enqRes, ordRes] = await Promise.all([enqQuery, ordQuery]);
    if (enqRes.error) throw new Error(enqRes.error.message);
    if (ordRes.error) throw new Error(ordRes.error.message);

    return {
      enquiries: (enqRes.data ?? []).map((r) => mapEnquiryRow(r as Record<string, unknown>)),
      orders: (ordRes.data ?? []).map((r) => mapOrderRow(r as Record<string, unknown>)),
    };
  },

  // Image Upload via Supabase Storage ('media' bucket)
  async uploadImage(dataUrl: string, fileName: string) {
    await assertAdminSession();
    const supabase = getSupabaseClient();
    const { blob, ext } = dataUrlToBlob(dataUrl);
    const safeBase = slugify(fileName.replace(/\.[^.]+$/, '')).slice(0, 32);
    const objectPath = `uploads/${safeBase}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage.from('media').upload(objectPath, blob, {
      contentType: blob.type,
      upsert: false,
    });
    if (error) throw new Error(error.message);

    const { data } = supabase.storage.from('media').getPublicUrl(objectPath);
    return { url: data.publicUrl };
  },
};
