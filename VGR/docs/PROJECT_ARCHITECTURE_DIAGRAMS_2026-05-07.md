# VIGOR Architecture Diagrams (Mermaid)
Tanggal: 2026-05-07

## 1) System Context
```mermaid
flowchart LR
  A[Admin User] --> B[Frontend SPA\napp.html + js/main.js]
  B --> C[Supabase\nAuth + Postgres + Realtime]
  B --> D[Backend API\nserver/index.js]
  D --> C
  D --> E[Payment Providers\nUnopay/Coin2Pay/Sawala]
  D --> F[PG Seamless Provider]
  D --> G[Cloudflare API]
```

## 2) Frontend Module Graph
```mermaid
flowchart TD
  M[js/main.js] --> R[js/core/router.js]
  M --> S[js/core/state.js]
  M --> A[js/core/auth.js]
  M --> DB[js/core/db.js]
  M --> UI[js/ui/components.js]
  M --> P[js/pages/*]
  R --> P
  P --> DB
  P --> S
  UI --> S
```

## 3) Lazy Route Resolver
```mermaid
flowchart TD
  GO[go(page)] --> RESOLVE[ensurePageForRoute(page)]
  RESOLVE --> LM[lazyPageModules matcher]
  LM -->|match| IMPORT[Dynamic import js/pages/*.js]
  IMPORT --> REG[pages['route']=renderFn]
  REG --> RENDER[content.innerHTML = pages[page]()]
  RENDER --> SWR[db.fetchForPage(page)\nbackground refresh]
```

## 4) Menu -> Page -> Module Correlation
```mermaid
flowchart LR
  HOME[Home Menu] --> D1[dashboard]
  HOME --> D2[statistics]
  HOME --> D3[provider-analytics]
  D1 --> MD[dashboard.js]
  D2 --> MR[reports.js]
  D3 --> MR

  SEAM[Seamless Menu] --> S1[seamless-config]
  SEAM --> S2[seamless-transactions]
  SEAM --> S3[seamless-games]
  S1 --> MS[seamless.js]
  S2 --> MS
  S3 --> MS

  CRM[CRM Menu] --> C1[crm-dashboard]
  CRM --> C2[crm-segments]
  CRM --> C3[crm-missions]
  C1 --> MC[crm.js]
  C2 --> MC
  C3 --> MC
```

## 5) Frontend Data Flow (SWR)
```mermaid
sequenceDiagram
  participant U as User
  participant R as Router go(page)
  participant ST as STATE Cache
  participant DB as window.db fetchForPage
  participant SB as Supabase

  U->>R: Navigate page
  R->>ST: Render from cache
  R->>DB: fetchForPage(page) async
  DB->>SB: Query fresh data
  SB-->>DB: Rows
  DB-->>ST: Update STATE
  ST-->>R: Re-render page with fresh data
```

## 6) Backend Route Topology
```mermaid
flowchart TD
  IDX[server/index.js] --> SEAM[/api/seamless]
  IDX --> WEBH[/api/webhooks]
  IDX --> PAY[/api/payments]
  IDX --> CF[/api/cloudflare]
  IDX --> ADM[/api/admin]

  SEAM --> RSEAM[server/routes/seamless.js]
  WEBH --> RPAY[server/routes/payment.js]
  PAY --> RPAY
  CF --> RCF[server/routes/cloudflare.js]
  ADM --> RADM[server/routes/admin.js]
```

## 7) Seamless Security Pipeline
```mermaid
flowchart LR
  IN[Request /api/seamless/*] --> IP[pgWhitelistMiddleware]
  IP --> SIG[seamlessSignatureMiddleware]
  SIG --> AUTH[validateAuth\noperator_token + secret_key]
  AUTH --> HND[Endpoint Handler]
  HND --> LOG[writeApiLog]
  HND --> DB[Supabase tables]
```

## 8) Payment Webhook Pipeline
```mermaid
flowchart LR
  W[Webhook Request] --> RAW[express.raw for /api/webhooks]
  RAW --> VAL[Signature/IP validation]
  VAL --> PARSE[parseWebhookBody + required fields]
  PARSE --> APPROVE[approveDepositByPaymentRef]
  APPROVE --> RPC[Supabase RPC approve_deposit]
  RPC --> RES[JSON Response + requestId]
```

## 9) Database Domains
```mermaid
erDiagram
  MEMBERS ||--o{ DEPOSITS : has
  MEMBERS ||--o{ WITHDRAWALS : has
  MEMBERS ||--o{ SEAMLESS_TRANSACTIONS : plays
  COMPANIES ||--o{ MEMBERS : owns
  CRM_SEGMENTS ||--o{ CRM_MISSIONS : scopes
  CRM_TOURNAMENTS ||--o{ CRM_TOURNAMENT_ENTRIES : ranks
  PROMOTIONS ||--o{ BONUSES : triggers
```

## 10) Test Coverage Map
```mermaid
flowchart TD
  TCRIT[npm run test:critical]
  TCRIT --> TWIRING[feature-wiring.test]
  TCRIT --> TCON[payment-contract.test]
  TCRIT --> TRBAC[rbac-regression.test]
  TCRIT --> TWH[webhook-runtime.test]
  TCRIT --> TWR[payment-webhook-routes.test]
  TCRIT --> TPAGE[pages-registry.test]
```

