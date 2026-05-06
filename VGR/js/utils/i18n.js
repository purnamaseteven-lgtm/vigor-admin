/* ─── i18n LOCALIZATION UTILITY ─── */
import { STATE, saveState } from '../core/state.js';

const TRANSLATIONS = {
    en: {
        dashboard: 'Dashboard',
        welcome_back: 'Welcome back',
        total_deposit: 'Total Deposit',
        total_withdrawal: 'Total Withdrawal',
        total_members: 'Total Members',
        active_players: 'Active Players',
        today_regs: 'Today Registrations',
        converted: 'Converted',
        system_control: 'System Control',
        company_mgmt: 'Company Management',
        member_mgmt: 'Member Management',
        finance: 'Finance',
        reports: 'Reports',
        settings: 'Settings',
        logout: 'Sign Out',
        search: 'Search...',
        no_data: 'No data found',
        whale_alert: 'Whale Alert',
        churn_risk: 'Churn Risk',
    },
    id: {
        dashboard: 'Dasbor',
        welcome_back: 'Selamat datang kembali',
        total_deposit: 'Total Setoran',
        total_withdrawal: 'Total Penarikan',
        total_members: 'Total Member',
        active_players: 'Pemain Aktif',
        today_regs: 'Registrasi Hari Ini',
        converted: 'Terdaftar & Deposit',
        system_control: 'Kontrol Sistem',
        company_mgmt: 'Manajemen Perusahaan',
        member_mgmt: 'Manajemen Member',
        finance: 'Keuangan',
        reports: 'Laporan',
        settings: 'Pengaturan',
        logout: 'Keluar',
        search: 'Cari...',
        no_data: 'Data tidak ditemukan',
        whale_alert: 'Peringatan Whale',
        churn_risk: 'Risiko Churn',
    }
};

export function t(key) {
    const lang = STATE.settings?.lang || 'en';
    return TRANSLATIONS[lang][key] || key;
}

export function setLang(lang) {
    if (!STATE.settings) STATE.settings = {};
    STATE.settings.lang = lang;
    saveState();
    window.location.reload();
}

window.setLang = setLang;
