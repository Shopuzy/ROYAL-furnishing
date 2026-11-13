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
  SiteSettings,
} from '../types';
import { isSupabaseConfigured } from './supabase';
import { supabaseApi } from './supabaseApi';

export const isSupabaseMode = isSupabaseConfigured();

const TOKEN_STORAGE_KEY = 'rf_admin_bearer_token';
let inMemoryAdminToken: string | null = null;

function getStoredAdminToken(): string | null {
  if (inMemoryAdminToken) return inMemoryAdminToken;
  try {
    const saved = window.sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (saved) {
      inMemoryAdminToken = saved;
      return saved;
    }
  } catch {
    // Browser blocks web storage (e.g., strict privacy mode or third-party iframe); keep in-memory token only.
  }
  return null;
}

function setStoredAdminToken(token: string | null): void {
  inMemoryAdminToken = token;
  try {
    if (token) {
      window.sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage SecurityError in locked-down browsers.
  }
}

async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getStoredAdminToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options?.headers as Record<string, string> | undefined) ?? {}),
  };
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    credentials: 'include',
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && url.startsWith('/api/admin/')) {
      setStoredAdminToken(null);
    }
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export interface BootstrapResponse {
  settings: SiteSettings;
  categories: Category[];
  featuredProducts: Product[];
  galleryItems: GalleryItem[];
  branches: BranchLocation[];
}

export interface AuthMeResponse {
  hasAdmin: boolean;
  authenticated: boolean;
  user: AdminUser | null;
}

