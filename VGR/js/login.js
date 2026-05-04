/* MAIN LOGIN LOGIC */
import { signIn } from './core/auth.js';
import { SUPABASE_ENABLED } from './core/supabase.js';

let captchaCode = '84721';

export function refreshCaptcha() {
    captchaCode = Math.floor(10000 + Math.random() * 90000).toString();
    const el = document.getElementById('captchaText');
    if (el) el.textContent = captchaCode;
}

export function togglePass() {
    const inp = document.getElementById('password');
    const ico = document.getElementById('eyeIcon');
    if (!inp || !ico) return;
    if (inp.type === 'password') {
        inp.type = 'text';
        ico.className = 'fa-regular fa-eye-slash';
    } else {
        inp.type = 'password';
        ico.className = 'fa-regular fa-eye';
    }
}

export async function handleLogin(e) {
    e.preventDefault();
    const err = document.getElementById('loginError');
    const btn = document.querySelector('.btn-login');
    const cap = document.getElementById('captchaInput').value.trim();

    if (cap !== captchaCode) {
        showError('Invalid verification code. Please try again.');
        refreshCaptcha();
        document.getElementById('captchaInput').value = '';
        return;
    }

    const emailOrUser = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!emailOrUser || !password) {
        showError('Please enter your email and password.');
        return;
    }

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing in...';
    btn.disabled = true;
    err.style.display = 'none';

    if (!SUPABASE_ENABLED) {
        showModeNotice();
    }

    const email = emailOrUser.includes('@') ? emailOrUser : `${emailOrUser}@vigor.internal`;
    const { error } = await signIn(email, password);

    if (error) {
        showError(error.message || 'Login failed. Check your credentials.');
        btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Sign In';
        btn.disabled = false;
        refreshCaptcha();
        document.getElementById('captchaInput').value = '';
        return;
    }

    btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Success!';
    setTimeout(() => { window.location.href = './app.html'; }, 600);
}

function showError(msg) {
    const err = document.getElementById('loginError');
    err.textContent = msg;
    err.style.display = 'block';
}

function showModeNotice() {
    const err = document.getElementById('loginError');
    err.style.background = 'rgba(14,165,233,.12)';
    err.style.borderColor = 'rgba(14,165,233,.3)';
    err.style.color = '#38bdf8';
    err.innerHTML = '<i class="fa-solid fa-circle-info"></i> Running in <strong>Demo Mode</strong> - use the configured demo credentials.';
    err.style.display = 'block';
}

window.refreshCaptcha = refreshCaptcha;
window.togglePass = togglePass;
window.handleLogin = handleLogin;

document.addEventListener('DOMContentLoaded', refreshCaptcha);
