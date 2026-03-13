/**
 * TAILLEUR ANNAKHIL - E-commerce Engine v3.0
 * Single Source of Truth: localStorage
 * All cart operations read fresh data from localStorage
 */

const Ecommerce = (() => {
    let isInit = false;
    const CART_KEY = 'annakhil_cart';
    const USER_KEY = 'annakhil_user';
    const TOKEN_KEY = 'annakhil_token';
    const THEME_KEY = 'annakhil_theme';

    // --- CART HELPERS (Single Source of Truth) ---
    const getCart = () => {
        try {
            return JSON.parse(localStorage.getItem(CART_KEY)) || [];
        } catch (e) {
            console.error('Cart parse error:', e);
            return [];
        }
    };

    const saveCart = (cartData) => {
        localStorage.setItem(CART_KEY, JSON.stringify(cartData));
        renderCartCount();
        console.log('Cart saved:', cartData.length, 'items');
    };

    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem(USER_KEY)) || null;
        } catch (e) {
            return null;
        }
    };

    const getToken = () => null; // Deprecated: Tokens are now HttpOnly cookies

    // --- API CONFIG ---
    const API_URL = 'http://localhost:3030/api';

    // --- AUTH LOGIC ---
    // --- AUTH LOGIC ---
    const updateAuthUI = () => {
        const user = getUser();
        const authElements = document.querySelectorAll('[data-auth-only]');
        const guestElements = document.querySelectorAll('[data-guest-only]');

        if (user) {
            authElements.forEach(el => el.style.display = 'block');
            guestElements.forEach(el => el.style.display = 'none');
        } else {
            authElements.forEach(el => el.style.display = 'none');
            guestElements.forEach(el => el.style.display = 'block');
        }
    };

    // --- THEME LOGIC ---
    let theme = localStorage.getItem(THEME_KEY) || 'dark';

    const applyTheme = () => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_KEY, theme);
        updateThemeToggleUI();
    };

    const toggleTheme = () => {
        theme = theme === 'dark' ? 'light' : 'dark';
        applyTheme();
    };

    const updateThemeToggleUI = () => {
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            toggleBtn.innerHTML = theme === 'dark' ? '🌙' : '☀️';
            toggleBtn.title = `Passer au mode ${theme === 'dark' ? 'clair' : 'sombre'}`;
        }
    };

    const injectThemeSwitcher = () => {
        const actions = document.querySelector('.header-actions');
        if (!actions || document.getElementById('theme-toggle')) return;

        const btn = document.createElement('button');
        btn.id = 'theme-toggle';
        btn.className = 'nav-link';
        btn.type = 'button';
        btn.style.cssText = 'background:none; border:none; cursor:pointer; font-size:20px; padding:0; line-height:1; display:flex; align-items:center; z-index:100;';
        actions.prepend(btn);

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleTheme();
        });

        updateThemeToggleUI();
    };

    // --- CART LOGIC ---
    const addToCart = async (product) => {
        if (!product.id) {
            console.error("Add to Cart Error: Missing Product ID", product);
            showNotification("Erreur: Produit invalide", "error");
            return;
        }

        // Validate required fields
        const validProduct = {
            id: product.id,
            title: product.title || 'Produit',
            price: parseFloat(product.price) || 0,
            mainImage: product.mainImage || 'default-product.jpg',
            currency: product.currency || 'MAD',
            quantity: 1
        };

        // Get fresh cart from localStorage
        const cart = getCart();
        const existingIndex = cart.findIndex(item => item.id === product.id);

        if (existingIndex > -1) {
            cart[existingIndex].quantity += 1;
        } else {
            cart.push(validProduct);
        }

        saveCart(cart);
        showNotification(`${validProduct.title} ajouté au panier`);
        toggleCart(true);

        // Optional server sync for logged-in users
        const user = getUser();
        if (user && user.id) {
            try {
                await fetch(`${API_URL}/cart`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: user.id,
                        productId: product.id,
                        quantity: 1
                    })
                });
            } catch (err) { console.warn("Server Cart Sync Failed", err); }
        }
    };

    const quickAdd = (btn) => {
        const data = btn.dataset;
        addToCart({
            id: data.id,
            title: data.title,
            price: data.price,
            mainImage: data.image,
            currency: data.currency || 'MAD'
        });
    };

    const removeFromCart = async (productId) => {
        const cart = getCart().filter(item => item.id !== productId);
        saveCart(cart);
        renderCart();

        const user = getUser();
        if (user && user.id) {
            try {
                await fetch(`${API_URL}/cart/${user.id}/${productId}`, { method: 'DELETE' });
            } catch (err) { console.warn("Server Cart Remove Failed", err); }
        }
    };

    const getCartTotal = () => {
        const cart = getCart();
        return cart.reduce((total, item) => {
            if (!item.price) return total;
            const price = parseFloat(item.price.toString().replace(/[^0-9.]/g, '')) || 0;
            const qty = parseInt(item.quantity) || 1;
            return total + (price * qty);
        }, 0);
    };

    const renderCartCount = () => {
        const cart = getCart();
        const count = cart.reduce((total, item) => total + (parseInt(item.quantity) || 1), 0);
        document.querySelectorAll('.cart-count').forEach(el => el.innerText = count);
    };

    // --- UI UTILS ---
    const showNotification = (message, type = 'success') => {
        const toast = document.createElement('div');
        toast.className = `luxe-toast ${type}`;
        toast.innerHTML = `<span>${message}</span>`;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('visible'), 100);
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    };

    const toggleCart = (force) => {
        const drawer = document.querySelector('.cart-drawer');
        const overlay = document.querySelector('.cart-overlay');
        if (!drawer || !overlay) return;

        if (force === true) { drawer.classList.add('open'); overlay.classList.add('active'); }
        else if (force === false) { drawer.classList.remove('open'); overlay.classList.remove('active'); }
        else { drawer.classList.toggle('open'); overlay.classList.toggle('active'); }

        if (drawer.classList.contains('open')) renderCart();
    };

    const renderCart = () => {
        const list = document.getElementById('cart-items-list');
        const totalEl = document.getElementById('cart-total-price');
        if (!list || !totalEl) return;

        const cart = getCart();

        if (cart.length === 0) {
            list.innerHTML = `<p style="text-align:center; padding:40px; color:var(--text-muted); font-size:13px;">Votre panier est vide.</p>`;
            totalEl.innerText = '0 MAD';
            return;
        }

        list.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.mainImage}" loading="lazy">
                <div style="flex:1;">
                    <h4 style="font-size:14px; margin-bottom:5px;">${item.title}</h4>
                    <p style="font-size:12px; color:var(--text-muted);">Qté: ${item.quantity}</p>
                    <p style="font-size:13px; color:var(--gold); margin-top:5px;">${item.price} ${item.currency}</p>
                </div>
                <button class="remove-item-btn" data-id="${item.id}" style="background:none; border:none; cursor:pointer; opacity:0.3; font-size:18px;">✕</button>
            </div>
        `).join('');

        list.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', () => removeFromCart(btn.dataset.id));
        });

        totalEl.innerText = `${getCartTotal()} MAD`;
    };

    // --- INITIALIZATION ---
    let revealObserver = null;

    const init = async () => {
        if (!revealObserver) {
            revealObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) entry.target.classList.add('visible');
                });
            }, { threshold: 0.1 });
        }

        document.querySelectorAll('[data-reveal]:not(.visible)').forEach(el => revealObserver.observe(el));

        if (isInit) return;
        isInit = true;

        applyTheme();
        injectThemeSwitcher();

        // 🔒 AUTH CHECK: Verify HttpOnly cookie with backend
        try {
            const res = await fetch(`${API_URL}/auth/check`, { credentials: 'include' });
            const data = await res.json();

            if (data.success && data.user) {
                localStorage.setItem(USER_KEY, JSON.stringify(data.user));
            } else {
                localStorage.removeItem(USER_KEY);
                localStorage.removeItem(TOKEN_KEY);
            }
        } catch (err) {
            console.warn('Auth check failed', err);
        }

        renderCartCount();
        updateAuthUI();

        const header = document.querySelector('.luxe-header');
        if (header) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 50) header.classList.add('scrolled');
                else header.classList.remove('scrolled');
            });
        }

        // Mobile Hamburger Menu Toggle
        const mobileMenuBtn = document.getElementById('mobile-menu-toggle');
        const navLinks = document.querySelector('.nav-links');

        if (mobileMenuBtn && navLinks) {
            mobileMenuBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                mobileMenuBtn.classList.toggle('active');
                navLinks.classList.toggle('mobile-open');
            });

            // Close menu when clicking a link
            navLinks.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    mobileMenuBtn.classList.remove('active');
                    navLinks.classList.remove('mobile-open');
                });
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.nav-links') && !e.target.closest('.mobile-menu-btn')) {
                    mobileMenuBtn.classList.remove('active');
                    navLinks.classList.remove('mobile-open');
                }
            });
        }

        // WhatsApp Contact Form Handler
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault(); // Stop form submission

                const name = document.getElementById('name').value;
                const email = document.getElementById('email').value;
                const message = document.getElementById('message').value;

                // Construct the WhatsApp message
                const text = `*Consultation - Tailleur Annakhil*\n\n` +
                    `*Nom:* ${name}\n` +
                    `*Email:* ${email}\n` +
                    `*Projet:* ${message}`;

                // Show visual feedback
                showNotification('Ouverture de WhatsApp...', 'success');

                const encodedText = encodeURIComponent(text);
                const whatsappUrl = `https://wa.me/212670767903?text=${encodedText}`;

                // Open WhatsApp in new tab after brief delay for UX
                setTimeout(() => {
                    window.open(whatsappUrl, '_blank');
                }, 1000);
            });
        }

        // Global Event Delegation for Product Card Clicks
        document.body.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            if (card && !e.target.closest('button')) {
                const slug = card.dataset.slug;
                if (slug) location.href = `product.html?slug=${slug}`;
            }

            const btn = e.target.closest('.btn-luxe-mini');
            if (btn) {
                e.preventDefault();
                e.stopPropagation();
                quickAdd(btn);
            }
        });

        document.querySelectorAll('[data-cart-toggle]').forEach(el => {
            el.removeAttribute('onclick');
            el.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleCart();
            });
        });

        const overlay = document.querySelector('.cart-overlay');
        if (overlay) {
            overlay.removeAttribute('onclick');
            overlay.addEventListener('click', (e) => {
                e.preventDefault();
                toggleCart(false);
            });
        }

        document.querySelectorAll('.close-cart-btn').forEach(btn => {
            btn.removeAttribute('onclick');
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleCart(false);
            });
        });

        // Active Link Highlighting
        const currentPath = window.location.pathname;
        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.getAttribute('href') && currentPath.includes(link.getAttribute('href'))) {
                link.classList.add('active');
                link.style.color = 'var(--gold)'; // Force gold color
            }
        });

        console.log('Ecommerce v3.0 initialized. Cart:', getCart().length, 'items');
    };

    return {
        init,
        addToCart,
        removeFromCart,
        getCartTotal,
        toggleCart,
        renderCart,
        cart: getCart,
        user: getUser,
        token: getToken,
        showNotification,
        quickAdd,
        toggleTheme
    };
})();

window.Ecommerce = Ecommerce;

document.addEventListener('DOMContentLoaded', () => {
    Ecommerce.init();
});