const localApi = {
  // Public
  getBootstrap: () => requestJson<BootstrapResponse>('/api/public/bootstrap'),
  getProducts: (params?: { category?: string; search?: string; availability?: string }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set('category', params.category);
    if (params?.search) q.set('search', params.search);
    if (params?.availability) q.set('availability', params.availability);
    const qs = q.toString();
    return requestJson<{ products: Product[] }>(`/api/public/products${qs ? `?${qs}` : ''}`);
  },
  getProductBySlug: (slug: string) =>
    requestJson<{ product: Product; relatedProducts: Product[] }>(`/api/public/products/${encodeURIComponent(slug)}`),
  submitEnquiry: (payload: {
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
  }) =>
    requestJson<{ enquiry: Enquiry }>('/api/public/enquiries', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  submitOrderRequest: (payload: {
    customerName: string;
    mobileNumber: string;
    email?: string;
    deliveryLocation: string;
    orderType: 'Retail' | 'Wholesale';
    notes?: string;
    items: OrderItem[];
  }) =>
    requestJson<{ order: Order }>('/api/public/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Auth
  getAuthMe: () => requestJson<AuthMeResponse>('/api/auth/me'),
  setupAdmin: async (payload: {
    name: string;
    username: string;
    email: string;
    password: string;
    recoveryCode: string;
  }) => {
    const res = await requestJson<{ user: AdminUser; token?: string }>('/api/auth/setup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.token) setStoredAdminToken(res.token);
    return { user: res.user };
  },
  loginAdmin: async (payload: { identifier: string; password: string }) => {
    const res = await requestJson<{ user: AdminUser; token?: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.token) setStoredAdminToken(res.token);
    return { user: res.user };
  },
  logoutAdmin: async () => {
    try {
      return await requestJson<{ ok: boolean }>('/api/auth/logout', {
        method: 'POST',
      });
    } finally {
      setStoredAdminToken(null);
    }
  },
  resetAdminPassword: (payload: { identifier: string; recoveryCode?: string; newPassword?: string }) =>
    requestJson<{ ok: boolean; message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  completeRecoveryPassword: async (_newPassword: string) => ({ ok: true }),

  // Admin
  getAdminOverview: () => requestJson<AdminOverviewStats>('/api/admin/overview'),
  getAdminEnquiries: (params?: { search?: string; status?: string; type?: string; from?: string; to?: string }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.status) q.set('status', params.status);
    if (params?.type) q.set('type', params.type);
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    const qs = q.toString();
    return requestJson<{ enquiries: Enquiry[] }>(`/api/admin/enquiries${qs ? `?${qs}` : ''}`);
  },
  updateAdminEnquiry: (id: number, payload: { status?: string; internalNotes?: string }) =>
    requestJson<{ enquiry: Enquiry }>(`/api/admin/enquiries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteAdminEnquiry: (id: number) =>
    requestJson<{ ok: boolean }>(`/api/admin/enquiries/${id}`, {
      method: 'DELETE',
    }),
  convertEnquiryToOrder: (id: number, payload?: { totalAmount?: number | null; status?: string }) =>
    requestJson<{ order: Order }>(`/api/admin/enquiries/${id}/convert-order`, {
      method: 'POST',
      body: JSON.stringify(payload ?? {}),
    }),

  getAdminOrders: (params?: { search?: string; status?: string; from?: string; to?: string }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.status) q.set('status', params.status);
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    const qs = q.toString();
    return requestJson<{ orders: Order[] }>(`/api/admin/orders${qs ? `?${qs}` : ''}`);
  },
  createAdminOrder: (payload: Partial<Order>) =>
    requestJson<{ order: Order }>('/api/admin/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateAdminOrder: (id: number, payload: Partial<Order>) =>
    requestJson<{ order: Order }>(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteAdminOrder: (id: number) =>
    requestJson<{ ok: boolean }>(`/api/admin/orders/${id}`, {
      method: 'DELETE',
    }),

  getAdminProducts: () => requestJson<{ products: Product[] }>('/api/admin/products'),
  createAdminProduct: (payload: Partial<Product>) =>
    requestJson<{ product: Product }>('/api/admin/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateAdminProduct: (id: number, payload: Partial<Product>) =>
    requestJson<{ product: Product }>(`/api/admin/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteAdminProduct: (id: number) =>
    requestJson<{ ok: boolean }>(`/api/admin/products/${id}`, {
      method: 'DELETE',
    }),

  getAdminCategories: () => requestJson<{ categories: Category[] }>('/api/admin/categories'),
  createAdminCategory: (payload: Partial<Category>) =>
    requestJson<{ category: Category }>('/api/admin/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateAdminCategory: (id: number, payload: Partial<Category>) =>
    requestJson<{ category: Category }>(`/api/admin/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteAdminCategory: (id: number) =>
    requestJson<{ ok: boolean }>(`/api/admin/categories/${id}`, {
      method: 'DELETE',
    }),

  getAdminGallery: () => requestJson<{ galleryItems: GalleryItem[] }>('/api/admin/gallery'),
  createAdminGalleryItem: (payload: Partial<GalleryItem>) =>
    requestJson<{ galleryItem: GalleryItem }>('/api/admin/gallery', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateAdminGalleryItem: (id: number, payload: Partial<GalleryItem>) =>
    requestJson<{ galleryItem: GalleryItem }>(`/api/admin/gallery/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteAdminGalleryItem: (id: number) =>
    requestJson<{ ok: boolean }>(`/api/admin/gallery/${id}`, {
      method: 'DELETE',
    }),

  getAdminSettings: () => requestJson<{ settings: SiteSettings }>('/api/admin/settings'),
  updateAdminSettings: (payload: Partial<SiteSettings>) =>
    requestJson<{ settings: SiteSettings }>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  getAdminBranches: () => requestJson<{ branches: BranchLocation[] }>('/api/admin/branches'),
  createAdminBranch: (payload: Partial<BranchLocation>) =>
    requestJson<{ branch: BranchLocation }>('/api/admin/branches', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateAdminBranch: (id: number, payload: Partial<BranchLocation>) =>
    requestJson<{ branch: BranchLocation }>(`/api/admin/branches/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteAdminBranch: (id: number) =>
    requestJson<{ ok: boolean }>(`/api/admin/branches/${id}`, {
      method: 'DELETE',
    }),

  getAdminReports: (params?: { from?: string; to?: string }) => {
    const q = new URLSearchParams();
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    const qs = q.toString();
    return requestJson<{ enquiries: Enquiry[]; orders: Order[] }>(`/api/admin/reports${qs ? `?${qs}` : ''}`);
  },

  uploadImage: (dataUrl: string, fileName: string) =>
    requestJson<{ url: string }>('/api/admin/upload', {
      method: 'POST',
      body: JSON.stringify({ dataUrl, fileName }),
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    requestJson<{ ok: boolean }>('/api/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  updateRecoveryCode: (currentPassword: string, newRecoveryCode: string) =>
    requestJson<{ ok: boolean }>('/api/admin/update-recovery-code', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newRecoveryCode }),
    }),
};

export const api = isSupabaseMode ? supabaseApi : localApi;
