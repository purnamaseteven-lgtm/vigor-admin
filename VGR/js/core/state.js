/* ─── STATE MANAGEMENT ─── */
export const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
export const fmtCur = (n) => "Rp " + fmt(n);

export const NL = ['Santoso', 'Wijaya', 'Kusuma', 'Rahayu', 'Pratama', 'Sari', 'Utama', 'Nugroho', 'Halim', 'Setiawan', 'Gunawan', 'Hidayat', 'Irawan', 'Jaya', 'Kartika', 'Lestari', 'Mulyadi', 'Nurhadi', 'Okta', 'Purnama'];
export const MEMBERS = ['alex99', 'lucy_star', 'budi_gacor', 'dave_king', 'mega_win', 'susi88', 'user_unopay', 'p Purnama', 'Gunawan_W', 'Rahayu_Sari', 'Pratama_J', 'Wijaya_K', 'Santoso_U', 'Hidayat_H', 'Irawan_G', 'Nurhadi_M', 'Halim_L', 'Jaya_O', 'Setiawan_E', 'Okta_R'];
export const BANKS = ['BCA', 'BNI', 'BRI', 'MANDIRI', 'DANAMON', 'CIMB', 'PERMATA', 'MAYBANK'];
export const COMPANIES = ['vigor88', 's88pw', 's88pb', 's88gw', 'Pgw1', 'budi', 'dedek', 'dhanur', 'ebert', 'cas88', 'whitelabel1', 'client3', 'client5', 'ac88', 'tiger88', 'casino888', 'play77', 'pro99', 'jackpot1', 'lucky88'];
export const STATUSES = ['Active', 'Inactive', 'Suspended', 'Blocked'];
export const GAMES = ['4D', '3D', '2D', 'Colok Bebas', 'Colok Macau', 'Colok Naga', 'Colok Jitu', '50-50', 'Kombinasi / BB', 'Shio'];
export const PROVIDERS = ['All Providers', 'PRAGMATIC PLAY', 'HABANERO', 'MICROGAMING', 'SBOBET', 'EVOLUTION', 'JOKER', 'SPADEGAMING'];

export const PG_GAMES = [
    { id: 1, name: "Honey Trap of Diao Chan", type: "Slot" }, { id: 2, name: "Hood vs Wolf", type: "Slot" },
    { id: 3, name: "Hotpot", type: "Slot" }, { id: 6, name: "Medusa II", type: "Slot" },
    { id: 7, name: "Fortune Mouse", type: "Slot" }, { id: 18, name: "Dragon Hatch", type: "Slot" },
    { id: 35, name: "Mahjong Ways", type: "Slot" }, { id: 36, name: "Fortune Tiger", type: "Slot" },
    { id: 37, name: "Fortune Rabbit", type: "Slot" }, { id: 38, name: "Fortune Ox", type: "Slot" },
    { id: 39, name: "Ganesha Gold", type: "Slot" }, { id: 40, name: "Double Fortune", type: "Slot" },
    { id: 42, name: "Wild Bandito", type: "Slot" }, { id: 48, name: "Candy Burst", type: "Slot" },
    { id: 54, name: "Mahjong Ways 2", type: "Slot" }, { id: 57, name: "Wild Bounty Showdown", type: "Slot" },
    { id: 59, name: "Treasures of Aztec", type: "Slot" }, { id: 60, name: "The Great Icescape", type: "Slot" },
    { id: 63, name: "Cash Mania", type: "Slot" }, { id: 65, name: "Buffalo Win", type: "Slot" },
    { id: 68, name: "Baccarat Deluxe", type: "Card" }, { id: 69, name: "Lucky Neko", type: "Slot" },
    { id: 71, name: "Crypto Gold", type: "Slot" }, { id: 73, name: "Supermarket Spree", type: "Slot" },
    { id: 74, name: "Heist Stakes", type: "Slot" }, { id: 75, name: "Mafia Mayhem", type: "Slot" },
];
export const PG_CURRENCIES = ['IDR', 'CNY', 'THB', 'VND', 'BRL', 'INR', 'KRW', 'USD', 'EUR', 'TRY', 'RUB', 'UAH', 'KZT', 'UZS', 'BDT', 'MMK', 'KHR', 'LAK', 'PHP', 'PKR', 'NPR', 'MXN', 'PEN', 'CLP', 'COP', 'ARS', 'PYG', 'UYU', 'BOB', 'CRC', 'NGN', 'KES', 'GHS', 'TZS', 'UGX', 'ZAR', 'EGP', 'MAD', 'DZD', 'TND', 'LBP', 'SAR', 'AED', 'QAR', 'OMR', 'BHD', 'KWD', 'JOD', 'IQD', 'IRR', 'GEL', 'AZN', 'AMD', 'USDT', 'USDC', 'MBTC', 'UBTC', 'TRX', 'TUSD'];

