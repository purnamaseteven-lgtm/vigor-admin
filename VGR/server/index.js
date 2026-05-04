/* ═══════════════════════════════════════════════════════════════
   VIGOR BACKEND SERVER
   Handles: PGSoft Seamless API + Payment Webhooks + Cloudflare API
   Deploy to: Railway (https://railway.app)
   ═══════════════════════════════════════════════════════════════ */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import seamlessRouter from './routes/seamless.js';
import paymentRouter from './routes/payment.js';
import cloudflareRouter from './routes/cloudflare.js';

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

// Raw body for webhook signature validation
app.use('/api/webhooks', express.raw({ type: 'application/json' }));
// JSON for everything else
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use('/api/cloudflare', cloudflareRouter);

// ── 404 handler ─────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found', path: req.path });
});

// ── Error handler ────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('[ERROR]', err.message);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
    console.log(`[VIGOR] Backend server running on port ${PORT}`);
    console.log(`[VIGOR] Supabase: ${process.env.SUPABASE_URL ? '✅ configured' : '❌ MISSING'}`);
    console.log(`[VIGOR] PGSoft:   ${process.env.PG_OPERATOR_TOKEN ? '✅ configured' : '❌ MISSING'}`);
    console.log(`[VIGOR] Unopay:   ${process.env.UNOPAY_API_KEY ? '✅ configured' : '⚠️  not configured'}`);
    console.log(`[VIGOR] Coin2Pay: ${process.env.COIN2PAY_API_KEY ? '✅ configured' : '⚠️  not configured'}`);
    console.log(`[VIGOR] Sawala:   ${process.env.SAWALA_TOKEN ? '✅ configured' : '⚠️  not configured'}`);
});

export default app;
