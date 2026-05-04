import { STATE, saveState } from './state.js';

// VIGOR Dictionary - Extend this with external JSON files for production
export const DICTIONARY = {
    'en': {
        'Dashboard': 'Dashboard',
        'Members': 'Members',
        'Transactions': 'Transactions',
        'Bets': 'Bets',
        'Win': 'Win',
        'Lose': 'Lose',
        'Settings': 'Settings',
        'Tools': 'Tools',
        'Providers': 'Providers',
        'Total Balance': 'Total Balance',
        'Today Deposit': 'Today Deposit',
        'Today Withdrawal': 'Today Withdrawal',
        'GGR': 'GGR (Gross Gaming Revenue)',
        'Active Members': 'Active Members',
        'View Detail': 'View Detail',
        'Language': 'Language',
        'Logout': 'Logout'
    },
    'id': {
        'Dashboard': 'Beranda',
        'Members': 'Anggota',
        'Transactions': 'Transaksi',
        'Bets': 'Taruhan',
        'Win': 'Menang',
        'Lose': 'Kalah',
        'Settings': 'Pengaturan',
        'Tools': 'Alat',
        'Providers': 'Penyedia Game',
        'Total Balance': 'Total Saldo',
        'Today Deposit': 'Deposit Hari Ini',
        'Today Withdrawal': 'Penarikan Hari Ini',
        'GGR': 'Pendapatan Kotor Game (GGR)',
        'Active Members': 'Anggota Aktif',
        'View Detail': 'Lihat Detail',
        'Language': 'Bahasa',
        'Logout': 'Keluar'
    }
};

/**
 * Translates a single string based on current user language profile
 */
export function t(key) {
    if (!key) return '';
    const lang = STATE.profile?.language === 'Indonesian' ? 'id' : 'en';
    if (!DICTIONARY[lang]) return key;
    return DICTIONARY[lang][key] || key;
}

/**
 * Sweeps the DOM and translates elements with data-i18n attribute
 * Use in HTML: <span data-i18n="Dashboard">Dashboard</span>
 */
export function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });
}

/**
 * Globally change language and persist it
 */
export async function changeLanguage(langName) {
    // Map lang param (e.g. 'id') or string 'Indonesian'
    const newLang = (langName === 'id' || langName === 'Indonesian') ? 'Indonesian' : 'English';

    STATE.profile.language = newLang;
    saveState();

    // Attempt DB sync if real backend used
    if (window.db && window.db.dbSaveSetting) {
        // Technically preferences should belong to admin_profiles, but for mock usage we keep in generic state
        const supabase = window.supabase;
        if (supabase) {
            await supabase.from('admin_profiles').update({ language: newLang }).eq('username', STATE.profile.username);
        }
    }

    // Broadcast change
    applyTranslations();

    // Re-render current page to refresh inner JS string literals
    if (typeof window.go === 'function' && window.currentPage) {
        window.go(window.currentPage);
    }

    if (window.toast) window.toast(`Language switched to ${newLang}`, 'info');
}

// Attach globally
window.t = t;
window.changeLanguage = changeLanguage;
