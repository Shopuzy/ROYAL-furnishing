import express from 'express';
import type { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  getAllSettings,
  getDb,
  mapBranchRow,
  mapCategoryRow,
  mapEnquiryRow,
  mapGalleryRow,
  mapOrderRow,
  mapProductRow,
} from './server/db.ts';
import {
  clearSessionCookie,
  getAuthenticatedAdmin,
  hashSecret,
  requireAdmin,
  setSessionCookie,
  signSessionToken,
  verifySecret,
} from './server/auth.ts';
import type { AuthenticatedRequest } from './server/auth.ts';

dotenv.config();

const PORT = 3000;
const VALID_ENQUIRY_STATUSES = ['New', 'Contacted', 'Quotation Sent', 'Converted to Order', 'Closed'];
const VALID_ORDER_STATUSES = [
  'New',
  'Contacted',
  'Quotation Sent',
  'Confirmed',
  'Processing',
  'Completed',
  'Cancelled',
];
const VALID_STOCK_STATUSES = ['In Stock', 'Low Stock', 'Made to Order', 'Out of Stock'];
const VALID_AVAILABILITY_TYPES = ['Both', 'Retail', 'Wholesale'];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `item-${Date.now()}`;
}

function makeUniqueSlug(baseSlug: string, table: 'products' | 'categories', excludeId?: number): string {
  const db = getDb();
  let candidate = baseSlug;
  let counter = 1;
  while (true) {
    const existing = excludeId
      ? (db.prepare(`SELECT id FROM ${table} WHERE slug = ? AND id != ?`).get(candidate, excludeId) as
          | { id: number }
          | undefined)
      : (db.prepare(`SELECT id FROM ${table} WHERE slug = ?`).get(candidate) as { id: number } | undefined);
    if (!existing) return candidate;
    counter += 1;
    candidate = `${baseSlug}-${counter}`;
  }
}

function generateReferenceCode(prefix: 'RF-ENQ' | 'RF-ORD', table: 'enquiries' | 'orders'): string {
  const db = getDb();
  const year = new Date().getFullYear();
  const row = db.prepare(`SELECT COUNT(*) as c FROM ${table}`).get() as { c: number };
  const seq = row.c + 1001;
  const randomSuffix = crypto.randomInt(10, 99);
  return `${prefix}-${year}-${seq}${randomSuffix}`;
}

