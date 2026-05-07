# BERSAMA Admin Platform - Technical Documentation

## 🚀 Overview
**BERSAMA** is an enterprise-grade, multi-tenant administrative ecosystem designed for high-stakes whitelabel operations. The platform features a high-fidelity glassmorphic UI, a 3-tier hierarchical authorization system, and an advanced template builder engine.

## 🏗️ Architecture
The application follows a **Decoupled Modular Pattern** to ensure scalability and ease of maintenance.

### Core Structure:
- `/js/core/`: Central nervous system. Handles Routing, State Management (`state.js`), and Internationalization.
- `/js/ui/`: UI Engine. Contains functional components, modals, toasts, and the Dynamic Sidebar.
- `/js/pages/`: Module-specific logic. Each administrative page (Members, Finance, Company, etc.) is isolated here.
- `/js/builder/`: The Vigor Builder Pro engine for real-time site customization.

## 🛡️ Authorization Matrix (The 3-Tier Hierarchy)
The system enforces strict data isolation at the state level:
1. **SuperAdmin**: Full global access. Manages hosts, global SEO, and high-level administrators.
2. **Company (Owner)**: Isolated to their organization. Manages their own members, finance, and whitelabel settings.
3. **Shop (Staff)**: Restricted to daily operations. Manages member deposits and basic finance for their specific branch.

**Security Feature**: High-risk actions (Host Mgmt, Admin List) are protected by a **Two-Factor Authentication (2FA)** challenge.

## 🛠️ Key Features
- **SEO Intelligence**: Regional SEO tracking with multi-language support.
- **Seamless Wallet Simulator**: Real-time API monitoring and health checks for providers (PG Soft, Pragmatic, etc.).
- **Template Builder Pro**: Flexible grid engine supporting sidebar, multi-column, and global theme overrides.
- **Production Readiness Check**: One-click validation of SSL, DNS, and API Gateway connectivity.

## 🔌 Integration Guide
To connect a new provider:
1. Create a new module in `/js/pages/`.
2. Map the API endpoints in the `STATE` config within `/js/core/state.js`.
3. Register the new route in `/js/core/router.js`.

## 📦 Deployment
1. Ensure `node_modules` are installed.
2. Run `npm run dev` for local development.
3. For production, the platform is optimized for static hosting with edge-cached assets via Cloudflare.

---
*© 2026 BERSAMA ALL RIGHTS RESERVED*

## Security Notes (2026-05)
- Seamless credentials are server-side only (PG_OPERATOR_TOKEN, PG_SECRET_KEY), not VITE_*.
- Request signature verification is enforced by default via PG_REQUIRE_SIGNATURE=true.
- Reverse proxy IP trust is controlled with TRUST_PROXY; whitelist checks rely on normalized eq.ip.

## Test Commands
- 
pm run test:critical runs wiring, contract, RBAC, webhook runtime/routes, and pages-registry audits.
