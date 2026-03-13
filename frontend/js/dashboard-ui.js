/**
 * dashboard-ui.js
 * Handles Dashboard Interactivity (Navigation, Auth Check, Mobile Menu)
 * Cleaned up from inline script in dashboard.html
 */

// ========================================
// AUTHENTICATION PROTECTION
// ========================================

// Get auth data from localStorage (with safe parsing)
let user = null;

try {
    // NOTE: Token is now handled via HttpOnly Cookie (Invisible to JS)
    const userStr = localStorage.getItem('annakhil_user');
    if (userStr && userStr !== 'undefined' && userStr !== 'null') {
        user = JSON.parse(userStr);
    }
} catch (e) {
    console.error('Error parsing auth data:', e);
}

// Redirect if not authenticated (Check LS first, will double check via API)
if (!user) {
    location.href = 'login.html';
}

// ========================================
// LOGOUT FUNCTION (Production-Ready)
// ========================================
async function logout() {
    try {
        await fetch('http://localhost:3030/api/auth/logout', { credentials: 'include' }); // Clear cookie on server
    } catch (e) {
        console.error(e);
    }

    // 1. Clear all auth data from local storage
    localStorage.removeItem('annakhil_user');
    localStorage.removeItem('annakhil_token'); // Cleanup legacy

    // 2. Clear session storage
    sessionStorage.clear();

    // 3. Show confirmation
    if (window.Ecommerce && window.Ecommerce.showNotification) {
        window.Ecommerce.showNotification('Déconnexion réussie', 'success');
    }

    // 4. Redirect to homepage
    location.href = 'index.html';
}

// ========================================
// DASHBOARD INITIALIZATION
// ========================================
async function initDashboard() {
    // 1. Refresh User Data from Server (Cookie Auth)
    try {
        const res = await fetch('http://localhost:3030/api/auth/me', { credentials: 'include' }); // Cookie sent automatically

        if (res.ok) {
            const json = await res.json();
            if (json.success) {
                // Update local storage with fresh data
                user = { ...user, ...json.data };
                localStorage.setItem('annakhil_user', JSON.stringify(user));
                console.log('Session refreshed (Secure Cookie). Role:', user.role);
            } else {
                // Auth failed (invalid cookie)
                logout();
            }
        } else {
            // 401 Unauthorized
            logout();
        }
    } catch (err) {
        console.warn('Session refresh failed:', err);
        // Don't auto-logout on network error to allow offline viewing of cached dashboard
    }

    if (!user) return;

    // Fill user info
    const elInitial = document.getElementById('user-initial');
    const elName = document.getElementById('sidebar-name');
    const elTier = document.getElementById('sidebar-tier');
    const elWelcome = document.getElementById('welcome-msg');
    const elPoints = document.getElementById('loyalty-points');

    if (elInitial) elInitial.innerText = user.name?.charAt(0)?.toUpperCase() || 'U';
    if (elName) elName.innerText = user.name || 'Client';
    if (elTier) elTier.innerText = `Membre ${user.loyalty?.tier || 'Silver'}`;
    if (elWelcome) elWelcome.innerText = `Bonjour, ${user.name?.split(' ')[0] || 'Client'}`;
    if (elPoints) elPoints.innerText = user.loyalty?.points || 0;

    // Handle Welcome Offer
    if (user.welcomeOffer && !user.welcomeOffer.isUsed && user.welcomeOffer.code) {
        const offerCard = document.getElementById('welcome-offer-card');
        const codeEl = document.getElementById('coupon-code');

        if (offerCard && codeEl) {
            offerCard.style.display = 'block';
            codeEl.innerText = user.welcomeOffer.code;
        }
    }

    // Show Admin Link if Admin
    if (user.role === 'admin') {
        const adminLink = document.getElementById('admin-dashboard-link');
        if (adminLink) {
            adminLink.style.display = 'flex';
            adminLink.addEventListener('click', () => {
                window.location.href = 'admin-dashboard.html';
            });
        }
    }

    // Init AI Recommendations
    if (window.Recommendations) {
        window.Recommendations.trackView({
            category: 'Dashboard'
        });
        window.Recommendations.render('ai-recommendations');
    }
}

// ========================================
// NAVIGATION HANDLING
// ========================================
function setupNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    const sections = document.querySelectorAll('.dashboard-section');
    const sectionIds = ['section-overview', 'section-orders', 'section-appointments', 'section-wishlist'];

    menuItems.forEach((item) => {
        // HANDLE LOGOUT
        if (item.classList.contains('logout-btn')) {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
                    logout();
                }
            });
            return;
        }

        // HANDLE NAVIGATION
        const targetId = item.dataset.target;
        if (targetId) {
            item.addEventListener('click', () => {
                // Activate Menu
                document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                // Show Section
                sections.forEach(s => s.style.display = 'none');
                const target = document.getElementById(targetId);
                if (target) {
                    target.style.display = 'block';
                    target.style.animation = 'fadeUp 0.5s ease';
                }
            });
        }
    });

    // HANDLE MOBILE MENU (More Button)
    const mobileMenuBtn = document.getElementById('mobile-menu-more');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            // Create and show mobile menu drawer
            showMobileMenuDrawer();
        });
    }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
