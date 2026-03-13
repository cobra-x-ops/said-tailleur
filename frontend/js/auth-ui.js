/**
 * auth-ui.js
 * Handles Main Authentication UI Logic (Login/Register)
 * Cleaned up from inline script in login.html
 */

// Check if user is already logged in (via User object)
// Run immediately to prevent flash of login screen
if (localStorage.getItem('annakhil_user')) {
    const user = JSON.parse(localStorage.getItem('annakhil_user'));
    if (user.role === 'admin') {
        window.location.href = 'admin-dashboard.html';
    } else {
        window.location.href = 'dashboard.html';
    }
}

function toggleView(view) {
    const loginView = document.getElementById('login-view');
    const regView = document.getElementById('register-view');

    // Simple fade transition
    if (view === 'login') {
        regView.style.display = 'none';
        loginView.style.display = 'block';
        loginView.style.animation = 'slideUp 0.5s cubic-bezier(0.19, 1, 0.22, 1)';
    } else {
        loginView.style.display = 'none';
        regView.style.display = 'block';
        regView.style.animation = 'slideUp 0.5s cubic-bezier(0.19, 1, 0.22, 1)';
    }
}

function setLoading(btnId, isLoading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;

    const span = btn.querySelector('span');
    if (isLoading) {
        btn.disabled = true;
        if (span) span.innerText = 'Traitement...';
        if (!btn.querySelector('.spinner')) {
            const spinner = document.createElement('div');
            spinner.className = 'spinner';
            btn.appendChild(spinner);
        }
    } else {
        btn.disabled = false;
        if (span) span.innerText = btnId === 'login-btn' ? 'Se Connecter' : 'Créer mon Compte';
        const spinner = btn.querySelector('.spinner');
        if (spinner) spinner.remove();
    }
}

// Toast Notification Helper (copied from admin-dashboard.js for consistency)
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = "position:fixed; bottom:20px; right:20px; z-index:9999; display:flex; flex-direction:column; gap:10px;";
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.style.cssText = `
        padding: 12px 20px;
        border-radius: 6px;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#333'};
        color: white;
        font-family: 'Inter', sans-serif;
        font-size: 13px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.3s ease;
    `;
    toast.innerText = message;

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });

    // Remove
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Attach event listeners safely
document.addEventListener('DOMContentLoaded', () => {
    const toReg = document.getElementById('link-to-register');
    const toLogin = document.getElementById('link-to-login');

    if (toReg) toReg.addEventListener('click', (e) => {
        e.preventDefault();
        toggleView('register');
    });

    if (toLogin) toLogin.addEventListener('click', (e) => {
        e.preventDefault();
        toggleView('login');
    });

    // Handle Login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            setLoading('login-btn', true);

            try {
                const res = await fetch('http://localhost:3030/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();

                if (data.success) {
                    localStorage.setItem('annakhil_user', JSON.stringify(data.user));
                    localStorage.setItem('annakhil_token', data.token);
                    showToast('Connexion réussie', 'success');
                    setTimeout(() => {
                        if (data.user.role === 'admin') {
                            location.href = 'admin-dashboard.html';
                        } else {
                            location.href = 'dashboard.html';
                        }
                    }, 1000);
                } else {
                    showToast(data.error || 'Erreur de connexion', 'error');
                }
            } catch (err) {
                console.error(err);
                showToast('Erreur serveur', 'error');
            } finally {
                setLoading('login-btn', false);
            }
        };
    }

    // Handle Register
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.onsubmit = async (e) => {
            e.preventDefault();
            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;

            setLoading('reg-btn', true);

            try {
                const res = await fetch('http://localhost:3030/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ name, email, password })
                });
                const data = await res.json();

                if (data.success) {
                    localStorage.setItem('annakhil_user', JSON.stringify(data.user));
                    localStorage.setItem('annakhil_token', data.token);
                    showToast('Bienvenue chez Annakhil', 'success');
                    setTimeout(() => {
                        if (data.user.role === 'admin') {
                            location.href = 'admin-dashboard.html';
                        } else {
                            location.href = 'dashboard.html';
                        }
                    }, 1000);
                } else {
                    showToast(data.error || 'Erreur inscription', 'error');
                }
            } catch (err) {
                console.error(err);
                showToast('Erreur serveur', 'error');
            } finally {
                setLoading('reg-btn', false);
            }
        };
    }
});
