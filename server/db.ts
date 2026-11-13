import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import type {
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
} from '../src/types.ts';

const DB_PATH = path.resolve(process.cwd(), 'royal_furnishing.db');
let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!dbInstance) {
    dbInstance = new Database(DB_PATH);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');
    initializeSchema(dbInstance);
    seedInitialData(dbInstance);
  }
  return dbInstance;
}

function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      recovery_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      image_url TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      category_id INTEGER NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      images_json TEXT NOT NULL DEFAULT '[]',
      specifications_json TEXT NOT NULL DEFAULT '[]',
      colors_designs_json TEXT NOT NULL DEFAULT '[]',
      price REAL DEFAULT NULL,
      price_unit TEXT DEFAULT NULL,
      stock_status TEXT NOT NULL DEFAULT 'In Stock',
      availability_type TEXT NOT NULL DEFAULT 'Both',
      is_published INTEGER NOT NULL DEFAULT 1,
      featured INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS enquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enquiry_code TEXT NOT NULL UNIQUE,
      customer_name TEXT NOT NULL,
      mobile_number TEXT NOT NULL,
      email TEXT DEFAULT NULL,
      product_id INTEGER DEFAULT NULL,
      product_name TEXT NOT NULL DEFAULT '',
      category_name TEXT NOT NULL DEFAULT '',
      quantity TEXT NOT NULL DEFAULT '',
      enquiry_type TEXT NOT NULL DEFAULT 'Retail',
      delivery_location TEXT NOT NULL DEFAULT '',
      message TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'New',
      internal_notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_code TEXT NOT NULL UNIQUE,
      enquiry_id INTEGER DEFAULT NULL,
      customer_name TEXT NOT NULL,
      mobile_number TEXT NOT NULL,
      email TEXT DEFAULT NULL,
      delivery_location TEXT NOT NULL DEFAULT '',
      items_json TEXT NOT NULL DEFAULT '[]',
      order_type TEXT NOT NULL DEFAULT 'Retail',
      total_amount REAL DEFAULT NULL,
      status TEXT NOT NULL DEFAULT 'New',
      notes TEXT NOT NULL DEFAULT '',
      confirmed_at TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (enquiry_id) REFERENCES enquiries(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS gallery_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      location_label TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      image_url TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_name TEXT NOT NULL,
      location_name TEXT NOT NULL,
      map_link TEXT NOT NULL DEFAULT '',
      phone_number TEXT NOT NULL DEFAULT '',
      whatsapp_number TEXT NOT NULL DEFAULT '',
      business_hours TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_published ON products(is_published);
    CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status);
    CREATE INDEX IF NOT EXISTS idx_enquiries_created ON enquiries(created_at);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
  `);

  const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

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

function seedInitialData(db: Database.Database): void {
  // Seed default site settings if missing
  const insertSetting = db.prepare('INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)');
  for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
    insertSetting.run(k, String(v));
  }

  // Seed categories if empty
  const categoryCount = (db.prepare('SELECT COUNT(*) as c FROM categories').get() as { c: number }).c;
  if (categoryCount === 0) {
    const insertCat = db.prepare(`
      INSERT INTO categories (name, slug, description, image_url, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `);

    const seedCategories = [
      {
        name: 'Fluted Panels',
        slug: 'fluted-panels',
        description: 'Architectural WPC & timber-textured fluted louvers for warm feature walls and ceilings.',
        imageUrl: '/src/assets/images/cat_fluted_panels_1794552439261.jpg',
        sortOrder: 1,
      },
      {
        name: 'UV Sheets',
        slug: 'uv-sheets',
        description: 'Mirror-smooth, scratch-resistant high-gloss UV decorative sheets for modern cabinetry and walls.',
        imageUrl: '/src/assets/images/cat_uv_sheets_1794552440056.jpg',
        sortOrder: 2,
      },
      {
        name: 'UV Marble Sheets',
        slug: 'uv-marble-sheets',
        description: 'Bookmatched Calacatta and onyx marble-effect PVC & SPC cladding sheets with radiant gloss.',
        imageUrl: '/src/assets/images/cat_uv_marble_sheets_1794552441038.jpg',
        sortOrder: 3,
      },
      {
        name: 'Charcoal Panels',
        slug: 'charcoal-panels',
        description: 'Contemporary matte charcoal ribbed louvers and geometric moulding panels for bold interiors.',
        imageUrl: '/src/assets/images/cat_charcoal_panels_1794552441642.jpg',
        sortOrder: 4,
      },
      {
        name: 'Decorative Wall Panels',
        slug: 'decorative-wall-panels',
        description: 'Versatile veneer, brushed metallic, stone-textured, and linen-finish architectural wall boards.',
        imageUrl: '/src/assets/images/cat_decorative_wall_panels_1794552442030.jpg',
        sortOrder: 5,
      },
      {
        name: 'Other Interior Materials',
        slug: 'other-interior-materials',
        description: 'Brushed brass T-profiles, flexible stone veneers, acoustic felt slats, and PU stone panels.',
        imageUrl: '/src/assets/images/cat_other_materials_1794552442567.jpg',
        sortOrder: 6,
      },
    ];

    for (const c of seedCategories) {
      insertCat.run(c.name, c.slug, c.description, c.imageUrl, c.sortOrder);
    }
  }

  // Seed initial catalog products (no invented prices — price stays null until admin configures)
  const productCount = (db.prepare('SELECT COUNT(*) as c FROM products').get() as { c: number }).c;
  if (productCount === 0) {
    const getCatId = (slug: string): number => {
      const row = db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug) as { id: number } | undefined;
      return row ? row.id : 1;
    };

    const insertProd = db.prepare(`
      INSERT INTO products (
        name, slug, category_id, description, images_json, specifications_json,
        colors_designs_json, price, price_unit, stock_status, availability_type, is_published, featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, 1, ?)
    `);

    const seedProducts: Array<{
      name: string;
      slug: string;
      categorySlug: string;
      description: string;
      images: string[];
      specs: ProductSpecification[];
      colors: ProductColorDesign[];
      stockStatus: string;
      availabilityType: string;
      featured: number;
    }> = [
      {
        name: 'Imperial Walnut WPC Fluted Panel',
        slug: 'imperial-walnut-wpc-fluted-panel',
        categorySlug: 'fluted-panels',
        description:
          'Deep-grooved Wood Polymer Composite (WPC) fluted wall panel engineered for seamless tongue-and-groove installation across living rooms, television backdrops, and executive suites. Termite-proof, moisture-resistant, and acoustic-dampening.',
        images: [
          '/src/assets/images/cat_fluted_panels_1794552439261.jpg',
          '/src/assets/images/hero_luxury_living_room_1794552439172.jpg',
        ],
        specs: [
          { label: 'Panel Dimensions', value: '2900 mm × 160 mm (9.5 ft × 6.3 in)' },
          { label: 'Profile Thickness', value: '18 mm / 24 mm' },
          { label: 'Core Material', value: 'High-Density WPC Composite' },
          { label: 'Surface Finish', value: 'Matte Natural Timber Foil' },
          { label: 'Moisture & Termite', value: '100% Water & Termite Resistant' },
          { label: 'Application', value: 'Feature Walls, Ceilings, Receptions' },
        ],
        colors: [
          { name: 'Dark American Walnut', hex: '#4B3325', finish: 'Natural Woodgrain' },
          { name: 'Warm Burma Teak', hex: '#8A5A36', finish: 'Satin Grain' },
          { name: 'Smoked Chestnut', hex: '#5D4037', finish: 'Brushed Matte' },
          { name: 'Ivory Ash', hex: '#D6C8B4', finish: 'Light Grain' },
        ],
        stockStatus: 'In Stock',
        availabilityType: 'Both',
        featured: 1,
      },
      {
        name: 'Nordic Teak Narrow-Rib Louver Panel',
        slug: 'nordic-teak-narrow-rib-louver-panel',
        categorySlug: 'fluted-panels',
        description:
          'Fine-pitched vertical louver slats offering crisp linear shadows under recessed cove lighting. Lightweight, clean-edge interlocking joints ensure rapid dry installation without messy adhesives.',
        images: ['/src/assets/images/cat_fluted_panels_1794552439261.jpg'],
        specs: [
          { label: 'Panel Dimensions', value: '2900 mm × 195 mm' },
          { label: 'Profile Thickness', value: '12 mm' },
          { label: 'Core Material', value: 'Virgin PVC-Wood Composite' },
          { label: 'Installation', value: 'Interlocking Clip & Adhesive' },
        ],
        colors: [
          { name: 'Honey Teak', hex: '#9E6B43', finish: 'Matte' },
          { name: 'Natural Oak', hex: '#C39F76', finish: 'Matte' },
          { name: 'Espresso Timber', hex: '#38251C', finish: 'Textured' },
        ],
        stockStatus: 'In Stock',
        availabilityType: 'Both',
        featured: 0,
      },
      {
        name: 'Mirror-Gloss Ivory Acrylic UV Sheet',
        slug: 'mirror-gloss-ivory-acrylic-uv-sheet',
        categorySlug: 'uv-sheets',
        description:
          'Ultra-flat UV-cured decorative sheet with high-clarity specular reflection and a hardened scratch-resistant topcoat. Ideal for contemporary wardrobes, kitchen shutters, and minimalist wall panelling.',
        images: ['/src/assets/images/cat_uv_sheets_1794552440056.jpg'],
        specs: [
          { label: 'Sheet Size', value: '2440 mm × 1220 mm (8 ft × 4 ft)' },
          { label: 'Thickness', value: '1.2 mm / 3 mm' },
          { label: 'Surface Hardness', value: '4H Anti-Scratch UV Coat' },
          { label: 'Finish', value: 'Mirror High-Gloss' },
        ],
        colors: [
          { name: 'Warm Ivory', hex: '#F3EDE2', finish: 'High Gloss' },
          { name: 'Pearl White', hex: '#FAF9F6', finish: 'High Gloss' },
          { name: 'Champagne Sand', hex: '#C9B38C', finish: 'Metallic Gloss' },
        ],
        stockStatus: 'In Stock',
        availabilityType: 'Both',
        featured: 1,
      },
      {
        name: 'Calacatta Gold Bookmatched UV Marble Sheet',
        slug: 'calacatta-gold-bookmatched-uv-marble-sheet',
        categorySlug: 'uv-marble-sheets',
        description:
          'Full-height luxury marble-effect UV PVC sheet featuring luminous white Calacatta stone base with refined champagne-gold veining. Delivers the grandeur of natural Italian stone at a fraction of the weight and installation time.',
        images: [
          '/src/assets/images/cat_uv_marble_sheets_1794552441038.jpg',
          '/src/assets/images/hero_luxury_living_room_1794552439172.jpg',
        ],
        specs: [
          { label: 'Sheet Size', value: '2440 mm × 1220 mm (8 ft × 4 ft)' },
          { label: 'Thickness', value: '3.0 mm / 3.5 mm' },
          { label: 'Fire Rating', value: 'B1 Flame Retardant' },
          { label: 'Finish', value: 'Crystal UV Mirror Gloss' },
          { label: 'Matching', value: 'Bookmatched Pair Available' },
        ],
        colors: [
          { name: 'Calacatta Gold Vein', hex: '#F4F1EA', finish: 'Gloss Marble' },
          { name: 'Statuario Silver', hex: '#ECEEEF', finish: 'Gloss Marble' },
          { name: 'Nero Marquina Gold', hex: '#1F1E1C', finish: 'Gloss Marble' },
        ],
        stockStatus: 'In Stock',
        availabilityType: 'Both',
        featured: 1,
      },
      {
        name: 'Onyx Mirage Translucent-Look UV Marble Panel',
        slug: 'onyx-mirage-uv-marble-panel',
        categorySlug: 'uv-marble-sheets',
        description:
          'Richly layered onyx-inspired UV sheet crafted for hotel lobbies, living room media consoles, and boutique retail feature walls.',
        images: ['/src/assets/images/cat_uv_marble_sheets_1794552441038.jpg'],
        specs: [
          { label: 'Sheet Size', value: '2440 mm × 1220 mm' },
          { label: 'Thickness', value: '3.0 mm' },
          { label: 'Waterproof', value: '100% Moisture Sealed' },
          { label: 'Maintenance', value: 'Stain-Proof Wipe Clean' },
        ],
        colors: [
          { name: 'Honey Onyx', hex: '#D8BC8E', finish: 'High Gloss' },
          { name: 'Ivory Travertine', hex: '#E6DDD0', finish: 'Silk Gloss' },
        ],
        stockStatus: 'In Stock',
        availabilityType: 'Wholesale',
        featured: 0,
      },
      {
        name: 'Obsidian Matte Charcoal Louver Panel',
        slug: 'obsidian-matte-charcoal-louver-panel',
        categorySlug: 'charcoal-panels',
        description:
          'Architectural extruded polystyrene charcoal decorative panel combining crisp vertical micro-flutes and geometric relief surfaces. Engineered for low-glare luxury bedrooms, home theatres, and executive boardrooms.',
        images: ['/src/assets/images/cat_charcoal_panels_1794552441642.jpg'],
        specs: [
          { label: 'Panel Size', value: '2440 mm × 122 mm / 2440 mm × 600 mm' },
          { label: 'Thickness', value: '12 mm' },
          { label: 'Material', value: 'High-Density Virgin Polystyrene Charcoal' },
          { label: 'Finish', value: 'Velvet Matte & Brushed Metallic Accent' },
        ],
        colors: [
          { name: 'Obsidian Charcoal', hex: '#1E1D1C', finish: 'Velvet Matte' },
          { name: 'Graphite Bronze', hex: '#383430', finish: 'Brushed Charcoal' },
          { name: 'Warm Slate', hex: '#4B4B4D', finish: 'Textured Matte' },
        ],
        stockStatus: 'In Stock',
        availabilityType: 'Both',
        featured: 1,
      },
      {
        name: 'Artisan Multi-Finish Decorative Wall Board',
        slug: 'artisan-multi-finish-decorative-wall-board',
        categorySlug: 'decorative-wall-panels',
        description:
          'Curated designer wall cladding collection featuring smoked oak veneer, tactile travertine stone finish, and champagne brushed metal laminates on a stable moisture-resistant core.',
        images: ['/src/assets/images/cat_decorative_wall_panels_1794552442030.jpg'],
        specs: [
          { label: 'Board Size', value: '2440 mm × 1220 mm' },
          { label: 'Thickness', value: '5 mm / 8 mm WPC Foam Core' },
          { label: 'Joint System', value: 'Seamless Butt or Metal T-Trim' },
          { label: 'Application', value: 'Bedhead Walls, Foyers, Offices' },
        ],
        colors: [
          { name: 'Smoked Oak', hex: '#5A4634', finish: 'Wood Veneer Texture' },
          { name: 'Roman Travertine', hex: '#D8CEBE', finish: 'Stone Pore Matte' },
          { name: 'Champagne Gold Brushed', hex: '#C8A45D', finish: 'Anodized Metallic' },
          { name: 'Matte Slate', hex: '#2F3134', finish: 'Cleft Stone' },
        ],
        stockStatus: 'In Stock',
        availabilityType: 'Both',
        featured: 1,
      },
      {
        name: 'Champagne Brass Profiles & Flexible Stone Cladding',
        slug: 'champagne-brass-profiles-flexible-stone-cladding',
        categorySlug: 'other-interior-materials',
        description:
          'Complete architectural detailing suite including PVD-coated stainless steel & aluminium T-profiles, acoustic felt backing wood slats, lightweight PU stone panels, and flexible natural slate veneer sheets.',
        images: ['/src/assets/images/cat_other_materials_1794552442567.jpg'],
        specs: [
          { label: 'Profile Lengths', value: '2440 mm / 3050 mm' },
          { label: 'Profile Widths', value: '6 mm, 10 mm, 12 mm, 20 mm' },
          { label: 'PU Stone Dimensions', value: '1200 mm × 600 mm' },
          { label: 'Acoustic Felt', value: '9 mm Recycled PET Felt Backing' },
        ],
        colors: [
          { name: 'Brushed Champagne Gold', hex: '#C8A45D', finish: 'PVD Brushed' },
          { name: 'Rose Gold Mirror', hex: '#B98474', finish: 'PVD Mirror' },
          { name: 'Anodized Matte Black', hex: '#1B1A19', finish: 'Powder Coat' },
          { name: 'Limestone PU', hex: '#D9D0C1', finish: '3D Split Face' },
        ],
        stockStatus: 'In Stock',
        availabilityType: 'Both',
        featured: 1,
      },
    ];

    for (const p of seedProducts) {
      insertProd.run(
        p.name,
        p.slug,
        getCatId(p.categorySlug),
        p.description,
        JSON.stringify(p.images),
        JSON.stringify(p.specs),
        JSON.stringify(p.colors),
        p.stockStatus,
        p.availabilityType,
        p.featured
      );
    }
  }

  // Seed initial architectural gallery items
  const galleryCount = (db.prepare('SELECT COUNT(*) as c FROM gallery_items').get() as { c: number }).c;
  if (galleryCount === 0) {
    const insertGallery = db.prepare(`
      INSERT INTO gallery_items (title, category, location_label, description, image_url, sort_order, is_published)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);

    const seedGallery = [
      {
        title: 'Double-Height Living Room Media Wall',
        category: 'UV Marble & Fluted Panels',
        locationLabel: 'Residential Suite',
        description: 'Backlit Calacatta gold UV marble centrepiece framed by full-height walnut fluted WPC panels.',
        imageUrl: '/src/assets/images/hero_luxury_living_room_1794552439172.jpg',
        sortOrder: 1,
      },
      {
        title: 'Warm Cove-Lit Teak Louver Lounge',
        category: 'Fluted Panels',
        locationLabel: 'Private Villa',
        description: 'Continuous vertical fluted wall treatment paired with warm recessed ceiling illumination.',
        imageUrl: '/src/assets/images/cat_fluted_panels_1794552439261.jpg',
        sortOrder: 2,
      },
      {
        title: 'Architectural Charcoal Relief Wall',
        category: 'Charcoal Panels',
        locationLabel: 'Executive Penthouse',
        description: 'Geometric charcoal moulding and matte vertical louvers accented with brass pendant lighting.',
        imageUrl: '/src/assets/images/cat_charcoal_panels_1794552441642.jpg',
        sortOrder: 3,
      },
      {
        title: 'Calacatta Bookmatched Lobby Feature',
        category: 'UV Marble Sheets',
        locationLabel: 'Commercial Reception',
        description: 'Seamless mirror-gloss UV marble installation with grazing ceiling slot illumination.',
        imageUrl: '/src/assets/images/cat_uv_marble_sheets_1794552441038.jpg',
        sortOrder: 4,
      },
      {
        title: 'Material Consultation Studio',
        category: 'Showroom Application',
        locationLabel: 'Design Gallery',
        description: 'Full-scale interior wall cladding display combining stone-effect sheets and timber flutes.',
        imageUrl: '/src/assets/images/about_showroom_craft_1794552442731.jpg',
        sortOrder: 5,
      },
      {
        title: 'Multi-Texture Surface Pairing',
        category: 'Decorative Wall Panels',
        locationLabel: 'Bespoke Specification',
        description: 'Smoked oak, Roman travertine, brushed champagne gold, and matte slate architectural boards.',
        imageUrl: '/src/assets/images/cat_decorative_wall_panels_1794552442030.jpg',
        sortOrder: 6,
      },
    ];

    for (const g of seedGallery) {
      insertGallery.run(g.title, g.category, g.locationLabel, g.description, g.imageUrl, g.sortOrder);
    }
  }
}

