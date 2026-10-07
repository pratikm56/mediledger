# 🌐 Vercel Frontend Deployment & CDN Binding Guide

This guide details the step-by-step instructions for deploying the **MediLedger React + Vite Frontend** to **Vercel** with CDN distribution, SPA routing support, and seamless communication with the Render backend.

---

## 1. Overview & Low-Cost Architecture

- **Hosting Platform**: Vercel (Hobby Tier / Zero Cost)
- **Framework**: Vite + React 19 + TypeScript + Tailwind CSS
- **Routing Engine**: React Router DOM (Single Page Application)
- **API Communication**: Axios with Bearer token authentication to Render Spring Boot backend
- **Global Edge Network**: High-speed CDN with automatic HTTPS/TLS certificates

---

## 2. Step-by-Step Vercel Deployment

### Step 1: Import Repository
1. Log into your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository: `moneyLedger` (or `mediledger`).

### Step 2: Configure Project Settings
In the Project Configuration screen, set:
- **Project Name**: `mediledger` (or your preferred pharmacy subdomain)
- **Framework Preset**: `Vite`
- **Root Directory**: Click **Edit** and select `frontend` (crucial: ensure this points to `frontend`)
- **Build Command**: `npm run build` (default)
- **Output Directory**: `dist` (default)
- **Install Command**: `npm install` (default)

### Step 3: Configure Environment Variables
Under the **Environment Variables** section, add:

| Key | Value Example | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `https://mediledger-backend.onrender.com/api` | Full URL to your deployed Render backend |
| `VITE_API_TIMEOUT` | `45000` | Optional: 45s timeout to handle free-tier cold starts |

> [!IMPORTANT]
> The `VITE_API_BASE_URL` must include the `/api` context path and must **NOT** have a trailing slash.
> Correct: `https://mediledger-backend.onrender.com/api`
> Incorrect: `https://mediledger-backend.onrender.com/api/`

### Step 4: Deploy
Click **Deploy**. Vercel will:
1. Pull the repository.
2. Execute `npm run build` (type-checking with `tsc -b` and bundling with Vite).
3. Deploy the resulting assets to the global edge network.
4. Assign a production URL, e.g., `https://mediledger.vercel.app`.

---

## 3. SPA Client-Side Routing Configuration

MediLedger uses client-side routing via React Router (`/medicines`, `/billing`, `/purchases`, `/reports`, `/settings`, etc.). Without a rewrite rule, refreshing any deep URL returns a 404 error from the CDN.

MediLedger includes [`frontend/vercel.json`](file:///d:/moneyLedger/frontend/vercel.json) to handle this automatically:

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This ensures Vercel serves `index.html` for all paths, allowing React Router to handle page rendering client-side.

---

## 4. Binding Frontend & Backend (CORS Synchronization)

For security, the Render backend only accepts API requests from authorized frontend origins.
Once Vercel assigns your production URL:
1. Copy your Vercel deployment URL (e.g. `https://mediledger.vercel.app`).
2. Go to your **Render Dashboard** -> **mediledger-backend** Web Service -> **Environment**.
3. Update the `CORS_ALLOWED_ORIGINS` variable:
   ```text
   CORS_ALLOWED_ORIGINS=https://mediledger.vercel.app,http://localhost:5173
   ```
4. Click **Save Changes**. Render will automatically redeploy the backend with the updated CORS policy.

---

## 5. Verifying Frontend -> Backend Communication

Once both Vercel and Render are deployed:
1. Open your Vercel URL in a browser (e.g. `https://mediledger.vercel.app/login`).
2. Open Browser Developer Tools (`F12`) -> **Network** tab.
3. Sign in using the default administrative credentials:
   - **Username**: `owner`
   - **Password**: `Owner@123`
4. Verify the network traffic:
   - A `POST` request to `https://<render-url>/api/auth/login` succeeds with HTTP `200 OK`.
   - The response includes the JWT token: `{"success": true, "data": {"token": "eyJhbG..."}}`.
   - The browser redirects to `/dashboard`, successfully loading sales, inventory, and expiry data.

---

## 6. Multi-Device & Mobile Responsiveness Verification

Verify the UI layouts on different screen widths:
- **Desktop / Laptop (>= 1024px)**: Full side navigation, split POS view, extensive data tables.
- **Tablet (768px - 1023px)**: Responsive navigation, stacked summaries, touch-friendly inputs.
- **Mobile (< 768px)**: Collapsible hamburger menu, full-width checkout buttons, card-based stock lists.

---

## 7. Custom Domain Setup (Optional)

To use your pharmacy's custom domain (e.g. `billing.yourpharmacy.com`):
1. In Vercel Project Settings -> **Domains**, click **Add**.
2. Enter your domain name.
3. Add the provided `CNAME` or `A` records in your DNS provider (Cloudflare, GoDaddy, Namecheap).
4. Update `CORS_ALLOWED_ORIGINS` in Render to include your custom domain.
