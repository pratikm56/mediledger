# 🚀 MediLedger Deployment Guide

This guide covers deployment instructions for the target low-budget production stack:
- **Frontend**: Vercel
- **Backend**: Render
- **Database**: Aiven PostgreSQL

---

## 1. Low-Budget Architecture Topology

```
   Browser Client
        |
        v (HTTPS)
   Vercel (React Frontend CDN)
        |
        v (HTTPS REST API with CORS)
   Render (Spring Boot Container)
        |
        v (JDBC over TLS/SSL)
   Aiven PostgreSQL (Cloud Managed Database)
```

**Security Mandate**: The browser NEVER connects directly to PostgreSQL. All database transactions are brokered solely by the Spring Boot backend on Render.

---

## 2. Aiven PostgreSQL Database Setup

1. Create a service in [Aiven Console](https://console.aiven.io):
   - Service: **PostgreSQL**
   - Plan: Free Tier or Startup-1 (lowest suitable plan)
   - Cloud Provider: AWS / GCP in target region (e.g. Mumbai, Singapore, Frankfurt)
2. Retrieve the Service URI from the Overview tab:
   `postgres://avnadmin:<PASSWORD>@<HOST>:<PORT>/defaultdb?sslmode=require`
3. Convert into standard JDBC format for Spring Boot:
   `jdbc:postgresql://<HOST>:<PORT>/defaultdb?sslmode=require`

---

## 3. Render Backend Deployment

For the exhaustive step-by-step guide with automated Blueprint configuration:
See [🚀 Render Backend Deployment Guide](RENDER_DEPLOYMENT.md).

Quick Deploy via Render Blueprint:
1. Push this repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com), click **New +** -> **Blueprint**.
3. Render automatically provisions the Web Service using [`render.yaml`](../render.yaml) with multi-stage Docker builds and health probes configured.
4. Input your Aiven database credentials when prompted.


---

## 4. Vercel Frontend Deployment

1. Import your GitHub repository in [Vercel](https://vercel.com).
2. Configure project settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Set Environment Variable in Vercel:
   | Variable | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://<YOUR-RENDER-BACKEND>.onrender.com/api` |
4. Deploy!

---

## 5. Local Docker Deployment (Alternative)

To run the complete system locally with Docker:
```bash
# Start PostgreSQL database container
docker compose up -d

# Verify health
docker compose ps
```