export const STATE = {
    members: [],
    admins: [
        { id: 'adm-1', username: 'super_root', name: 'Master System', role: 'SuperAdmin', company: 'Global', status: 'Active', lastLogin: '2026-04-29 10:00', parentId: null, customPermissions: null },
        { id: 'adm-2', username: 'owner_vigor88', name: 'Vigor88 Owner', role: 'Whitelabel', company: 'vigor88', status: 'Active', lastLogin: '2026-04-28 15:30', parentId: 'adm-1', customPermissions: null },
        { id: 'adm-3', username: 'agent_casino88', name: 'Casino888 Agent', role: 'Agent', company: 'casino888', status: 'Active', lastLogin: '2026-04-29 09:00', parentId: 'adm-2', customPermissions: null },
        { id: 'adm-4', username: 'agent_play77', name: 'Play77 Agent', role: 'Agent', company: 'play77', status: 'Active', lastLogin: '2026-04-29 07:30', parentId: 'adm-2', customPermissions: null },
    ],
    currentAdmin: {
        id: 'adm-1',
        username: 'antigravity',
        name: 'Super Admin',
        role: 'SuperAdmin',
        company: 'Global',
        is2FAVerified: false,
        permissions: ['*']
    },
    PERMISSIONS: {
        FINANCE_VIEW: 'view_finance',
        FINANCE_EDIT: 'edit_finance',
        ADMIN_MANAGE: 'manage_admins',
        HOST_MANAGE: 'manage_hosts',
        BUILDER_ACCESS: 'access_builder'
    },
    companies: ['Global', 'HokiBet', 'MegaWin', 'DragonSlot', 'ZenithCasino'],
    shops: [
        { id: 'sh-1', name: 'Sinar Rejeki', company: 'HokiBet' },
        { id: 'sh-2', name: 'Metro Game', company: 'MegaWin' }
    ],
    banks: [], deposits: [], withdrawals: [], announcements: [],
    notifications: [], promotions: [], memos: { inbox: [], sent: [], trash: [] }, logs: [],
    crm: {
        segments: [], missions: [], tournaments: [],
        automationRules: [], pushCampaigns: [],
        missionProgress: [], tournamentEntries: [], loyaltyPoints: [],
    },
    savedWidgets: [], savedLayouts: [],
    theme: {
        primary: '#0ea5e9',
        accent: '#8b5cf6',
        radius: '10px',
        font: 'Segoe UI',
        darkMode: true,
        presets: 'default'
    },
    vipTiers: [
        { id: 'VIP1', name: 'Bronze', turnover: 0, minDeposit: 0, rebate: 0.3, referral: 0.1, color: '#cd7f32', cashbackPct: 0, withdrawLimit: 5000000, maxBonus: 100000, depositBonus: 0, birthdayBonus: 0, prioritySupport: false, freebet: 0 },
        { id: 'VIP2', name: 'Silver', turnover: 100000000, minDeposit: 5000000, rebate: 0.5, referral: 0.2, color: '#c0c0c0', cashbackPct: 1, withdrawLimit: 20000000, maxBonus: 500000, depositBonus: 1, birthdayBonus: 50000, prioritySupport: false, freebet: 25000 },
        { id: 'VIP3', name: 'Gold', turnover: 500000000, minDeposit: 25000000, rebate: 0.7, referral: 0.3, color: '#ffd700', cashbackPct: 2, withdrawLimit: 50000000, maxBonus: 2000000, depositBonus: 2, birthdayBonus: 150000, prioritySupport: false, freebet: 50000 },
        { id: 'VIP4', name: 'Platinum', turnover: 2500000000, minDeposit: 100000000, rebate: 0.9, referral: 0.4, color: '#e5e4e2', cashbackPct: 3, withdrawLimit: 150000000, maxBonus: 5000000, depositBonus: 3, birthdayBonus: 500000, prioritySupport: true, freebet: 100000 },
        { id: 'VIP5', name: 'Diamond', turnover: 10000000000, minDeposit: 500000000, rebate: 1.2, referral: 0.5, color: '#b9f2ff', cashbackPct: 5, withdrawLimit: 500000000, maxBonus: 20000000, depositBonus: 5, birthdayBonus: 2000000, prioritySupport: true, freebet: 250000 }
    ],
    seo: {
        title: 'VIGOR - Modern Online Gaming Experience',
        description: 'Join the most trusted gaming platform with instant withdraw and huge jackpots.',
        keywords: 'casino, slot, betting, gambling, jackpot, pragmatic play',
        ogImage: 'https://vigor.gaming/og-image.jpg',
        robots: 'index, follow',
        googleAnalyticsId: 'G-XXXXXXXXXX',
        injectHead: '',
        injectBody: ''
    },
    bannerLayoutSections: {},
    seamless: {
        config: {
            operatorToken: 'VGR-OPR-2024-ABCD', secretKey: 'sk_live_a1b25cde5f3gh46ijkl',
            apiDomain: 'https://api.seamless.vigor', callbackDomain: 'https://api.vigor88.com',
            currency: 'IDR', baseUnit: 1000, hashAuth: true,
            salt: 'SALT_VGR_2024_XYZ', groupId: 1,
            whitelistedIPs: ['103.28.12.0/24', '202.134.56.78', '10.0.0.0/8'],
            status: 'Active', env: 'Production', lastSync: '2026-04-28 22:15:00',
            endpoints: {
                verifySession: '/api/seamless/VerifySession',
                getWallet: '/api/seamless/Cash/Get',
                transferInOut: '/api/seamless/Cash/TransferInOut',
                adjustment: '/api/seamless/Cash/Adjustment',
                updateBetDetail: '/api/seamless/Cash/UpdateBetDetail',
            }
        },
        transactions: [], games: [], apiLogs: []
    },
    profile: { username: 'adminsub40', name: 'SUBSTAG', language: 'English' },
    settings: { commission: 80, referral: 2, referralSlot: 0.5, minDeposit: 25000, maxDeposit: 50000000, maxWithdraw: 25000000, maintenanceMode: false, companyReferralStatus: {}, vipCalcMethod: 'turnover', vipCrmSync: true },
    systemNotifications: [], // Broadcast notifications: maintenance, update, info
    notifPreferences: { sound: true, depositAlert: true, withdrawalAlert: true, maintenanceAlert: true },
    refreshSettings: { interval: 0, lastRefresh: null }, // interval in seconds; 0 = off
    popupBanners: [], // Popup banners for frontend player sites
    rollingAdjustments: {}, // Per-member rolling multiplier overrides: { username: pct }
    campaignUsage: {}, // Tracks one-time campaign triggers per member
    adjustments: [
        { id: 'ADJ10045', member: 'player_jackpot', type: 'deposit', amount: 500000, notes: 'Bonus Special Event', date: '01/05/2026, 14:20:01', processedBy: 'admin' },
        { id: 'ADJ10046', member: 'hoki_user88', type: 'withdrawal', amount: 250000, notes: 'Correction for double deposit', date: '01/05/2026, 15:10:45', processedBy: 'adminsub' },
        { id: 'ADJ10047', member: 'lucky_strike', type: 'deposit', amount: 1000000, notes: 'VVIP Member Welcome Bonus', date: '01/05/2026, 16:05:12', processedBy: 'admin' },
        { id: 'ADJ10048', member: 'mega_win99', type: 'deposit', amount: 50000, notes: 'Missing credit from seamless error', date: '01/05/2026, 17:30:22', processedBy: 'admin' },
        { id: 'ADJ10049', member: 'bet_master', type: 'withdrawal', amount: 150000, notes: 'Adjustment for tournament refund', date: '01/05/2026, 18:45:10', processedBy: 'adminsub' }
    ], // History of manual balance adjustments (deposit/withdrawal)
    _filters: {}, _page: {}, _perPage: {},

    // ── Permission Matrix — 3-level hierarchy: SuperAdmin / Whitelabel / Agent ──
    permissionMatrix: {
        SuperAdmin: {
            home: { dashboard: true, statistics: true, providerAnalytics: true, deviceReport: true },
            master: { whitelist: true, blacklist: true, masterWhitelist: true },
            administrators: { systemAdmins: true, rolePermissions: true },
            companyManagement: { whitelabelList: true, masterWlList: true, regisNewCompany: true, myDownlines: true },
            members: { memberList: true, addMember: true, tierHistory: true },
            bankManagement: { bankList: true, createNewBank: true },
            finance: { deposit: true, withdrawal: true, adjustment: true, adjustmentLogs: true },
            bets: { betsListing: true, bettingTable: true, transferredList: true },
            bonus: { bonusReport: true, agentFreebet: true, agentFreebetReport: true, pragmaticFrb: true, promotions: true, promotionRelease: true, promotionRollingRelease: true },
            results: { resultsListing: true, resultScan: true, resultsAnalyze: true },
            integrations: { providerSetup: true, apiLogs: true, developerDocs: true },
            customization: { siteConfig: true, templateBuilder: true, templatePreview: true, seoTools: true, systemTheme: true, globalBanner: true, appNotification: true, announcements: true },
            settings: { commission: true, referralRate: true, poolsList: true, games: true, agentGameSettings: true, togelCommission: true, limitCreditOut: true, vipDesigner: true, rebateCalc: true, financeLimits: true },
            tools: { coin2pay: true, hostManagement: true, sawala: true, unopay: true, nawalaScan: true },
            crm: { dashboard: true, segments: true, missions: true, tournaments: true, automation: true, push: true, dormancy: true, loyalty: true },
            memo: { memoBox: true, autoMemo: true },
            reports: { winloss: true, agentDaily: true, limitCredit: true, lostMoney: true, togelLost: true, topTurnover: true },
            invoice: { monthly: true, fileManagement: true, tournamentWinners: true },
            logs: { adminLogs: true, companyLogs: true, whitelabelLogs: true, memberLogs: true, masterWlLogs: true }
        },
        Whitelabel: {
            home: { dashboard: true, statistics: true, providerAnalytics: true, deviceReport: true },
            master: { whitelist: false, blacklist: false, masterWhitelist: false },
            administrators: { systemAdmins: true, rolePermissions: false },
            companyManagement: { whitelabelList: true, masterWlList: true, regisNewCompany: true, myDownlines: true },
            members: { memberList: true, addMember: true, tierHistory: true },
            bankManagement: { bankList: true, createNewBank: true },
            finance: { deposit: true, withdrawal: true, adjustment: true, adjustmentLogs: true },
            bets: { betsListing: true, bettingTable: true, transferredList: true },
            bonus: { bonusReport: true, agentFreebet: true, agentFreebetReport: true, pragmaticFrb: true, promotions: true, promotionRelease: true, promotionRollingRelease: true },
            results: { resultsListing: true, resultScan: true, resultsAnalyze: true },
            integrations: { providerSetup: true, apiLogs: true, developerDocs: true },
            customization: { siteConfig: true, templateBuilder: true, templatePreview: true, seoTools: true, systemTheme: true, globalBanner: true, appNotification: true, announcements: false },
            settings: { commission: true, referralRate: true, poolsList: true, games: true, agentGameSettings: true, togelCommission: true, limitCreditOut: true, vipDesigner: true, rebateCalc: true },
            tools: { coin2pay: true, hostManagement: false, sawala: true, unopay: true, nawalaScan: true },
            crm: { dashboard: true, segments: true, missions: true, tournaments: true, automation: true, push: true, dormancy: true, loyalty: true },
            memo: { memoBox: true, autoMemo: true },
            reports: { winloss: true, agentDaily: true, limitCredit: true, lostMoney: true, togelLost: true, topTurnover: true },
            invoice: { monthly: true, fileManagement: true, tournamentWinners: true },
            logs: { adminLogs: false, companyLogs: true, whitelabelLogs: true, memberLogs: true, masterWlLogs: true }
        },
        Agent: {
            home: { dashboard: true, statistics: true, providerAnalytics: false, deviceReport: false },
            master: { whitelist: false, blacklist: false, masterWhitelist: false },
            administrators: { systemAdmins: false, rolePermissions: false },  // Agent cannot manage admins
            companyManagement: { whitelabelList: false, masterWlList: false, regisNewCompany: false, myDownlines: false },
            members: { memberList: true, addMember: true, tierHistory: true },
            bankManagement: { bankList: true, createNewBank: false },
            finance: { deposit: true, withdrawal: true, adjustment: false, adjustmentLogs: false },
            bets: { betsListing: true, bettingTable: true, transferredList: false },
            bonus: { bonusReport: true, agentFreebet: true, agentFreebetReport: true, pragmaticFrb: false, promotions: false, promotionRelease: false, promotionRollingRelease: false },
            results: { resultsListing: true, resultScan: false, resultsAnalyze: false },
            integrations: { providerSetup: false, apiLogs: false, developerDocs: false },
            customization: { siteConfig: false, templateBuilder: false, templatePreview: false, seoTools: false, systemTheme: false, globalBanner: false, appNotification: false },
            settings: { commission: false, referralRate: false, poolsList: false, games: false, agentGameSettings: false, togelCommission: false, limitCreditOut: false },
            tools: { coin2pay: false, hostManagement: false, sawala: false, unopay: false, nawalaScan: true },
            crm: { dashboard: true, segments: false, missions: false, tournaments: false, automation: false, push: false, dormancy: false, loyalty: false },
            memo: { memoBox: true, autoMemo: false },
            reports: { winloss: true, agentDaily: true, limitCredit: false, lostMoney: false, togelLost: false, topTurnover: false },
            invoice: { monthly: false, fileManagement: false, tournamentWinners: false },
            logs: { adminLogs: false, companyLogs: false, whitelabelLogs: false, memberLogs: true, masterWlLogs: false }
        }
    }
};