// Helper mappers
export function getAllSettings(db: Database.Database): SiteSettings {
  const rows = db.prepare('SELECT key, value FROM site_settings').all() as Array<{ key: string; value: string }>;
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

export function mapCategoryRow(row: Record<string, unknown>): Category {
  return {
    id: Number(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: String(row.description ?? ''),
    imageUrl: String(row.image_url ?? ''),
    sortOrder: Number(row.sort_order ?? 0),
    isActive: Boolean(row.is_active),
    productCount: row.product_count !== undefined ? Number(row.product_count) : undefined,
  };
}

export function mapProductRow(row: Record<string, unknown>): Product {
  return {
    id: Number(row.id),
    name: String(row.name),
    slug: String(row.slug),
    categoryId: Number(row.category_id),
    categoryName: row.category_name ? String(row.category_name) : undefined,
    categorySlug: row.category_slug ? String(row.category_slug) : undefined,
    description: String(row.description ?? ''),
    images: safeJsonParse<string[]>(row.images_json, []),
    specifications: safeJsonParse<ProductSpecification[]>(row.specifications_json, []),
    colorsDesigns: safeJsonParse<ProductColorDesign[]>(row.colors_designs_json, []),
    price: row.price !== null && row.price !== undefined ? Number(row.price) : null,
    priceUnit: row.price_unit ? String(row.price_unit) : null,
    stockStatus: String(row.stock_status ?? 'In Stock') as Product['stockStatus'],
    availabilityType: String(row.availability_type ?? 'Both') as Product['availabilityType'],
    isPublished: Boolean(row.is_published),
    featured: Boolean(row.featured),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapEnquiryRow(row: Record<string, unknown>): Enquiry {
  return {
    id: Number(row.id),
    enquiryCode: String(row.enquiry_code),
    customerName: String(row.customer_name),
    mobileNumber: String(row.mobile_number),
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
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapOrderRow(row: Record<string, unknown>): Order {
  return {
    id: Number(row.id),
    orderCode: String(row.order_code),
    enquiryId: row.enquiry_id !== null && row.enquiry_id !== undefined ? Number(row.enquiry_id) : null,
    customerName: String(row.customer_name),
    mobileNumber: String(row.mobile_number),
    email: row.email ? String(row.email) : null,
    deliveryLocation: String(row.delivery_location ?? ''),
    items: safeJsonParse<OrderItem[]>(row.items_json, []),
    orderType: String(row.order_type ?? 'Retail') as Order['orderType'],
    totalAmount: row.total_amount !== null && row.total_amount !== undefined ? Number(row.total_amount) : null,
    status: String(row.status ?? 'New') as Order['status'],
    notes: String(row.notes ?? ''),
    confirmedAt: row.confirmed_at ? String(row.confirmed_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapGalleryRow(row: Record<string, unknown>): GalleryItem {
  return {
    id: Number(row.id),
    title: String(row.title),
    category: String(row.category),
    locationLabel: String(row.location_label ?? ''),
    description: String(row.description ?? ''),
    imageUrl: String(row.image_url),
    sortOrder: Number(row.sort_order ?? 0),
    isPublished: Boolean(row.is_published),
    createdAt: String(row.created_at),
  };
}

export function mapBranchRow(row: Record<string, unknown>): BranchLocation {
  return {
    id: Number(row.id),
    branchName: String(row.branch_name),
    locationName: String(row.location_name),
    mapLink: String(row.map_link ?? ''),
    phoneNumber: String(row.phone_number ?? ''),
    whatsappNumber: String(row.whatsapp_number ?? ''),
    businessHours: String(row.business_hours ?? ''),
    sortOrder: Number(row.sort_order ?? 0),
    isPublished: Boolean(row.is_published),
    createdAt: String(row.created_at),
  };
}

function safeJsonParse<T>(raw: unknown, fallback: T): T {
  if (typeof raw !== 'string') return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