async function startServer(): Promise<void> {
  const db = getDb();
  const app = express();

  app.set('trust proxy', 1);
  app.use(express.json({ limit: '15mb' }));
  app.use(cookieParser());

  const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  // =========================================================================
  // AUTHENTICATION ROUTES
  // =========================================================================

  app.get('/api/auth/me', (req: Request, res: Response) => {
    const adminCount = (db.prepare('SELECT COUNT(*) as c FROM users WHERE role = ?').get('admin') as { c: number }).c;
    const admin = getAuthenticatedAdmin(req);
    res.json({
      hasAdmin: adminCount > 0,
      authenticated: Boolean(admin),
      user: admin,
    });
  });

  app.post('/api/auth/setup', (req: Request, res: Response) => {
    const adminCount = (db.prepare('SELECT COUNT(*) as c FROM users WHERE role = ?').get('admin') as { c: number }).c;
    if (adminCount > 0) {
      res.status(403).json({ error: 'Administrator account already exists. Please sign in.' });
      return;
    }

    const name = String(req.body?.name ?? '').trim();
    const username = String(req.body?.username ?? '').trim().toLowerCase();
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');
    const recoveryCode = String(req.body?.recoveryCode ?? '').trim();

    if (!name || name.length < 2) {
      res.status(400).json({ error: 'Please enter a valid full name.' });
      return;
    }
    if (!username || !/^[a-z0-9._-]{3,32}$/.test(username)) {
      res.status(400).json({ error: 'Username must be 3–32 characters (letters, numbers, dot, underscore, hyphen).' });
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }
    if (recoveryCode.length < 6) {
      res.status(400).json({ error: 'Recovery passkey must be at least 6 characters long.' });
      return;
    }

    const passwordHash = hashSecret(password);
    const recoveryHash = hashSecret(recoveryCode);

    const result = db
      .prepare(
        `INSERT INTO users (username, email, name, password_hash, recovery_hash, role)
         VALUES (?, ?, ?, ?, ?, 'admin')`
      )
      .run(username, email, name, passwordHash, recoveryHash);

    const userId = Number(result.lastInsertRowid);
    const token = signSessionToken(userId, 'admin');
    setSessionCookie(req, res, token);

    const createdUser = db
      .prepare('SELECT id, username, email, name, role, created_at FROM users WHERE id = ?')
      .get(userId) as Record<string, unknown>;

    res.status(201).json({
      token,
      user: {
        id: Number(createdUser.id),
        username: String(createdUser.username),
        email: String(createdUser.email),
        name: String(createdUser.name),
        role: String(createdUser.role),
        createdAt: String(createdUser.created_at),
      },
    });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const identifier = String(req.body?.identifier ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');

    if (!identifier || !password) {
      res.status(400).json({ error: 'Email or username and password are required.' });
      return;
    }

    const user = db
      .prepare('SELECT * FROM users WHERE (lower(email) = ? OR lower(username) = ?) AND role = ?')
      .get(identifier, identifier, 'admin') as Record<string, unknown> | undefined;

    if (!user || !verifySecret(password, String(user.password_hash))) {
      res.status(401).json({ error: 'Invalid credentials. Please verify your email/username and password.' });
      return;
    }

    const token = signSessionToken(Number(user.id), 'admin');
    setSessionCookie(req, res, token);

    res.json({
      token,
      user: {
        id: Number(user.id),
        username: String(user.username),
        email: String(user.email),
        name: String(user.name),
        role: String(user.role),
        createdAt: String(user.created_at),
      },
    });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    clearSessionCookie(req, res);
    res.json({ ok: true });
  });

  app.post('/api/auth/reset-password', (req: Request, res: Response) => {
    const identifier = String(req.body?.identifier ?? '').trim().toLowerCase();
    const recoveryCode = String(req.body?.recoveryCode ?? '').trim();
    const newPassword = String(req.body?.newPassword ?? '');

    if (!identifier || !recoveryCode || !newPassword) {
      res.status(400).json({ error: 'Email/username, recovery passkey, and new password are required.' });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters long.' });
      return;
    }

    const user = db
      .prepare('SELECT * FROM users WHERE (lower(email) = ? OR lower(username) = ?) AND role = ?')
      .get(identifier, identifier, 'admin') as Record<string, unknown> | undefined;

    if (!user || !verifySecret(recoveryCode, String(user.recovery_hash))) {
      res.status(403).json({ error: 'Account identifier or recovery passkey did not match.' });
      return;
    }

    const nextHash = hashSecret(newPassword);
    db.prepare(`UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`).run(
      nextHash,
      Number(user.id)
    );

    res.json({ ok: true, message: 'Password updated successfully. You may now sign in.' });
  });

  // =========================================================================
  // PUBLIC WEBSITE APIs
  // =========================================================================

  app.get('/api/public/bootstrap', (_req: Request, res: Response) => {
    const settings = getAllSettings(db);
    const categoriesRows = db
      .prepare(
        `SELECT c.*,
          (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_published = 1) AS product_count
         FROM categories c
         WHERE c.is_active = 1
         ORDER BY c.sort_order ASC, c.id ASC`
      )
      .all() as Array<Record<string, unknown>>;

    const featuredRows = db
      .prepare(
        `SELECT p.*, c.name AS category_name, c.slug AS category_slug
         FROM products p
         JOIN categories c ON p.category_id = c.id
         WHERE p.is_published = 1 AND p.featured = 1 AND c.is_active = 1
         ORDER BY p.updated_at DESC, p.id DESC
         LIMIT 8`
      )
      .all() as Array<Record<string, unknown>>;

    const galleryRows = db
      .prepare(
        `SELECT * FROM gallery_items
         WHERE is_published = 1
         ORDER BY sort_order ASC, id DESC`
      )
      .all() as Array<Record<string, unknown>>;

    const branchRows = db
      .prepare(
        `SELECT * FROM branches
         WHERE is_published = 1
         ORDER BY sort_order ASC, id ASC`
      )
      .all() as Array<Record<string, unknown>>;

    res.json({
      settings,
      categories: categoriesRows.map(mapCategoryRow),
      featuredProducts: featuredRows.map(mapProductRow),
      galleryItems: galleryRows.map(mapGalleryRow),
      branches: branchRows.map(mapBranchRow),
    });
  });

  app.get('/api/public/products', (req: Request, res: Response) => {
    const categorySlug = String(req.query.category ?? '').trim();
    const search = String(req.query.search ?? '').trim();
    const availability = String(req.query.availability ?? '').trim();

    let sql = `
      SELECT p.*, c.name AS category_name, c.slug AS category_slug
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.is_published = 1 AND c.is_active = 1
    `;
    const params: unknown[] = [];

    if (categorySlug && categorySlug !== 'all') {
      sql += ' AND c.slug = ?';
      params.push(categorySlug);
    }
    if (availability && (availability === 'Retail' || availability === 'Wholesale')) {
      sql += " AND (p.availability_type = ? OR p.availability_type = 'Both')";
      params.push(availability);
    }
    if (search) {
      sql += ' AND (p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?)';
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    sql += ' ORDER BY p.featured DESC, p.updated_at DESC, p.id DESC';

    const rows = db.prepare(sql).all(...params) as Array<Record<string, unknown>>;
    res.json({ products: rows.map(mapProductRow) });
  });

  app.get('/api/public/products/:slug', (req: Request, res: Response) => {
    const slug = String(req.params.slug ?? '').trim();
    const row = db
      .prepare(
        `SELECT p.*, c.name AS category_name, c.slug AS category_slug
         FROM products p
         JOIN categories c ON p.category_id = c.id
         WHERE p.slug = ? AND p.is_published = 1 AND c.is_active = 1`
      )
      .get(slug) as Record<string, unknown> | undefined;

    if (!row) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    const product = mapProductRow(row);
    const relatedRows = db
      .prepare(
        `SELECT p.*, c.name AS category_name, c.slug AS category_slug
         FROM products p
         JOIN categories c ON p.category_id = c.id
         WHERE p.category_id = ? AND p.id != ? AND p.is_published = 1
         ORDER BY p.featured DESC, p.id DESC
         LIMIT 3`
      )
      .all(product.categoryId, product.id) as Array<Record<string, unknown>>;

    res.json({
      product,
      relatedProducts: relatedRows.map(mapProductRow),
    });
  });

  app.post('/api/public/enquiries', (req: Request, res: Response) => {
    const customerName = String(req.body?.customerName ?? '').trim();
    const mobileNumber = String(req.body?.mobileNumber ?? '').trim();
    const emailRaw = String(req.body?.email ?? '').trim();
    const productId = req.body?.productId ? Number(req.body.productId) : null;
    const productName = String(req.body?.productName ?? '').trim();
    const categoryName = String(req.body?.categoryName ?? '').trim();
    const quantity = String(req.body?.quantity ?? '').trim();
    const enquiryType = req.body?.enquiryType === 'Wholesale' ? 'Wholesale' : 'Retail';
    const deliveryLocation = String(req.body?.deliveryLocation ?? '').trim();
    const message = String(req.body?.message ?? '').trim();

    if (!customerName || customerName.length < 2) {
      res.status(400).json({ error: 'Please enter your full name.' });
      return;
    }
    if (!mobileNumber || mobileNumber.replace(/[^0-9+]/g, '').length < 7) {
      res.status(400).json({ error: 'Please provide a valid mobile number.' });
      return;
    }
    if (emailRaw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }
    if (!quantity) {
      res.status(400).json({ error: 'Please specify required quantity or area.' });
      return;
    }
    if (!deliveryLocation) {
      res.status(400).json({ error: 'Please enter the delivery city or location.' });
      return;
    }

    const enquiryCode = generateReferenceCode('RF-ENQ', 'enquiries');
    const result = db
      .prepare(
        `INSERT INTO enquiries (
          enquiry_code, customer_name, mobile_number, email, product_id,
          product_name, category_name, quantity, enquiry_type, delivery_location,
          message, status, internal_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'New', '')`
      )
      .run(
        enquiryCode,
        customerName,
        mobileNumber,
        emailRaw || null,
        productId,
        productName || 'General Enquiry',
        categoryName || 'General',
        quantity,
        enquiryType,
        deliveryLocation,
        message
      );

    const created = db.prepare('SELECT * FROM enquiries WHERE id = ?').get(Number(result.lastInsertRowid)) as Record<
      string,
      unknown
    >;
    res.status(201).json({ enquiry: mapEnquiryRow(created) });
  });

  app.post('/api/public/orders', (req: Request, res: Response) => {
    const customerName = String(req.body?.customerName ?? '').trim();
    const mobileNumber = String(req.body?.mobileNumber ?? '').trim();
    const emailRaw = String(req.body?.email ?? '').trim();
    const deliveryLocation = String(req.body?.deliveryLocation ?? '').trim();
    const orderType = req.body?.orderType === 'Wholesale' ? 'Wholesale' : 'Retail';
    const notes = String(req.body?.notes ?? '').trim();
    const items = Array.isArray(req.body?.items) ? req.body.items : [];

    if (!customerName || customerName.length < 2) {
      res.status(400).json({ error: 'Please enter your full name.' });
      return;
    }
    if (!mobileNumber || mobileNumber.replace(/[^0-9+]/g, '').length < 7) {
      res.status(400).json({ error: 'Please provide a valid mobile number.' });
      return;
    }
    if (!deliveryLocation) {
      res.status(400).json({ error: 'Please provide a delivery location.' });
      return;
    }
    if (items.length === 0) {
      res.status(400).json({ error: 'Please include at least one material item in your quotation request.' });
      return;
    }

    const orderCode = generateReferenceCode('RF-ORD', 'orders');
    // Orders submitted publicly ALWAYS start as 'New' (pending administrator confirmation)
    const result = db
      .prepare(
        `INSERT INTO orders (
          order_code, enquiry_id, customer_name, mobile_number, email,
          delivery_location, items_json, order_type, total_amount, status, notes, confirmed_at
        ) VALUES (?, NULL, ?, ?, ?, ?, ?, ?, NULL, 'New', ?, NULL)`
      )
      .run(
        orderCode,
        customerName,
        mobileNumber,
        emailRaw || null,
        deliveryLocation,
        JSON.stringify(items),
        orderType,
        notes
      );

    const created = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(result.lastInsertRowid)) as Record<
      string,
      unknown
    >;
    res.status(201).json({ order: mapOrderRow(created) });
  });

  // =========================================================================
  // PROTECTED ADMIN APIs
  // =========================================================================

  app.get('/api/admin/overview', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
    const totalEnquiries = (db.prepare('SELECT COUNT(*) as c FROM enquiries').get() as { c: number }).c;
    const newEnquiries = (db.prepare("SELECT COUNT(*) as c FROM enquiries WHERE status = 'New'").get() as { c: number })
      .c;
    const pendingQuotations = (
      db
        .prepare(
          `SELECT (
            (SELECT COUNT(*) FROM enquiries WHERE status IN ('New', 'Contacted')) +
            (SELECT COUNT(*) FROM orders WHERE status IN ('New', 'Contacted', 'Quotation Sent'))
          ) as c`
        )
        .get() as { c: number }
    ).c;
    const confirmedOrders = (
      db.prepare("SELECT COUNT(*) as c FROM orders WHERE status IN ('Confirmed', 'Processing')").get() as { c: number }
    ).c;
    const completedOrders = (
      db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'Completed'").get() as { c: number }
    ).c;
    const totalProducts = (db.prepare('SELECT COUNT(*) as c FROM products').get() as { c: number }).c;
    const publishedProducts = (
      db.prepare('SELECT COUNT(*) as c FROM products WHERE is_published = 1').get() as { c: number }
    ).c;

    const recentEnquiries = (
      db.prepare('SELECT * FROM enquiries ORDER BY created_at DESC, id DESC LIMIT 5').all() as Array<
        Record<string, unknown>
      >
    ).map(mapEnquiryRow);

    const recentOrders = (
      db.prepare('SELECT * FROM orders ORDER BY created_at DESC, id DESC LIMIT 5').all() as Array<
        Record<string, unknown>
      >
    ).map(mapOrderRow);

    res.json({
      totalEnquiries,
      newEnquiries,
      pendingQuotations,
      confirmedOrders,
      completedOrders,
      totalProducts,
      publishedProducts,
      recentEnquiries,
      recentOrders,
    });
  });

  // --- Admin Enquiries ---
  app.get('/api/admin/enquiries', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const search = String(req.query.search ?? '').trim();
    const status = String(req.query.status ?? '').trim();
    const type = String(req.query.type ?? '').trim();
    const from = String(req.query.from ?? '').trim();
    const to = String(req.query.to ?? '').trim();

    let sql = 'SELECT * FROM enquiries WHERE 1=1';
    const params: unknown[] = [];

    if (search) {
      sql +=
        ' AND (enquiry_code LIKE ? OR customer_name LIKE ? OR mobile_number LIKE ? OR product_name LIKE ? OR delivery_location LIKE ?)';
      const like = `%${search}%`;
      params.push(like, like, like, like, like);
    }
    if (status && status !== 'All') {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (type && type !== 'All') {
      sql += ' AND enquiry_type = ?';
      params.push(type);
    }
    if (from) {
      sql += ' AND date(created_at) >= date(?)';
      params.push(from);
    }
    if (to) {
      sql += ' AND date(created_at) <= date(?)';
      params.push(to);
    }

    sql += ' ORDER BY created_at DESC, id DESC';
    const rows = db.prepare(sql).all(...params) as Array<Record<string, unknown>>;
    res.json({ enquiries: rows.map(mapEnquiryRow) });
  });

  app.patch('/api/admin/enquiries/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const id = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM enquiries WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Enquiry not found.' });
      return;
    }

    const nextStatus = req.body?.status ? String(req.body.status) : String(existing.status);
    if (!VALID_ENQUIRY_STATUSES.includes(nextStatus)) {
      res.status(400).json({ error: 'Invalid enquiry status.' });
      return;
    }
    const nextNotes =
      req.body?.internalNotes !== undefined ? String(req.body.internalNotes) : String(existing.internal_notes ?? '');

    db.prepare(`UPDATE enquiries SET status = ?, internal_notes = ?, updated_at = datetime('now') WHERE id = ?`).run(
      nextStatus,
      nextNotes,
      id
    );

    const updated = db.prepare('SELECT * FROM enquiries WHERE id = ?').get(id) as Record<string, unknown>;
    res.json({ enquiry: mapEnquiryRow(updated) });
  });

  app.delete('/api/admin/enquiries/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const id = Number(req.params.id);
    const result = db.prepare('DELETE FROM enquiries WHERE id = ?').run(id);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Enquiry not found.' });
      return;
    }
    res.json({ ok: true });
  });

  app.post('/api/admin/enquiries/:id/convert-order', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const id = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM enquiries WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Enquiry not found.' });
      return;
    }

    const enquiry = mapEnquiryRow(existing);
    const orderCode = generateReferenceCode('RF-ORD', 'orders');
    const items = [
      {
        productId: enquiry.productId,
        productName: enquiry.productName || 'Custom Interior Material',
        categoryName: enquiry.categoryName || 'General',
        quantity: enquiry.quantity || '1',
      },
    ];
    const totalAmount =
      req.body?.totalAmount !== undefined && req.body?.totalAmount !== null && req.body?.totalAmount !== ''
        ? Number(req.body.totalAmount)
        : null;
    const status = req.body?.status && VALID_ORDER_STATUSES.includes(String(req.body.status))
      ? String(req.body.status)
      : 'Quotation Sent';
    const confirmedAt = status === 'Confirmed' ? new Date().toISOString() : null;

    const result = db
      .prepare(
        `INSERT INTO orders (
          order_code, enquiry_id, customer_name, mobile_number, email,
          delivery_location, items_json, order_type, total_amount, status, notes, confirmed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        orderCode,
        enquiry.id,
        enquiry.customerName,
        enquiry.mobileNumber,
        enquiry.email,
        enquiry.deliveryLocation,
        JSON.stringify(items),
        enquiry.enquiryType,
        totalAmount,
        status,
        enquiry.message || enquiry.internalNotes || '',
        confirmedAt
      );

    db.prepare(`UPDATE enquiries SET status = 'Converted to Order', updated_at = datetime('now') WHERE id = ?`).run(
      enquiry.id
    );

    const createdOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(result.lastInsertRowid)) as Record<
      string,
      unknown
    >;
    res.status(201).json({ order: mapOrderRow(createdOrder) });
  });

  // --- Admin Orders ---
  app.get('/api/admin/orders', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const search = String(req.query.search ?? '').trim();
    const status = String(req.query.status ?? '').trim();
    const from = String(req.query.from ?? '').trim();
    const to = String(req.query.to ?? '').trim();

    let sql = 'SELECT * FROM orders WHERE 1=1';
    const params: unknown[] = [];

    if (search) {
      sql += ' AND (order_code LIKE ? OR customer_name LIKE ? OR mobile_number LIKE ? OR delivery_location LIKE ?)';
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }
    if (status && status !== 'All') {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (from) {
      sql += ' AND date(created_at) >= date(?)';
      params.push(from);
    }
    if (to) {
      sql += ' AND date(created_at) <= date(?)';
      params.push(to);
    }

    sql += ' ORDER BY created_at DESC, id DESC';
    const rows = db.prepare(sql).all(...params) as Array<Record<string, unknown>>;
    res.json({ orders: rows.map(mapOrderRow) });
  });

  app.post('/api/admin/orders', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const customerName = String(req.body?.customerName ?? '').trim();
    const mobileNumber = String(req.body?.mobileNumber ?? '').trim();
    const email = String(req.body?.email ?? '').trim() || null;
    const deliveryLocation = String(req.body?.deliveryLocation ?? '').trim();
    const orderType = req.body?.orderType === 'Wholesale' ? 'Wholesale' : 'Retail';
    const status = VALID_ORDER_STATUSES.includes(String(req.body?.status)) ? String(req.body.status) : 'New';
    const totalAmount =
      req.body?.totalAmount !== undefined && req.body?.totalAmount !== null && req.body?.totalAmount !== ''
        ? Number(req.body.totalAmount)
        : null;
    const notes = String(req.body?.notes ?? '').trim();
    const items = Array.isArray(req.body?.items) ? req.body.items : [];

    if (!customerName || !mobileNumber || items.length === 0) {
      res.status(400).json({ error: 'Customer name, mobile number, and at least one item are required.' });
      return;
    }

    const orderCode = generateReferenceCode('RF-ORD', 'orders');
    const confirmedAt = status === 'Confirmed' ? new Date().toISOString() : null;

    const result = db
      .prepare(
        `INSERT INTO orders (
          order_code, enquiry_id, customer_name, mobile_number, email,
          delivery_location, items_json, order_type, total_amount, status, notes, confirmed_at
        ) VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        orderCode,
        customerName,
        mobileNumber,
        email,
        deliveryLocation,
        JSON.stringify(items),
        orderType,
        totalAmount,
        status,
        notes,
        confirmedAt
      );

    const created = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(result.lastInsertRowid)) as Record<
      string,
      unknown
    >;
    res.status(201).json({ order: mapOrderRow(created) });
  });

  app.patch('/api/admin/orders/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const id = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    const nextStatus = req.body?.status ? String(req.body.status) : String(existing.status);
    if (!VALID_ORDER_STATUSES.includes(nextStatus)) {
      res.status(400).json({ error: 'Invalid order status.' });
      return;
    }

    const nextTotal =
      req.body?.totalAmount !== undefined
        ? req.body.totalAmount === null || req.body.totalAmount === ''
          ? null
          : Number(req.body.totalAmount)
        : existing.total_amount !== null
          ? Number(existing.total_amount)
          : null;

    const nextNotes = req.body?.notes !== undefined ? String(req.body.notes) : String(existing.notes ?? '');
    const nextItems = Array.isArray(req.body?.items) ? JSON.stringify(req.body.items) : String(existing.items_json);

    let confirmedAt = existing.confirmed_at ? String(existing.confirmed_at) : null;
    if (nextStatus === 'Confirmed' && !confirmedAt) {
      confirmedAt = new Date().toISOString();
    }

    db.prepare(
      `UPDATE orders
       SET status = ?, total_amount = ?, notes = ?, items_json = ?, confirmed_at = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(nextStatus, nextTotal, nextNotes, nextItems, confirmedAt, id);

    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown>;
    res.json({ order: mapOrderRow(updated) });
  });

  app.delete('/api/admin/orders/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const id = Number(req.params.id);
    const result = db.prepare('DELETE FROM orders WHERE id = ?').run(id);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    res.json({ ok: true });
  });

  // --- Admin Products ---
  app.get('/api/admin/products', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
    const rows = db
      .prepare(
        `SELECT p.*, c.name AS category_name, c.slug AS category_slug
         FROM products p
         JOIN categories c ON p.category_id = c.id
         ORDER BY p.updated_at DESC, p.id DESC`
      )
      .all() as Array<Record<string, unknown>>;
    res.json({ products: rows.map(mapProductRow) });
  });

  app.post('/api/admin/products', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const name = String(req.body?.name ?? '').trim();
    const categoryId = Number(req.body?.categoryId);
    const description = String(req.body?.description ?? '').trim();
    const images = Array.isArray(req.body?.images) ? req.body.images.filter(Boolean) : [];
    const specifications = Array.isArray(req.body?.specifications) ? req.body.specifications : [];
    const colorsDesigns = Array.isArray(req.body?.colorsDesigns) ? req.body.colorsDesigns : [];
    const price =
      req.body?.price !== undefined && req.body?.price !== null && req.body?.price !== ''
        ? Number(req.body.price)
        : null;
    const priceUnit = req.body?.priceUnit ? String(req.body.priceUnit).trim() : null;
    const stockStatus = VALID_STOCK_STATUSES.includes(String(req.body?.stockStatus))
      ? String(req.body.stockStatus)
      : 'In Stock';
    const availabilityType = VALID_AVAILABILITY_TYPES.includes(String(req.body?.availabilityType))
      ? String(req.body.availabilityType)
      : 'Both';
    const isPublished = req.body?.isPublished === false ? 0 : 1;
    const featured = req.body?.featured ? 1 : 0;

    if (!name || !categoryId) {
      res.status(400).json({ error: 'Product name and category are required.' });
      return;
    }

    const catExists = db.prepare('SELECT id FROM categories WHERE id = ?').get(categoryId);
    if (!catExists) {
      res.status(400).json({ error: 'Selected category does not exist.' });
      return;
    }

    const slug = makeUniqueSlug(slugify(name), 'products');
    const result = db
      .prepare(
        `INSERT INTO products (
          name, slug, category_id, description, images_json, specifications_json,
          colors_designs_json, price, price_unit, stock_status, availability_type, is_published, featured
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        name,
        slug,
        categoryId,
        description,
        JSON.stringify(images),
        JSON.stringify(specifications),
        JSON.stringify(colorsDesigns),
        price,
        priceUnit,
        stockStatus,
        availabilityType,
        isPublished,
        featured
      );

    const created = db
      .prepare(
        `SELECT p.*, c.name AS category_name, c.slug AS category_slug
         FROM products p JOIN categories c ON p.category_id = c.id
         WHERE p.id = ?`
      )
      .get(Number(result.lastInsertRowid)) as Record<string, unknown>;

    res.status(201).json({ product: mapProductRow(created) });
  });

  app.patch('/api/admin/products/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const id = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    const name = req.body?.name !== undefined ? String(req.body.name).trim() : String(existing.name);
    if (!name) {
      res.status(400).json({ error: 'Product name cannot be empty.' });
      return;
    }
    const categoryId = req.body?.categoryId !== undefined ? Number(req.body.categoryId) : Number(existing.category_id);
    const description =
      req.body?.description !== undefined ? String(req.body.description) : String(existing.description ?? '');
    const images = Array.isArray(req.body?.images)
      ? JSON.stringify(req.body.images.filter(Boolean))
      : String(existing.images_json);
    const specifications = Array.isArray(req.body?.specifications)
      ? JSON.stringify(req.body.specifications)
      : String(existing.specifications_json);
    const colorsDesigns = Array.isArray(req.body?.colorsDesigns)
      ? JSON.stringify(req.body.colorsDesigns)
      : String(existing.colors_designs_json);
    const price =
      req.body?.price !== undefined
        ? req.body.price === null || req.body.price === ''
          ? null
          : Number(req.body.price)
        : existing.price !== null
          ? Number(existing.price)
          : null;
    const priceUnit =
      req.body?.priceUnit !== undefined
        ? req.body.priceUnit
          ? String(req.body.priceUnit).trim()
          : null
        : existing.price_unit
          ? String(existing.price_unit)
          : null;
    const stockStatus =
      req.body?.stockStatus && VALID_STOCK_STATUSES.includes(String(req.body.stockStatus))
        ? String(req.body.stockStatus)
        : String(existing.stock_status);
    const availabilityType =
      req.body?.availabilityType && VALID_AVAILABILITY_TYPES.includes(String(req.body.availabilityType))
        ? String(req.body.availabilityType)
        : String(existing.availability_type);
    const isPublished =
      req.body?.isPublished !== undefined ? (req.body.isPublished ? 1 : 0) : Number(existing.is_published);
    const featured = req.body?.featured !== undefined ? (req.body.featured ? 1 : 0) : Number(existing.featured);

    const slug =
      req.body?.name !== undefined && name !== String(existing.name)
        ? makeUniqueSlug(slugify(name), 'products', id)
        : String(existing.slug);

    db.prepare(
      `UPDATE products
       SET name = ?, slug = ?, category_id = ?, description = ?, images_json = ?,
           specifications_json = ?, colors_designs_json = ?, price = ?, price_unit = ?,
           stock_status = ?, availability_type = ?, is_published = ?, featured = ?,
           updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      name,
      slug,
      categoryId,
      description,
      images,
      specifications,
      colorsDesigns,
      price,
      priceUnit,
      stockStatus,
      availabilityType,
      isPublished,
      featured,
      id
    );

    const updated = db
      .prepare(
        `SELECT p.*, c.name AS category_name, c.slug AS category_slug
         FROM products p JOIN categories c ON p.category_id = c.id
         WHERE p.id = ?`
      )
      .get(id) as Record<string, unknown>;

    res.json({ product: mapProductRow(updated) });
  });

  app.delete('/api/admin/products/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const id = Number(req.params.id);
    const result = db.prepare('DELETE FROM products WHERE id = ?').run(id);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    res.json({ ok: true });
  });

  // --- Admin Categories ---
  app.get('/api/admin/categories', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
    const rows = db
      .prepare(
        `SELECT c.*,
          (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS product_count
         FROM categories c
         ORDER BY c.sort_order ASC, c.id ASC`
      )
      .all() as Array<Record<string, unknown>>;
    res.json({ categories: rows.map(mapCategoryRow) });
  });

  app.post('/api/admin/categories', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const name = String(req.body?.name ?? '').trim();
    const description = String(req.body?.description ?? '').trim();
    const imageUrl = String(req.body?.imageUrl ?? '').trim();
    const sortOrder = Number(req.body?.sortOrder ?? 10);
    const isActive = req.body?.isActive === false ? 0 : 1;

    if (!name) {
      res.status(400).json({ error: 'Category name is required.' });
      return;
    }

    const slug = makeUniqueSlug(slugify(name), 'categories');
    const result = db
      .prepare('INSERT INTO categories (name, slug, description, image_url, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)')
      .run(name, slug, description, imageUrl, sortOrder, isActive);

    const created = db.prepare('SELECT * FROM categories WHERE id = ?').get(Number(result.lastInsertRowid)) as Record<
      string,
      unknown
    >;
    res.status(201).json({ category: mapCategoryRow(created) });
  });

  app.patch('/api/admin/categories/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const id = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Category not found.' });
      return;
    }

    const name = req.body?.name !== undefined ? String(req.body.name).trim() : String(existing.name);
    const description =
      req.body?.description !== undefined ? String(req.body.description) : String(existing.description ?? '');
    const imageUrl = req.body?.imageUrl !== undefined ? String(req.body.imageUrl) : String(existing.image_url ?? '');
    const sortOrder = req.body?.sortOrder !== undefined ? Number(req.body.sortOrder) : Number(existing.sort_order ?? 0);
    const isActive = req.body?.isActive !== undefined ? (req.body.isActive ? 1 : 0) : Number(existing.is_active);
    const slug =
      req.body?.name !== undefined && name !== String(existing.name)
        ? makeUniqueSlug(slugify(name), 'categories', id)
        : String(existing.slug);

    db.prepare(
      'UPDATE categories SET name = ?, slug = ?, description = ?, image_url = ?, sort_order = ?, is_active = ? WHERE id = ?'
    ).run(name, slug, description, imageUrl, sortOrder, isActive, id);

    const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Record<string, unknown>;
    res.json({ category: mapCategoryRow(updated) });
  });

  app.delete('/api/admin/categories/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const id = Number(req.params.id);
    const count = (db.prepare('SELECT COUNT(*) as c FROM products WHERE category_id = ?').get(id) as { c: number }).c;
    if (count > 0) {
      res.status(400).json({ error: 'Cannot delete category while products are assigned to it.' });
      return;
    }
    const result = db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Category not found.' });
      return;
    }
    res.json({ ok: true });
  });

  // --- Admin Gallery ---
  app.get('/api/admin/gallery', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
    const rows = db.prepare('SELECT * FROM gallery_items ORDER BY sort_order ASC, id DESC').all() as Array<
      Record<string, unknown>
    >;
    res.json({ galleryItems: rows.map(mapGalleryRow) });
  });

  app.post('/api/admin/gallery', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const title = String(req.body?.title ?? '').trim();
    const category = String(req.body?.category ?? 'Interior Application').trim();
    const locationLabel = String(req.body?.locationLabel ?? '').trim();
    const description = String(req.body?.description ?? '').trim();
    const imageUrl = String(req.body?.imageUrl ?? '').trim();
    const sortOrder = Number(req.body?.sortOrder ?? 0);
    const isPublished = req.body?.isPublished === false ? 0 : 1;

    if (!title || !imageUrl) {
      res.status(400).json({ error: 'Title and image are required for gallery items.' });
      return;
    }

    const result = db
      .prepare(
        `INSERT INTO gallery_items (title, category, location_label, description, image_url, sort_order, is_published)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(title, category, locationLabel, description, imageUrl, sortOrder, isPublished);

    const created = db.prepare('SELECT * FROM gallery_items WHERE id = ?').get(Number(result.lastInsertRowid)) as Record<
      string,
      unknown
    >;
    res.status(201).json({ galleryItem: mapGalleryRow(created) });
  });

  app.patch('/api/admin/gallery/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const id = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM gallery_items WHERE id = ?').get(id) as
      | Record<string, unknown>
      | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Gallery item not found.' });
      return;
    }

    const title = req.body?.title !== undefined ? String(req.body.title).trim() : String(existing.title);
    const category = req.body?.category !== undefined ? String(req.body.category).trim() : String(existing.category);
    const locationLabel =
      req.body?.locationLabel !== undefined ? String(req.body.locationLabel).trim() : String(existing.location_label);
    const description =
      req.body?.description !== undefined ? String(req.body.description).trim() : String(existing.description);
    const imageUrl = req.body?.imageUrl !== undefined ? String(req.body.imageUrl).trim() : String(existing.image_url);
    const sortOrder = req.body?.sortOrder !== undefined ? Number(req.body.sortOrder) : Number(existing.sort_order);
    const isPublished =
      req.body?.isPublished !== undefined ? (req.body.isPublished ? 1 : 0) : Number(existing.is_published);

    db.prepare(
      `UPDATE gallery_items
       SET title = ?, category = ?, location_label = ?, description = ?, image_url = ?, sort_order = ?, is_published = ?
       WHERE id = ?`
    ).run(title, category, locationLabel, description, imageUrl, sortOrder, isPublished, id);

    const updated = db.prepare('SELECT * FROM gallery_items WHERE id = ?').get(id) as Record<string, unknown>;
    res.json({ galleryItem: mapGalleryRow(updated) });
  });

  app.delete('/api/admin/gallery/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const id = Number(req.params.id);
    const result = db.prepare('DELETE FROM gallery_items WHERE id = ?').run(id);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Gallery item not found.' });
      return;
    }
    res.json({ ok: true });
  });

  // --- Admin Website Settings ---
  app.get('/api/admin/settings', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
    res.json({ settings: getAllSettings(db) });
  });

  app.put('/api/admin/settings', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const allowedKeys = [
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
    const upsert = db.prepare(
      'INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
    );
    const tx = db.transaction((body: Record<string, unknown>) => {
      for (const key of allowedKeys) {
        if (body[key] !== undefined) {
          upsert.run(key, String(body[key] ?? '').trim());
        }
      }
    });
    tx(req.body ?? {});
    res.json({ settings: getAllSettings(db) });
  });

  // --- Admin Branch Locations ---
  app.get('/api/admin/branches', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
    const rows = db.prepare('SELECT * FROM branches ORDER BY sort_order ASC, id ASC').all() as Array<
      Record<string, unknown>
    >;
    res.json({ branches: rows.map(mapBranchRow) });
  });

  app.post('/api/admin/branches', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const branchName = String(req.body?.branchName ?? '').trim();
    const locationName = String(req.body?.locationName ?? '').trim();
    const mapLink = String(req.body?.mapLink ?? '').trim();
    const phoneNumber = String(req.body?.phoneNumber ?? '').trim();
    const whatsappNumber = String(req.body?.whatsappNumber ?? '').trim();
    const businessHours = String(req.body?.businessHours ?? '').trim();
    const sortOrder = Number(req.body?.sortOrder ?? 0);
    const isPublished = req.body?.isPublished === false ? 0 : 1;

    if (!branchName || !locationName) {
      res.status(400).json({ error: 'Branch name and location name are required.' });
      return;
    }
    if (mapLink && !/^https?:\/\//i.test(mapLink)) {
      res.status(400).json({ error: 'Location map link must start with https:// or http://' });
      return;
    }

    const result = db
      .prepare(
        `INSERT INTO branches (
          branch_name, location_name, map_link, phone_number, whatsapp_number, business_hours, sort_order, is_published
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(branchName, locationName, mapLink, phoneNumber, whatsappNumber, businessHours, sortOrder, isPublished);

    const created = db.prepare('SELECT * FROM branches WHERE id = ?').get(Number(result.lastInsertRowid)) as Record<
      string,
      unknown
    >;
    res.status(201).json({ branch: mapBranchRow(created) });
  });

  app.patch('/api/admin/branches/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const id = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM branches WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Branch not found.' });
      return;
    }

    const branchName =
      req.body?.branchName !== undefined ? String(req.body.branchName).trim() : String(existing.branch_name);
    const locationName =
      req.body?.locationName !== undefined ? String(req.body.locationName).trim() : String(existing.location_name);
    const mapLink = req.body?.mapLink !== undefined ? String(req.body.mapLink).trim() : String(existing.map_link);
    const phoneNumber =
      req.body?.phoneNumber !== undefined ? String(req.body.phoneNumber).trim() : String(existing.phone_number);
    const whatsappNumber =
      req.body?.whatsappNumber !== undefined
        ? String(req.body.whatsappNumber).trim()
        : String(existing.whatsapp_number);
    const businessHours =
      req.body?.businessHours !== undefined ? String(req.body.businessHours).trim() : String(existing.business_hours);
    const sortOrder = req.body?.sortOrder !== undefined ? Number(req.body.sortOrder) : Number(existing.sort_order);
    const isPublished =
      req.body?.isPublished !== undefined ? (req.body.isPublished ? 1 : 0) : Number(existing.is_published);

    if (!branchName || !locationName) {
      res.status(400).json({ error: 'Branch name and location name cannot be empty.' });
      return;
    }
    if (mapLink && !/^https?:\/\//i.test(mapLink)) {
      res.status(400).json({ error: 'Location map link must start with https:// or http://' });
      return;
    }

    db.prepare(
      `UPDATE branches
       SET branch_name = ?, location_name = ?, map_link = ?, phone_number = ?, whatsapp_number = ?,
           business_hours = ?, sort_order = ?, is_published = ?
       WHERE id = ?`
    ).run(branchName, locationName, mapLink, phoneNumber, whatsappNumber, businessHours, sortOrder, isPublished, id);

    const updated = db.prepare('SELECT * FROM branches WHERE id = ?').get(id) as Record<string, unknown>;
    res.json({ branch: mapBranchRow(updated) });
  });

  app.delete('/api/admin/branches/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const id = Number(req.params.id);
    const result = db.prepare('DELETE FROM branches WHERE id = ?').run(id);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Branch not found.' });
      return;
    }
    res.json({ ok: true });
  });

  // --- Admin Reports ---
  app.get('/api/admin/reports', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const from = String(req.query.from ?? '').trim();
    const to = String(req.query.to ?? '').trim();

    let enqSql = 'SELECT * FROM enquiries WHERE 1=1';
    let ordSql = 'SELECT * FROM orders WHERE 1=1';
    const enqParams: unknown[] = [];
    const ordParams: unknown[] = [];

    if (from) {
      enqSql += ' AND date(created_at) >= date(?)';
      ordSql += ' AND date(created_at) >= date(?)';
      enqParams.push(from);
      ordParams.push(from);
    }
    if (to) {
      enqSql += ' AND date(created_at) <= date(?)';
      ordSql += ' AND date(created_at) <= date(?)';
      enqParams.push(to);
      ordParams.push(to);
    }

    enqSql += ' ORDER BY created_at DESC';
    ordSql += ' ORDER BY created_at DESC';

    const enquiries = (db.prepare(enqSql).all(...enqParams) as Array<Record<string, unknown>>).map(mapEnquiryRow);
    const orders = (db.prepare(ordSql).all(...ordParams) as Array<Record<string, unknown>>).map(mapOrderRow);

    res.json({ enquiries, orders });
  });

  // --- Admin Image Upload ---
  app.post('/api/admin/upload', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const dataUrl = String(req.body?.dataUrl ?? '');
    const originalName = String(req.body?.fileName ?? 'image');

    const match = /^data:(image\/(png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
    if (!match) {
      res.status(400).json({ error: 'Only valid PNG, JPEG, or WebP images are supported.' });
      return;
    }

    const extMap: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/webp': 'webp',
    };
    const ext = extMap[match[1]] ?? 'jpg';
    const buffer = Buffer.from(match[3], 'base64');
    if (buffer.length > 8 * 1024 * 1024) {
      res.status(400).json({ error: 'Uploaded image exceeds 8 MB size limit.' });
      return;
    }

    const safeBase = slugify(originalName.replace(/\.[^.]+$/, '')).slice(0, 32);
    const fileName = `${safeBase}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
    const targetPath = path.join(uploadsDir, fileName);
    fs.writeFileSync(targetPath, buffer);

    res.status(201).json({ url: `/uploads/${fileName}` });
  });

  // --- Admin Account Password & Recovery Update ---
  app.post('/api/admin/change-password', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const currentPassword = String(req.body?.currentPassword ?? '');
    const newPassword = String(req.body?.newPassword ?? '');

    if (!currentPassword || newPassword.length < 8) {
      res.status(400).json({ error: 'Current password and a new password (min 8 chars) are required.' });
      return;
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.adminUser!.id) as
      | Record<string, unknown>
      | undefined;
    if (!user || !verifySecret(currentPassword, String(user.password_hash))) {
      res.status(403).json({ error: 'Current password is incorrect.' });
      return;
    }

    db.prepare(`UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`).run(
      hashSecret(newPassword),
      req.adminUser!.id
    );
    res.json({ ok: true });
  });

  app.post('/api/admin/update-recovery-code', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const currentPassword = String(req.body?.currentPassword ?? '');
    const newRecoveryCode = String(req.body?.newRecoveryCode ?? '').trim();

    if (!currentPassword || newRecoveryCode.length < 6) {
      res.status(400).json({ error: 'Current password and new recovery passkey (min 6 chars) are required.' });
      return;
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.adminUser!.id) as
      | Record<string, unknown>
      | undefined;
    if (!user || !verifySecret(currentPassword, String(user.password_hash))) {
      res.status(403).json({ error: 'Current password is incorrect.' });
      return;
    }

    db.prepare(`UPDATE users SET recovery_hash = ?, updated_at = datetime('now') WHERE id = ?`).run(
      hashSecret(newRecoveryCode),
      req.adminUser!.id
    );
    res.json({ ok: true });
  });

  // =========================================================================
  // VITE DEV / PRODUCTION STATIC SERVING
  // =========================================================================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (req: Request, res: Response, next) => {
      if (req.path.startsWith('/api/')) {
        next();
        return;
      }
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Royal Furnishing server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Royal Furnishing server:', err);
  process.exit(1);
});
