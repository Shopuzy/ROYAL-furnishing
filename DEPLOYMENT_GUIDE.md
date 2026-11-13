# ROYAL FURNISHING — Zero-Cost Production Deployment Guide
**Stack:** GitHub + Supabase Free + Cloudflare Pages (100% Free Tier, $0/month)

---

## 1. Create Your Free Supabase Project
1. Sign in at [supabase.com](https://supabase.com) and click **New Project**.
2. Choose your **Organization**, enter project name `royal-furnishing`, set a strong database password, and select the region closest to your customers.
3. Wait ~1–2 minutes for provisioning to finish.

## 2. Run the Database Schema & RLS Policies
1. In your Supabase project, open **SQL Editor** from the left sidebar and click **New query**.
2. Open the file `supabase/schema.sql` from this repository, copy its **entire contents**, and paste it into the SQL Editor.
3. Click **Run**.
4. Verify:
   - **Table Editor** shows: `admin_users`, `categories`, `products`, `enquiries`, `orders`, `gallery_items`, `site_settings`, `branches`.
   - **Storage** shows a public bucket named `media`.
   - **Database → Policies** confirms Row Level Security (RLS) is **Enabled** on all 8 tables.

## 3. Set Up Administrator Authentication (No Hardcoded Passwords)
1. In Supabase Dashboard, go to **Authentication → Sign In / Providers → Email**:
   - Ensure **Email** provider is enabled.
   - Disable **Allow new users to sign up** (recommended so strangers cannot register accounts on your project).
2. Go to **Authentication → Users → Add user → Create new user**:
   - Enter your admin email (e.g., `owner@yourdomain.com`) and a strong password.
   - Check **Auto Confirm User** and click **Create user**.
   - Copy the newly created user's **User UID** (a UUID like `a1b2c3d4-...`).
3. Open **SQL Editor → New query** and run:
   ```sql
   INSERT INTO public.admin_users (user_id, email, name, is_active)
   VALUES (
     'PASTE_USER_UID_HERE',
     'owner@yourdomain.com',
     'Royal Furnishing Admin',
     true
   );
   ```
   > Only users present in `public.admin_users` with `is_active = true` pass `public.is_admin()` in RLS and can access `/admin`.

## 4. Collect Your Public Supabase Keys
1. Go to **Project Settings → Data API** (or **API Keys**):
   - Copy **Project URL** (`https://xxxxx.supabase.co`) → `VITE_SUPABASE_URL`
   - Copy **`anon` / `publishable` key** → `VITE_SUPABASE_ANON_KEY`
2. **SECURITY RULE:** Never copy or expose the `service_role` / secret key in Cloudflare Pages or any `VITE_` environment variable.

## 5. Push Source Code to GitHub
1. Create a new repository on [github.com](https://github.com) (e.g., `royal-furnishing-website`).
2. Ensure `.env` is NOT committed (`.gitignore` already excludes `.env*` and `*.db`).
3. Push the code:
   ```bash
   git init
   git add .
   git commit -m "Initial Royal Furnishing Cloudflare + Supabase setup"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/royal-furnishing-website.git
   git push -u origin main
   ```

## 6. Deploy Frontend on Cloudflare Pages ($0/month)
1. Sign in at [dash.cloudflare.com](https://dash.cloudflare.com).
2. Go to **Workers & Pages → Create → Pages → Connect to Git**.
3. Authorize GitHub and select your `royal-furnishing-website` repository.
4. Configure build settings:
   - **Production branch:** `main`
   - **Framework preset:** `Vite` (or `None`)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. Expand **Environment variables (for Production and Preview)** and add:
   - `VITE_SUPABASE_URL` = your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase `anon` public key
   - `NODE_VERSION` = `22`
6. Click **Save and Deploy**.
7. Once deployed, Cloudflare gives you a live HTTPS URL (`https://royal-furnishing-website.pages.dev`) that works in every desktop and mobile browser worldwide with zero cookie gates.

## 7. Connect Your Custom Domain & Update Supabase Auth URLs
1. In Cloudflare Pages, open your project → **Custom domains → Set up a custom domain**.
2. Enter your domain (e.g., `royalfurnishing.com` and `www.royalfurnishing.com`).
3. If your domain's DNS is already on Cloudflare, click **Activate domain** (Cloudflare automatically creates the `CNAME` record and provisions free Universal SSL).
   - If your domain registrar is elsewhere (GoDaddy, Namecheap, etc.), either point nameservers to Cloudflare (recommended, free) or add the `CNAME` target shown by Cloudflare Pages.
4. **Important — Configure Supabase Site URL & Password Reset Redirect URLs** (never leave any local URL in production):
   - In Supabase Dashboard → **Authentication → URL Configuration**:
     - **Site URL:** `https://royalfurnishing.com` (or `https://YOUR-PROJECT.pages.dev`)
     - **Redirect URLs:** Add:
       - `https://royalfurnishing.com/reset-password`
       - `https://www.royalfurnishing.com/reset-password`
       - `https://YOUR-PROJECT.pages.dev/reset-password`
       - `https://royalfurnishing.com/admin`
       - `https://YOUR-PROJECT.pages.dev/admin`

## 8. Accessing the Hidden Admin Panel After Deployment
- Open your website in any browser and **tap/click the ROYAL FURNISHING logo 7 times** (header, mobile drawer, or footer), or visit `/admin`.
- Sign in with your Supabase administrator email & password.
- Go to **Website & Branches** to configure your shop's **WhatsApp number**, phone, email, and **multiple branch locations with map links**.

## 9. Node.js Server (`server.ts`) vs Cloudflare Pages Static + Functions
- **What `server.ts` / `server/` does locally:** Express, `better-sqlite3`, Node `fs` uploads (`/uploads`), and `node:crypto` cookie sessions exist **only** for local/container preview when Supabase env vars are absent. They are **never bundled into `dist/`** by `npm run build`.
- **How Cloudflare Pages runs everything at $0/month:**
  - Frontend SPA (`dist/` + `public/_redirects`) runs on Cloudflare Pages global CDN.
  - Database, RLS, public enquiry/order RPCs, Admin Auth, and `media` Storage run directly on **Supabase Free** using only `VITE_SUPABASE_URL` + your public `VITE_SUPABASE_PUBLISHABLE_KEY` (or `VITE_SUPABASE_ANON_KEY`).
- **If you later need custom server-side endpoints** (e.g., email/WhatsApp webhook notifications, PDF generation, or secret API calls):
  - Create edge handlers inside `/functions/api/<route>.ts` exporting `onRequestPost` / `onRequestGet` (Web Standard `Request` / `Response`, no `express` or `fs`), and store secret keys like `SUPABASE_SECRET_KEY` or `RESEND_API_KEY` in Cloudflare Pages → **Settings → Environment variables** (without the `VITE_` prefix).

