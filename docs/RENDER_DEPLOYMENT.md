# 🚀 Render Backend Deployment & Web Service Configuration Guide

This guide provides step-by-step instructions for deploying the **MediLedger Spring Boot Backend** to **Render** as a high-performance, low-cost cloud web service.

---

## 1. Overview & Architecture

Render hosts the containerized Spring Boot backend application:
- **Runtime**: Docker (Multi-stage Alpine Linux build in [`backend/Dockerfile`](file:///d:/moneyLedger/backend/Dockerfile))
- **Base Image**: Eclipse Temurin 17 JRE Alpine
- **Memory Optimization**: `-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0`
- **Database Connection**: Encrypted TLS 1.3 JDBC to Aiven PostgreSQL
- **Security**: Non-root container execution under `appuser`

---

## 2. Deployment Methods

### Method A: Automated Deployment via Blueprint (Recommended)
MediLedger includes a pre-configured [`render.yaml`](file:///d:/moneyLedger/render.yaml) file in the repository root.
1. Log into your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** and select **Blueprint**.
3. Connect your GitHub repository: `moneyLedger` (or `mediledger`).
4. Render detects `render.yaml` and prepares the `mediledger-backend` Web Service.
5. Provide the sensitive environment variables when prompted (`SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `CORS_ALLOWED_ORIGINS`).
6. Click **Apply**.

---

### Method B: Manual Web Service Setup
If creating the service manually:
1. In the Render Dashboard, click **New +** -> **Web Service**.
2. Connect your GitHub repository.
3. Configure the following fields:
   - **Name**: `mediledger-backend`
   - **Region**: Choose the region closest to your Aiven database (e.g., Frankfurt, Oregon, or Singapore).
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `Dockerfile` (or `backend/Dockerfile` if Root Directory is left blank)
   - **Plan**: `Free` (or `Starter` for $7/mo persistent uptime)
4. Under **Advanced Settings**:
   - **Health Check Path**: `/actuator/health`
   - **Auto-Deploy**: `Yes` (deploys automatically on git pushes to `main`)

---

## 3. Environment Variables Configuration

In Render Dashboard -> **Environment**, configure the following variables:

| Variable | Recommended Production Value | Notes |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | `prod` | Activates `application-prod.properties` |
| `PORT` | `8080` | Render injects this dynamically into container |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<AIVEN_HOST>:<PORT>/defaultdb?sslmode=require` | TLS encrypted connection to Aiven |
| `SPRING_DATASOURCE_USERNAME` | `avnadmin` | Aiven database user |
| `SPRING_DATASOURCE_PASSWORD` | `<AIVEN_SECRET_PASSWORD>` | Secret password |
| `JWT_SECRET` | `<64_HEX_CHARACTERS>` | 256-bit cryptographic secret |
| `JWT_EXPIRATION` | `86400000` | Token validity (24 hours) |
| `CORS_ALLOWED_ORIGINS` | `https://mediledger.vercel.app` | Vercel production frontend URL |
| `SWAGGER_ENABLED` | `false` | Disable API documentation in public production |

---

## 4. Verifying Deployment & Health Checks

Once the build completes and the service state changes to **Live**:

### 1. Actuator Health Probe
Verify standard Spring Boot Actuator health status:
```bash
curl -i https://<YOUR-RENDER-URL>.onrender.com/actuator/health
```
**Expected Response (HTTP 200 OK)**:
```json
{"status":"UP"}
```

### 2. Custom Diagnostic Health Check
Verify system and PostgreSQL database connectivity:
```bash
curl -i https://<YOUR-RENDER-URL>.onrender.com/api/health
```
**Expected Response (HTTP 200 OK)**:
```json
{
  "status": "UP",
  "database": "CONNECTED",
  "timestamp": "2026-10-07T12:00:00Z",
  "version": "1.0.0"
}
```

### 3. Authentication Verification (REST API)
Test authenticating against the deployed database:
```bash
curl -X POST https://<YOUR-RENDER-URL>.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"owner","password":"Owner@123"}'
```
**Expected Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOi...",
    "tokenType": "Bearer",
    "user": {
      "username": "owner",
      "roles": ["ROLE_OWNER"]
    }
  }
}
```

---

## 5. Free-Tier Optimization & Cold Starts

On Render's Free tier:
- Instances spin down after 15 minutes of inactivity.
- The first incoming request takes ~30–50 seconds to boot the container (cold start).
- **Free Keep-Alive Trick (Optional)**:
  Use a free uptime monitor (such as [UptimeRobot](https://uptimerobot.com) or [Cron-job.org](https://cron-job.org)) to send an HTTP GET request to `https://<YOUR-RENDER-URL>.onrender.com/actuator/health` every 10 minutes during pharmacy business hours (e.g. 8:00 AM - 10:00 PM). This prevents cold starts entirely without upgrading plans.

---

## 6. Troubleshooting Common Issues

### Issue 1: `OutOfMemoryError` or Container Killed (Code 137)
- **Cause**: Exceeding 512 MB memory limit on Render free tier.
- **Solution**: The Dockerfile already includes `-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0`. Additionally, the production profile caps the HikariCP pool at 5 connections.

### Issue 2: `PSQLException: SSL error: Connection timed out`
- **Cause**: Network unreachable or incorrect port.
- **Solution**: Use `scripts/verify-db-connection.sh <AIVEN_HOST> <PORT>` to test network reachability. Ensure the Aiven service is active and the port matches the dynamically allocated port in Aiven Console.

### Issue 3: CORS Errors in Browser Console
- **Cause**: Frontend origin not listed in `CORS_ALLOWED_ORIGINS`.
- **Solution**: Update the `CORS_ALLOWED_ORIGINS` environment variable in Render dashboard to match your exact Vercel production domain (e.g. `https://mediledger.vercel.app`), without trailing slashes.