function copyCoupon() {
    const code = document.getElementById('coupon-code')?.innerText;
    if (!code || code === 'LOADING...') return;

    navigator.clipboard.writeText(code).then(() => {
        if (window.Ecommerce && window.Ecommerce.showNotification) {
            window.Ecommerce.showNotification('Code copié dans le presse-papier !', 'success');
        } else {
            alert('Code copié !');
        }
    }).catch(() => {
        alert('Impossible de copier. Code: ' + code);
    });
}

// ========================================
// MOBILE MENU DRAWER
// ========================================
function showMobileMenuDrawer() {
    // Remove existing drawer if any
    const existing = document.getElementById('mobile-menu-drawer');
    if (existing) existing.remove();

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'mobile-menu-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        z-index: 9998;
        backdrop-filter: blur(4px);
        animation: fadeIn 0.3s ease;
    `;

    // Create drawer
    const drawer = document.createElement('div');
    drawer.id = 'mobile-menu-drawer';
    drawer.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        background: var(--bg-card);
        border-top: 1px solid var(--border);
        border-radius: 20px 20px 0 0;
        z-index: 9999;
        padding: 30px 20px 40px;
        box-shadow: 0 -10px 40px rgba(0,0,0,0.5);
        animation: slideUp 0.3s ease;
    `;

    drawer.innerHTML = `
        <div style="text-align:center; margin-bottom:30px;">
            <div style="width:40px; height:4px; background:var(--border); margin:0 auto; border-radius:2px;"></div>
        </div>
        <ul style="list-style:none; padding:0; margin:0;">
            ${user && user.role === 'admin' ? `
            <li style="padding:15px; border-bottom:1px solid var(--border); cursor:pointer;"
                data-action="admin">
                <div style="display:flex; align-items:center; gap:15px;">
                    <span style="font-size:20px;">⚙️</span>
                    <span style="color:var(--gold); font-weight:600;">Admin Dashboard</span>
                </div>
            </li>
            ` : ''}
            <li style="padding:15px; border-bottom:1px solid var(--border); cursor:pointer;"
                data-action="shop">
                <div style="display:flex; align-items:center; gap:15px;">
                    <span style="font-size:20px;">🛍️</span>
                    <span style="font-weight:500;">Boutique</span>
                </div>
            </li>
            <li style="padding:15px; border-bottom:1px solid var(--border); cursor:pointer;"
                data-action="about">
                <div style="display:flex; align-items:center; gap:15px;">
                    <span style="font-size:20px;">ℹ️</span>
                    <span style="font-weight:500;">À Propos</span>
                </div>
            </li>
            <li style="padding:15px; cursor:pointer; color:#d9534f;"
                data-action="logout">
                <div style="display:flex; align-items:center; gap:15px;">
                    <span style="font-size:20px;">🚪</span>
                    <span style="font-weight:600;">Déconnexion</span>
                </div>
            </li>
        </ul>
    `;

    // Close handlers
    const closeMobileMenu = () => {
        drawer.style.animation = 'slideDown 0.3s ease';
        overlay.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            drawer.remove();
            overlay.remove();
        }, 300);
    };

    overlay.addEventListener('click', closeMobileMenu);

    // Add event listeners to menu items (CSP-compliant)
    drawer.querySelectorAll('li[data-action]').forEach(item => {
        item.addEventListener('click', () => {
            const action = item.dataset.action;
            closeMobileMenu();

            setTimeout(() => {
                if (action === 'admin') {
                    window.location.href = 'admin-dashboard.html';
                } else if (action === 'shop') {
                    window.location.href = 'shop.html';
                } else if (action === 'about') {
                    window.location.href = 'about.html';
                } else if (action === 'logout') {
                    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
                        logout();
                    }
                }
            }, 300); // Wait for drawer to close
        });
    });

    // Add animations logic (Dynamic Styles)
    // We try to reuse existing classes if possible, but keeping inline style inject for now.
    // Ideally this goes to CSS file, but for faithful extraction we include it.
    if (!document.getElementById('mobile-drawer-styles')) {
        const style = document.createElement('style');
        style.id = 'mobile-drawer-styles';
        style.textContent = `
            @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
            @keyframes slideDown { from { transform: translateY(0); } to { transform: translateY(100%); } }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        `;
        document.head.appendChild(style);
    }

    // Append to body
    document.body.appendChild(overlay);
    document.body.appendChild(drawer);
}

// ========================================
// INITIALIZE ON DOM READY
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
    setupNavigation();
    console.log('Dashboard initialized for user:', user?.name);
});
