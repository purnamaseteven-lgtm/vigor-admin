/* ─── FORM & CRUD INFRASTRUCTURE ─── */
import { STATE, addLog, stateAdd, stateUpdate, stateDelete, BANKS, COMPANIES, STATUSES } from '../core/state.js';
import { openModal, closeModalBtn, toast } from '../ui/components.js';

export function fmVal(id) { return document.getElementById(id)?.value; }

// ── Enhancement 2: Form Validation ──
export function clearValidation() {
    document.querySelectorAll('.form-field.has-error').forEach(el => {
        el.classList.remove('has-error');
        el.querySelectorAll('.field-error-msg').forEach(e => e.remove());
    });
}

export function validateFields(fields) {
    clearValidation();
    let valid = true;
    let firstError = null;
    fields.forEach(({ id, label, rules }) => {
        const el = document.getElementById(id);
        if (!el) return;
        const val = el.value.trim();
        let error = null;
        for (const rule of (rules || [])) {
            if (rule === 'required' && !val) { error = `${label} is required`; break; }
            if (rule === 'email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { error = `${label} must be a valid email`; break; }
            if (rule.startsWith('min:') && val && Number(val) < Number(rule.split(':')[1])) { error = `${label} minimum is ${rule.split(':')[1]}`; break; }
            if (rule.startsWith('minlen:') && val.length < Number(rule.split(':')[1])) { error = `${label} must be at least ${rule.split(':')[1]} characters`; break; }
            if (rule === 'number' && val && isNaN(Number(val))) { error = `${label} must be a number`; break; }
        }
        if (error) {
            valid = false;
            const field = el.closest('.form-field') || el.parentElement;
            if (field) {
                field.classList.add('has-error');
                const msg = document.createElement('div');
                msg.className = 'field-error-msg';
                msg.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${error}`;
                field.appendChild(msg);
            }
            if (!firstError) firstError = el;
        }
    });
    if (firstError) firstError.focus();
    return valid;
}
window.validateFields = validateFields;
window.clearValidation = clearValidation;

export function openFormModal(type, id = null) {
    let title = '', body = '', footer = '';
    const isEdit = !!id;
    const data = id ? (STATE.members.find(x => x.id === id) || STATE.companies.find(x => x.id === id) || STATE.banks.find(x => x.id === id)) : null;

    if (type === 'member') {
        title = isEdit ? 'Edit Member' : 'Add New Member';
        body = `
      <div class="form-grid">
        <div class="form-field"><label>Username</label><input id="f_user" value="${data?.username || ''}" ${isEdit ? 'disabled' : ''}/></div>
        <div class="form-field"><label>Full Name</label><input id="f_name" value="${data?.name || ''}"/></div>
        <div class="form-field"><label>Company</label><select id="f_co">${COMPANIES.map(c => `<option ${data?.company === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
        <div class="form-field"><label>Phone</label><input id="f_phone" value="${data?.phone || ''}"/></div>
        <div class="form-field"><label>Bank</label><select id="f_bank">${BANKS.map(b => `<option ${data?.bank === b ? 'selected' : ''}>${b}</option>`).join('')}</select></div>
        <div class="form-field"><label>Account Number</label><input id="f_acc" value="${data?.bankAccount || ''}"/></div>
        <div class="form-field"><label>Status</label><select id="f_status">${STATUSES.map(s => `<option ${data?.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
      </div>`;
        footer = `<button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button><button class="btn btn-primary" onclick="window.saveMember('${id}')">Save Member</button>`;
    } else if (type === 'company') {
        title = isEdit ? 'Edit Company' : 'Add New Company';
        body = `
      <div class="form-grid">
        <div class="form-field"><label>Username</label><input id="f_user" value="${data?.username || ''}" ${isEdit ? 'disabled' : ''}/></div>
        <div class="form-field"><label>Company Name</label><input id="f_name" value="${data?.name || ''}"/></div>
        <div class="form-field"><label>Email</label><input id="f_email" value="${data?.email || ''}"/></div>
        <div class="form-field"><label>Initial Credit</label><input type="number" id="f_credit" value="${data?.credit || 0}"/></div>
        <div class="form-field"><label>Type</label><select id="f_type"><option ${data?.type === 'Company' ? 'selected' : ''}>Company</option><option ${data?.type === 'Whitelabel' ? 'selected' : ''}>Whitelabel</option><option ${data?.type === 'Master' ? 'selected' : ''}>Master</option></select></div>
        <div class="form-field"><label>Status</label><select id="f_status"><option ${data?.status === 'Active' ? 'selected' : ''}>Active</option><option ${data?.status === 'Inactive' ? 'selected' : ''}>Inactive</option></select></div>
        <div class="form-field" style="grid-column: 1/-1"><label>Pools Access</label>
          <div style="max-height: 120px; overflow-y: auto; background: var(--bg2); padding: .5rem; border: 1px solid var(--border); border-radius: 6px; display: grid; grid-template-columns: 1fr 1fr; gap: .25rem">
            ${['4D Togel External', '4D Togel Vigor', '4D Togel Global', '6D Togel Vigor', 'SINGAPORE', 'HONGKONG', 'SYDNEY', 'PCSO', 'CAMBODIA', 'MAGNUM', 'DAMACAI', 'TOTO'].map(p => `
              <label style="display: flex; align-items: center; gap: .5rem; font-size: .75rem; cursor: pointer">
                <input type="checkbox" name="f_pools" value="${p}" ${data?.togelMarkets?.includes(p) ? 'checked' : ''}> ${p}
              </label>
            `).join('')}
          </div>
        </div>
      </div>`;
        footer = `<button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button><button class="btn btn-primary" onclick="window.saveCompany('${id}')">Save Company</button>`;
    } else if (type === 'bank') {
        title = isEdit ? 'Edit Bank Account' : 'Add Bank Account';
        body = `
      <div class="form-grid">
        <div class="form-field"><label>Bank Name</label><select id="f_bank">${BANKS.map(b => `<option ${data?.bank === b ? 'selected' : ''}>${b}</option>`).join('')}</select></div>
        <div class="form-field"><label>Account Name</label><input id="f_acc_name" value="${data?.accountName || ''}"/></div>
        <div class="form-field"><label>Account Number</label><input id="f_acc_num" value="${data?.accountNumber || ''}"/></div>
        <div class="form-field"><label>Type</label><select id="f_type"><option>Deposit</option><option>Withdrawal</option><option selected>Both</option></select></div>
      </div>`;
        footer = `<button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button><button class="btn btn-primary" onclick="window.saveBank('${id}')">Save Bank</button>`;
    } else {

        title = 'Generic Form';
        body = '<p>Form content for ' + type + ' goes here.</p>';
        footer = `<button class="btn btn-secondary" onclick="closeModalBtn()">Close</button>`;
    }

    openModal(title, body, footer);
}

export function saveMember(id) {
    const isEdit = id && id !== 'null';
    if (!validateFields([
        { id: 'f_user', label: 'Username', rules: isEdit ? [] : ['required', 'minlen:3'] },
        { id: 'f_name', label: 'Full Name', rules: ['required'] },
        { id: 'f_phone', label: 'Phone', rules: ['required', 'minlen:8'] },
        { id: 'f_acc', label: 'Account Number', rules: ['required'] },
    ])) return;
    const payload = {
        username: fmVal('f_user'), name: fmVal('f_name'), company: fmVal('f_co'),
        phone: fmVal('f_phone'), bank: fmVal('f_bank'), bankAccount: fmVal('f_acc'), status: fmVal('f_status')
    };
    if (isEdit) {
        if (window.db?.dbUpdateMember) {
            window.db.dbUpdateMember(id, payload).then(({ error }) => {
                if (error) { toast('Update failed: ' + error.message, 'error'); return; }
                toast('Member updated successfully', 'success');
                if (window.db?.dbWriteLog) window.db.dbWriteLog('Update Member', id, `Updated details for ${payload.username}`);
            });
        } else {
            stateUpdate('members', id, payload);
            addLog('Update Member', id, `Updated details for ${payload.username}`);
            toast('Member updated successfully', 'success');
        }
    } else {
        const newId = 'M' + Date.now();
        const newMember = { id: newId, ...payload, balance: 0, joined: new Date().toLocaleDateString(), lastLogin: '-', ip: '-' };
        if (window.db?.dbAddMember) {
            window.db.dbAddMember(newMember).then(({ error }) => {
                if (error) { toast('Failed: ' + error.message, 'error'); return; }
                toast('Member added successfully', 'success');
                if (window.db?.dbWriteLog) window.db.dbWriteLog('Add Member', newId, `Registered new member ${payload.username}`);
            });
        } else {
            stateAdd('members', newMember);
            addLog('Add Member', newId, `Registered new member ${payload.username}`);
            toast('Member added successfully', 'success');
        }
    }
    closeModalBtn();
    if (window.currentPage === 'global-member-list') setTimeout(() => window.go('global-member-list'), 300);
}

export function saveCompany(id) {
    const isEdit = id && id !== 'null';
    if (!validateFields([
        { id: 'f_user', label: 'Username', rules: isEdit ? [] : ['required', 'minlen:3'] },
        { id: 'f_name', label: 'Company Name', rules: ['required'] },
        { id: 'f_email', label: 'Email', rules: ['required', 'email'] },
        { id: 'f_credit', label: 'Credit', rules: ['required', 'number', 'min:0'] },
    ])) return;
    const pools = Array.from(document.querySelectorAll('input[name="f_pools"]:checked')).map(el => el.value);
    const payload = {
        username: fmVal('f_user'), name: fmVal('f_name'), email: fmVal('f_email'),
        credit: parseInt(fmVal('f_credit')), type: fmVal('f_type'), status: fmVal('f_status'),
        togelMarkets: pools
    };
    if (isEdit) {
        if (window.db?.dbUpdateCompany) {
            window.db.dbUpdateCompany(id, payload).then(({ error }) => {
                if (error) { toast('Update failed: ' + error.message, 'error'); return; }
                if (window.db?.dbWriteLog) window.db.dbWriteLog('Update Company', id, `Updated company ${payload.name}`);
                toast('Company updated successfully', 'success');
            });
        } else {
            stateUpdate('companies', id, payload);
            addLog('Update Company', id, `Updated company ${payload.name}`);
            toast('Company updated successfully', 'success');
        }
    } else {
        const newId = 'C' + Date.now();
        const newCompany = { id: newId, ...payload, members: 0, joined: new Date().toISOString().split('T')[0] };
        if (window.db?.dbAddCompany) {
            window.db.dbAddCompany(newCompany).then(({ error }) => {
                if (error) { toast('Failed: ' + error.message, 'error'); return; }
                if (window.db?.dbWriteLog) window.db.dbWriteLog('Add Company', newId, `Created company ${payload.name}`);
                toast('Company created successfully', 'success');
            });
        } else {
            stateAdd('companies', newCompany);
            addLog('Add Company', newId, `Created company ${payload.name}`);
            toast('Company created successfully', 'success');
        }
    }
    closeModalBtn();
    if (window.currentPage) window.go(window.currentPage);
}

export function saveBank(id) {
    if (!validateFields([
        { id: 'f_acc_name', label: 'Account Name', rules: ['required'] },
        { id: 'f_acc_num', label: 'Account Number', rules: ['required', 'minlen:5'] },
    ])) return;
    const payload = {
        bank: fmVal('f_bank'), accountName: fmVal('f_acc_name'), accountNumber: fmVal('f_acc_num'),
        type: fmVal('f_type'), status: 'Active', minDeposit: 10000, maxDeposit: 100000000
    };
    if (id && id !== 'null') {
        if (window.db?.dbUpdateBank) {
            window.db.dbUpdateBank(id, payload).then(({ error }) => {
                if (error) { toast('Update failed: ' + error.message, 'error'); return; }
                if (window.db?.dbWriteLog) window.db.dbWriteLog('Update Bank', id, `Updated bank ${payload.bank} ${payload.accountNumber}`);
                toast('Bank account updated', 'success');
            });
        } else {
            stateUpdate('banks', id, payload);
            toast('Bank account updated', 'success');
        }
    } else {
        const newId = 'B' + Date.now();
        if (window.db?.dbAddBank) {
            window.db.dbAddBank({ id: newId, ...payload }).then(({ error }) => {
                if (error) { toast('Failed: ' + error.message, 'error'); return; }
                if (window.db?.dbWriteLog) window.db.dbWriteLog('Add Bank', newId, `Added bank ${payload.bank} ${payload.accountNumber}`);
                toast('Bank account added', 'success');
            });
        } else {
            stateAdd('banks', { id: newId, ...payload });
            toast('Bank account added', 'success');
        }
    }
    closeModalBtn();
    if (window.currentPage === 'bank-list') window.go('bank-list');
}

/* ─── DELETE HELPERS (wired to DB + STATE fallback) ─── */
window.deleteMember = async (id, username) => {
    if (window.db?.dbDeleteMember) {
        const { error } = await window.db.dbDeleteMember(id);
        if (error) { toast('Delete failed: ' + error.message, 'error'); return; }
        if (window.db?.dbWriteLog) window.db.dbWriteLog('Delete Member', id, `Deleted member ${username}`);
    } else {
        stateDelete('members', id);
        addLog('Delete Member', id, `Deleted member ${username}`);
    }
    toast('Member deleted', 'success');
    window.go(window.currentPage || 'global-member-list');
};

window.deleteCompany = async (id, name, redirectPage = 'company-list') => {
    if (window.db?.dbDeleteCompany) {
        const { error } = await window.db.dbDeleteCompany(id);
        if (error) { toast('Delete failed: ' + error.message, 'error'); return; }
        if (window.db?.dbWriteLog) window.db.dbWriteLog('Delete Company', id, `Deleted company ${name}`);
    } else {
        stateDelete('companies', id);
        addLog('Delete Company', id, `Deleted company ${name}`);
    }
    toast('Company deleted', 'success');
    window.go(redirectPage);
};

window.deleteBank = async (id, name) => {
    if (window.db?.dbDeleteBank) {
        const { error } = await window.db.dbDeleteBank(id);
        if (error) { toast('Delete failed: ' + error.message, 'error'); return; }
        if (window.db?.dbWriteLog) window.db.dbWriteLog('Delete Bank', id, `Deleted bank ${name}`);
    } else {
        stateDelete('banks', id);
        addLog('Delete Bank', id, `Deleted bank ${name}`);
    }
    toast('Bank deleted', 'success');
    window.go('bank-list');
};

window.openFormModal = openFormModal;
window.saveMember = saveMember;
window.saveCompany = saveCompany;
window.saveBank = saveBank;
