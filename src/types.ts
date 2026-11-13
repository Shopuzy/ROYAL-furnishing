export type AvailabilityType = 'Both' | 'Retail' | 'Wholesale';
export type StockStatus = 'In Stock' | 'Low Stock' | 'Made to Order' | 'Out of Stock';
export type EnquiryType = 'Retail' | 'Wholesale';
export type EnquiryStatus = 'New' | 'Contacted' | 'Quotation Sent' | 'Converted to Order' | 'Closed';
export type OrderStatus =
  | 'New'
  | 'Contacted'
  | 'Quotation Sent'
  | 'Confirmed'
  | 'Processing'
  | 'Completed'
  | 'Cancelled';

export interface ProductColorDesign {
  name: string;
  hex?: string;
  finish?: string;
}

export interface ProductSpecification {
  label: string;
  value: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
  productCount?: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  categoryId: number;
  categoryName?: string;
  categorySlug?: string;
  description: string;
  images: string[];
  specifications: ProductSpecification[];
  colorsDesigns: ProductColorDesign[];
  price: number | null;
  priceUnit: string | null;
  stockStatus: StockStatus;
  availabilityType: AvailabilityType;
  isPublished: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Enquiry {
  id: number;
  enquiryCode: string;
  customerName: string;
  mobileNumber: string;
  email: string | null;
  productId: number | null;
  productName: string;
  categoryName: string;
  quantity: string;
  enquiryType: EnquiryType;
  deliveryLocation: string;
  message: string;
  status: EnquiryStatus;
  internalNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId?: number | null;
  productName: string;
  categoryName: string;
  quantity: string;
  finish?: string;
  unitPrice?: number | null;
}

export interface Order {
  id: number;
  orderCode: string;
  enquiryId: number | null;
  customerName: string;
  mobileNumber: string;
  email: string | null;
  deliveryLocation: string;
  items: OrderItem[];
  orderType: EnquiryType;
  totalAmount: number | null;
  status: OrderStatus;
  notes: string;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryItem {
  id: number;
  title: string;
  category: string;
  locationLabel: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
}

export interface SiteSettings {
  brandName: string;
  heroHeadline: string;
  heroDescription: string;
  heroImage: string;
  aboutHeading: string;
  aboutBody: string;
  aboutImage: string;
  whatsappNumber: string;
  phoneNumber: string;
  contactEmail: string;
  address: string;
  businessHours: string;
  serviceCoverage: string;
}

export interface BranchLocation {
  id: number;
  branchName: string;
  locationName: string;
  mapLink: string;
  phoneNumber: string;
  whatsappNumber: string;
  businessHours: string;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export interface AdminOverviewStats {
  totalEnquiries: number;
  newEnquiries: number;
  pendingQuotations: number;
  confirmedOrders: number;
  completedOrders: number;
  totalProducts: number;
  publishedProducts: number;
  recentEnquiries: Enquiry[];
  recentOrders: Order[];
}