export const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export function addLog(action, target = '', description = '', actor = 'adminsub40') {
    const ip = `${rnd(100, 200)}.${rnd(10, 99)}.${rnd(1, 250)}.${rnd(1, 254)}`;
    const date = new Date().toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    STATE.logs.unshift({ id: 'L' + Date.now(), date, actor, ip, action, target, description });
    if (STATE.logs.length > 200) STATE.logs.pop();
}

export function initState() {
    const saved = localStorage.getItem('VGR_STATE');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Deep merge permissionMatrix to ensure new modules/sub-menus are picked up
            if (parsed.permissionMatrix) {
                Object.keys(STATE.permissionMatrix).forEach(role => {
                    if (parsed.permissionMatrix[role]) {
                        Object.keys(STATE.permissionMatrix[role]).forEach(mod => {
                            if (parsed.permissionMatrix[role][mod]) {
                                STATE.permissionMatrix[role][mod] = { ...STATE.permissionMatrix[role][mod], ...parsed.permissionMatrix[role][mod] };
                            }
                        });
                    }
                });
                delete parsed.permissionMatrix;
            }
            Object.assign(STATE, parsed);
            // Normalize legacy/stored role labels so RBAC/menu rendering remains stable.
            // 3-level hierarchy: SuperAdmin / Whitelabel / Agent
            const roleAliases = {
                superadmin: 'SuperAdmin',
                superadmins: 'SuperAdmin',
                company: 'Whitelabel',   // legacy
                whitelabel: 'Whitelabel',
                master: 'Agent',         // legacy → Agent
                shop: 'Agent',         // legacy → Agent
                agent: 'Agent',
            };
            const rawRole = String(STATE.currentAdmin?.role || '').toLowerCase().replace(/[\s_-]+/g, '');
            if (rawRole && roleAliases[rawRole]) {
                STATE.currentAdmin.role = roleAliases[rawRole];
            }
            // Drop invalid/empty custom permissions from old saves (can hide all menus).
            if (
                STATE.currentAdmin &&
                Object.prototype.hasOwnProperty.call(STATE.currentAdmin, 'customPermissions')
            ) {
                const cp = STATE.currentAdmin.customPermissions;
                const valid = cp && typeof cp === 'object' && Object.keys(cp).length > 0;
                if (!valid) STATE.currentAdmin.customPermissions = null;
            }
            // Force re-seed transaction data if current state is sparse to ensure visualization works
            if (!STATE.deposits || STATE.deposits.length < 50) {
                STATE.deposits = [];
                STATE.withdrawals = [];
            } else {
                return;
            }
        } catch (e) { console.error("Failed to parse saved state", e); }
    }

    // Init Members — agentId links each member to a specific agent admin
    // adm-4 (casino888) and adm-5 (play77) are demo agents
    const _agentMap = { 'casino888': 'adm-4', 'play77': 'adm-5' };
    for (let i = 0; i < 60; i++) {
        const u = MEMBERS[i % MEMBERS.length] + (i > 20 ? '_' + i : '');
        const co = COMPANIES[i % COMPANIES.length];
        STATE.members.push({
            id: 'M' + (1000 + i), username: u, name: NL[i % NL.length] + ' ' + NL[(i + 2) % NL.length], company: co,
            phone: '08' + rnd(100, 999) + rnd(1000, 9999), bank: BANKS[i % BANKS.length], bankAccount: String(rnd(100000000, 999999999)),
            balance: rnd(0, 500) * 50000, status: i % 15 === 0 ? 'Inactive' : 'Active',
            joined: rnd(1, 28) + '/' + rnd(1, 4) + '/2024', lastLogin: rnd(1, 27) + '/04/2026', ip: '192.168.1.' + rnd(1, 254),
            agentId: _agentMap[co] || null,   // assigned agent admin id
        });
    }

    // Company tree parentId assignment:
    //   [0-4]  Whitelabel → no parent  (vigor88=C100, s88pw=C101, s88pb=C102, s88gw=C103, Pgw1=C104)
    //   [5-9]  Company    → under vigor88 C100  (budi=C105 … cas88=C109)
    //   [10-14] Company   → under s88pw  C101  (whitelabel1=C110 … tiger88=C114)
    //   [15-17] Master    → under budi   C105  (casino888=C115, play77=C116, pro99=C117)
    //   [18-19] Master    → under dedek  C106  (jackpot1=C118, lucky88=C119)
    COMPANIES.forEach((c, i) => {
        let parentId = null;
        if (i >= 5 && i < 10) parentId = 'C100';  // under vigor88
        if (i >= 10 && i < 15) parentId = 'C101';  // under s88pw
        if (i >= 15 && i < 18) parentId = 'C105';  // under budi
        if (i >= 18) parentId = 'C106';  // under dedek
        STATE.companies.push({
            id: 'C' + (100 + i), username: c, name: c.toUpperCase() + ' Group', email: c + '@gaming.io',
            phone: '021' + rnd(1000000, 9999999), credit: rnd(10, 500) * 1000000, members: rnd(100, 1000),
            status: i % 10 === 0 ? 'Inactive' : 'Active',
            type: i < 5 ? 'Whitelabel' : 'Agent',
            parentId,
            joined: '2023-12-07'
        });
    });
    BANKS.forEach((b, i) => {
        STATE.banks.push({ id: 'B' + (200 + i), bank: b, accountName: 'VIGOR ' + b, accountNumber: String(rnd(100000000, 999999999)), type: 'Both', minDeposit: 10000, maxDeposit: 100000000, status: 'Active' });
    });
    for (let i = 0; i < 200; i++) {
        const m = STATE.members[rnd(0, STATE.members.length - 1)];
        STATE.deposits.push({ id: 'DEP' + (5000 + i), member: m.username, company: m.company, bank: m.bank, amount: rnd(2, 500) * 50000, status: i < 5 ? 'Pending' : i % 8 === 0 ? 'Rejected' : 'Approved', date: rnd(1, 27) + '/04/2026 ' + rnd(10, 23) + ':' + rnd(10, 59), processedBy: i < 5 ? '' : 'adminsub40' });
    }
    for (let i = 0; i < 150; i++) {
        const m = STATE.members[rnd(0, STATE.members.length - 1)];
        STATE.withdrawals.push({ id: 'WIT' + (8000 + i), member: m.username, company: m.company, bank: m.bank, accountNumber: m.bankAccount, amount: rnd(5, 300) * 50000, status: i < 3 ? 'Pending' : i % 10 === 0 ? 'Rejected' : 'Approved', date: rnd(1, 27) + '/04/2026 ' + rnd(10, 23) + ':' + rnd(10, 59), processedBy: i < 3 ? '' : 'adminsub40' });
    }
    STATE.memos.inbox = [];
    STATE.promotions = [];
    STATE.announcements = [];
    STATE.notifications = [];
    STATE.lotteryBets = [];

    PROVIDERS.forEach((prov, idx) => {
        if (prov === 'All Providers') return;
        PG_GAMES.forEach((g, i) => {
            STATE.seamless.games.push({ id: g.id + (idx * 100), provider: prov, name: g.name + (prov !== 'PG_SOFT' ? ' (' + prov + ')' : ''), type: "Slot", status: i % 12 === 0 ? 'Maintenance' : 'Active', rtp: (94 + Math.random() * 3).toFixed(2), maxWin: rnd(5000, 50000), betSizes: '0.20 - 100.00', popularity: rnd(60, 100) });
        });
    });
    const txTypes = ['BetPayout', 'BetPayout', 'BetPayout', 'BonusToCash', 'FreeGameToCash'];
    const walletTypes = ['C', 'C', 'C', 'B', 'G'];
    for (let i = 0; i < 80; i++) {
        const m = STATE.members[rnd(0, STATE.members.length - 1)];
        const g = STATE.seamless.games[rnd(0, STATE.seamless.games.length - 1)];
        const betAmt = rnd(1, 500) * 1000;
        const winAmt = rnd(0, 1) ? rnd(0, betAmt * 3) : 0;
        const transferAmt = winAmt - betAmt;
        const txTypeIdx = rnd(0, txTypes.length - 1);
        STATE.seamless.transactions.push({
            id: 'TX' + (9000 + i), traceId: crypto.randomUUID ? crypto.randomUUID() : `${rnd(10000000, 99999999)}-${rnd(1000, 9999)}-${rnd(1000, 9999)}-${rnd(1000, 9999)}-${rnd(100000000000, 999999999999)}`,
            player: m.username, company: m.company, provider: g.provider, gameId: g.id, gameName: g.name,
            parentBetId: String(rnd(1800000000000, 1899999999999)),
            betId: String(rnd(1800000000000, 1899999999999)),
            betAmount: betAmt, winAmount: winAmt, transferAmount: transferAmt,
            realTransferAmount: transferAmt * 1000,
            transactionType: txTypes[txTypeIdx], walletType: walletTypes[txTypeIdx],
            currency: 'IDR', isEndRound: i % 3 === 0, isFeature: i % 7 === 0,
            status: i < 2 ? 'Pending' : 'Completed',
            createTime: Date.now() - rnd(60000, 86400000 * 5),
            balanceAfter: rnd(100, 5000) * 1000
        });
    }
    const apiEndpoints = ['/VerifySession', '/Cash/Get', '/Cash/TransferInOut', '/Cash/TransferInOut', '/Cash/TransferInOut', '/Cash/Adjustment', '/Cash/UpdateBetDetail'];
    const httpStatuses = [200, 200, 200, 200, 200, 200, 200, 200, 200, 400, 500];
    for (let i = 0; i < 50; i++) {
        const ep = apiEndpoints[rnd(0, apiEndpoints.length - 1)];
        const hs = httpStatuses[rnd(0, httpStatuses.length - 1)];
        STATE.seamless.apiLogs.push({
            id: 'LOG' + (7000 + i), timestamp: Date.now() - rnd(60000, 86400000 * 3),
            provider: PROVIDERS[rnd(1, PROVIDERS.length - 1)],
            endpoint: ep, method: 'POST', httpStatus: hs,
            traceId: `${rnd(10000000, 99999999)}-${rnd(1000, 9999)}-${rnd(1000, 9999)}-${rnd(1000, 9999)}-${rnd(100000000000, 999999999999)}`,
            responseTime: rnd(5, hs > 200 ? 9500 : 350) + 'ms',
            player: STATE.members[rnd(0, STATE.members.length - 1)].username,
            status: hs === 200 ? 'OK' : hs === 400 ? 'Bad Request' : 'Server Error',
            requestBody: `operator_token=VGR-OPR-2024-ABCD&secret_key=***&player_name=${STATE.members[rnd(0, STATE.members.length - 1)].username}`,
            responseBody: hs === 200 ? '{"data":{"balance_amount":' + rnd(100, 50000) + '.00,"currency_code":"IDR"},"error":null}' : '{"data":null,"error":{"code":' + (hs === 400 ? '1034' : '1200') + ',"message":"' + (hs === 400 ? 'Request is not valid' : 'Internal server error') + '"}}'
        });
    }

    addLog('login', 'adminsub40', 'Admin logged in successfully');
    applyTheme();
    saveState();
}

