/* ═══════════════════════════════════════════════════════════════
   VIGOR BACKEND SERVER
   Handles: PGSoft Seamless API + Payment Webhooks + Cloudflare API
   Deploy to: Railway (https://railway.app)
   ═══════════════════════════════════════════════════════════════ */
import { config as loadEnv } from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { randomUUID } from 'crypto';
import seamlessRouter from './routes/seamless.js';
import paymentRouter from './routes/payment.js';
import cloudflareRouter from './routes/cloudflare.js';
import adminRouter from './routes/admin.js';

loadEnv();
loadEnv({ path: '../.env.server', override: false });

const app  = express();
const PORT = process.env.PORT || 3000;
const STRICT_CONFIG = process.env.STRICT_CONFIG === 'true' || process.env.NODE_ENV === 'production';
const TRUST_PROXY = process.env.TRUST_PROXY;

function validateEnvironment() {
    const requiredBase = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
    const requiredProdOnly = ['PG_OPERATOR_TOKEN', 'PG_SECRET_KEY', 'PG_WHITELISTED_IPS'];
    const missing = requiredBase.filter((k) => !process.env[k]);
    if (STRICT_CONFIG) {
        missing.push(...requiredProdOnly.filter((k) => !process.env[k]));
    }
    if (missing.length) {
        throw new Error(`[BOOT] Missing required environment variables: ${missing.join(', ')}`);
    }
}

validateEnvironment();

if (TRUST_PROXY !== undefined && TRUST_PROXY !== '') {
    app.set('trust proxy', TRUST_PROXY === 'true' ? true : TRUST_PROXY);
}

// ── Middleware ───────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || (process.env.NODE_ENV !== 'production' && allowedOrigins.length === 0)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(compression());

const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: Number(process.env.API_RATE_LIMIT_PER_MIN || 300),
    standardHeaders: true,
    legacyHeaders: false,
});
const webhookLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: Number(process.env.WEBHOOK_RATE_LIMIT_PER_MIN || 1200),
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', apiLimiter);
app.use('/api/webhooks', webhookLimiter);

// Raw body for webhook signature validation
app.use('/api/webhooks', express.raw({ type: 'application/json' }));
// JSON for everything else
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '1mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.URLENCODED_BODY_LIMIT || '1mb' }));

// ── Request correlation and structured logging ────────────────────
app.use((req, res, next) => {
    const incomingId = req.headers['x-request-id'];
    const requestId = (typeof incomingId === 'string' && incomingId.trim()) || randomUUID();
    req.requestId = requestId;
    req.requestStartedAt = Date.now();
    res.setHeader('x-request-id', requestId);
    next();
});

app.use((req, res, next) => {
    res.on('finish', () => {
        const elapsedMs = Date.now() - (req.requestStartedAt || Date.now());
        const log = {
            level: 'info',
            event: 'http_request',
            requestId: req.requestId,
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
            elapsedMs,
            ip: req.ip || req.socket?.remoteAddress || null,
            userAgent: req.headers['user-agent'] || null,
            at: new Date().toISOString(),
        };
        console.log(JSON.stringify(log));
    });
    next();
});

// ── Health check ─────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        app: 'VIGOR Backend',
        version: '2.0.0',
        time: new Date().toISOString(),
    });
});

// ── Routes ───────────────────────────────────────────────────────
app.use('/api/seamless', seamlessRouter);
app.use('/api/webhooks', paymentRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/cloudflare', cloudflareRouter);
app.use('/api/admin', adminRouter);

// ── 404 handler ─────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found', path: req.path });
});

// ── Error handler ────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(JSON.stringify({
        level: 'error',
        event: 'http_error',
        requestId: req.requestId || null,
        path: req.originalUrl,
        method: req.method,
        message: err.message,
        at: new Date().toISOString(),
    }));
    res.status(500).json({ error: 'Internal server error', message: err.message, requestId: req.requestId || null });
});

app.listen(PORT, () => {
    console.log(`[VIGOR] Backend server running on port ${PORT}`);
    console.log(`[VIGOR] Strict config mode: ${STRICT_CONFIG ? 'ON' : 'OFF'}`);
    console.log(`[VIGOR] Supabase: ${process.env.SUPABASE_URL ? '✅ configured' : '❌ MISSING'}`);
    console.log(`[VIGOR] PGSoft:   ${process.env.PG_OPERATOR_TOKEN ? '✅ configured' : '❌ MISSING'}`);
    console.log(`[VIGOR] Unopay:   ${process.env.UNOPAY_API_KEY ? '✅ configured' : '⚠️  not configured'}`);
    console.log(`[VIGOR] Coin2Pay: ${process.env.COIN2PAY_API_KEY ? '✅ configured' : '⚠️  not configured'}`);
    console.log(`[VIGOR] Sawala:   ${process.env.SAWALA_TOKEN ? '✅ configured' : '⚠️  not configured'}`);
});

export default app;