export function applyTheme() {
    const root = document.documentElement;
    const t = STATE.theme;
    root.style.setProperty('--acc', t.primary);
    root.style.setProperty('--purple', t.accent);
    root.style.setProperty('--radius', t.radius);
    root.style.setProperty('font-family', t.font + ', system-ui, sans-serif');
    if (t.darkMode) {
        root.setAttribute('data-theme', 'dark');
    } else {
        root.removeAttribute('data-theme');
    }
}

export function saveState() {
    localStorage.setItem('VGR_STATE', JSON.stringify(STATE));
}

export function stateAdd(key, rec) { STATE[key].unshift(rec); saveState(); }
export function stateUpdate(key, id, data) { const idx = STATE[key].findIndex(x => x.id === id); if (idx !== -1) STATE[key][idx] = { ...STATE[key][idx], ...data }; saveState(); }
export function stateDelete(key, id) { STATE[key] = STATE[key].filter(x => x.id !== id); saveState(); }

export function stateSaveWidget(type, name, props) { STATE.savedWidgets.push({ id: 'SW' + Date.now(), type, name, props, createdAt: new Date().toLocaleDateString() }); }
export function stateSaveLayout(name, layout, zones) { STATE.savedLayouts.push({ id: 'SL' + Date.now(), name, layout, zones }); }
