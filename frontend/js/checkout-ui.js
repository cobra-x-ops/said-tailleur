/**
 * checkout-ui.js
 * Handles Checkout Page UI Logic
 * Extracted from checkout.html
 */

// Global Error Catcher
window.onerror = function (msg, url, line) {
    console.error("Script Error:", msg, "at", url, ":", line);
    return false;
};

// Toast Notification Function
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return; // Should exist

    const toast = document.createElement('div');
    toast.className = `luxe-toast ${type}`; // e.g., 'luxe-toast success'
    toast.innerHTML = `<span>${message}</span>`;

    // Allow multiple toasts to stack or just append
    container.appendChild(toast);

    // Trigger reflow
    void toast.offsetWidth;

    // Show
    toast.classList.add('visible');

    // Hide after 3s
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

let appliedDiscount = 0;
let currentPromoCode = '';
let selectedPayment = 'cod'; // Default to COD

// --- NAVIGATION LOGIC ---
window.goToStep = function (step) {
    console.log("Navigation vers étape:", step);

    if (step === 2) {
        const form = document.getElementById('shipping-form');
        let isValid = true;
        let firstInvalid = null;

        Array.from(form.elements).forEach(field => {
            if (field.tagName === 'INPUT' && !field.disabled && field.required) {
                if (!field.checkValidity()) {
                    isValid = false;
                    if (!firstInvalid) firstInvalid = field;
                    field.style.borderColor = '#dc3545';
                    field.classList.add('shake');
                    field.addEventListener('input', () => { field.style.borderColor = 'var(--border)'; }, { once: true });
                    setTimeout(() => field.classList.remove('shake'), 500);
                }
            }
        });

        if (!isValid) {
            if (firstInvalid) firstInvalid.focus();
            showToast("Veuillez remplir les champs obligatoires (en rouge).", "error");
            return;
        }
    }

    const stepShipping = document.getElementById('step-shipping');
    const stepPayment = document.getElementById('step-payment');

    if (stepShipping) stepShipping.style.display = step === 1 ? 'block' : 'none';
    if (stepPayment) stepPayment.style.display = step === 2 ? 'block' : 'none';

    document.getElementById('step1-indicator').classList.toggle('active', step === 1);
    document.getElementById('step2-indicator').classList.toggle('active', step === 2);
    window.scrollTo({ top: 100, behavior: 'smooth' });
};

// --- RENDER LOGIC ---
function renderSummary() {
    if (!window.Ecommerce) return;
    const cart = window.Ecommerce.cart();
    const container = document.getElementById('checkout-items');
    if (!container) return;

    container.innerHTML = cart.map(item => `
        <div class="cart-item-small">
            <img src="${item.mainImage}" style="width:60px; height:80px; object-fit:cover; border-radius:2px;">
            <div style="flex:1;">
                <p style="font-size:14px; font-weight:600; margin-bottom:5px;">${item.title}</p>
                <p style="font-size:12px; color:var(--text-muted);">Qté: ${item.quantity}</p>
                <p style="font-size:13px; color:var(--gold); margin-top:5px;">${item.price} MAD</p>
            </div>
        </div>
    `).join('');
    updateTotals();
}

function updateTotals() {
    if (!window.Ecommerce) return;
    const subtotal = window.Ecommerce.getCartTotal();
    const totalElement = document.getElementById('grand-total');
    const promoRow = document.getElementById('promo-row');

    document.getElementById('sub-total').innerText = subtotal + ' MAD';

    if (appliedDiscount > 0) {
        const discountVal = subtotal * appliedDiscount;
        promoRow.style.display = 'flex';
        document.getElementById('promo-amount').innerText = '-' + discountVal.toFixed(0) + ' MAD';
        totalElement.innerText = (subtotal - discountVal).toFixed(0) + ' MAD';
    } else {
        promoRow.style.display = 'none';
        totalElement.innerText = subtotal + ' MAD';
    }
}

async function checkPromoCode() {
    const input = document.getElementById('promo-input');
    const code = input.value.trim().toUpperCase();
    const feedback = document.getElementById('promo-feedback');
    const btn = document.getElementById('apply-promo-btn');

    if (!code) return;

    btn.disabled = true;
    btn.innerText = 'Checking...';

    try {
        const userId = window.Ecommerce ? window.Ecommerce.user()?.id : null;

        const res = await fetch('http://localhost:3030/api/orders/validate-promo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, userId })
        });

        const data = await res.json();

        if (data.success) {
            appliedDiscount = data.discount / 100; // Assume percent
            currentPromoCode = code;
            feedback.innerHTML = `<span style="color:#27ae60; font-weight:600;">✓ ${data.message}</span>`;
            input.style.borderColor = '#27ae60';
            showToast("Code promo appliqué !", "success");
        } else {
            appliedDiscount = 0;
            currentPromoCode = '';
            feedback.innerHTML = `<span style="color:#e74c3c; font-weight:600;">✗ ${data.error}</span>`;
            input.style.borderColor = '#e74c3c';
            showToast(data.error || "Code promo invalide", "error");
        }
    } catch (err) {
        console.error(err);
        showToast("Erreur de validation", "error");
    } finally {
        btn.disabled = false;
        btn.innerText = 'APPLIQUER';
        updateTotals();
    }
}

function selectPayment(method) {
    selectedPayment = method;
    const cardSection = document.getElementById('card-details-form');
    if (cardSection) {
        cardSection.style.display = method === 'card' ? 'block' : 'none';
    }
}

async function placeOrder() {
    console.log('=== PLACE ORDER CLICKED ===');

    // 1. Get cart data (fresh from localStorage)
    const cart = window.Ecommerce ? window.Ecommerce.cart() : [];
    const cartTotal = window.Ecommerce ? window.Ecommerce.getCartTotal() : 0;

    console.log('Cart items:', cart.length, 'Total:', cartTotal);

    // 2. Validate cart is not empty
    if (!cart || cart.length === 0) {
        showToast("Votre panier est vide. Veuillez ajouter des articles.", "error");
        setTimeout(() => location.href = 'shop.html', 1500);
        return;
    }

    // 3. Validate payment method
    if (!selectedPayment) {
        showToast("Veuillez sélectionner une méthode de paiement.", "error");
        return;
    }

    // 4. Get user (optional - allow guest checkout)
    const user = window.Ecommerce ? window.Ecommerce.user() : null;

    // 5. Collect shipping info from form (using CORRECT input IDs)
    const shippingData = {
        firstName: document.getElementById('fname')?.value?.trim() || '',
        lastName: document.getElementById('lname')?.value?.trim() || '',
        address: document.getElementById('address')?.value?.trim() || '',
        city: document.getElementById('city')?.value?.trim() || '',
        zipCode: document.getElementById('zip')?.value?.trim() || '',
        phone: document.getElementById('phone')?.value?.trim() || ''
    };

    console.log('Shipping Data Collected:', shippingData);

    // 6. Validate required shipping fields
    if (!shippingData.firstName || !shippingData.lastName) {
        showToast("Veuillez entrer votre prénom et nom.", "error");
        goToStep(1);
        document.getElementById('fname')?.focus();
        return;
    }
    if (!shippingData.address) {
        showToast("Veuillez entrer votre adresse de livraison.", "error");
        goToStep(1);
        document.getElementById('address')?.focus();
        return;
    }
    if (!shippingData.city) {
        showToast("Veuillez entrer votre ville.", "error");
        goToStep(1);
        document.getElementById('city')?.focus();
        return;
    }
    if (!shippingData.phone) {
        showToast("Veuillez entrer votre numéro de téléphone.", "error");
        goToStep(1);
        document.getElementById('phone')?.focus();
        return;
    }

    // 7. Calculate final total with discount
    let finalTotal = cartTotal;
    if (appliedDiscount > 0) {
        finalTotal = cartTotal - (cartTotal * appliedDiscount);
    }

    // 8. Disable button to prevent double-click
    const confirmBtn = document.getElementById('confirm-order-btn');
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.innerText = 'Traitement en cours...';
    }

    // ========================================
    // BACKEND SERVER VALIDATION & SAVE
    // ========================================
    try {
        // Check if user is logged in for strict promo tracking
        const userId = user ? user.id : null;

        const orderPayload = {
            userId: userId,
            guestInfo: shippingData,
            items: cart,
            total: finalTotal,
            promoCode: currentPromoCode || null,
            shipping: shippingData
        };

        console.log('Sending order to backend:', orderPayload);

        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload)
        });

        const data = await res.json();

        if (!data.success) {
            throw new Error(data.error || "Erreur de validation de la commande.");
        }

        console.log('Order created successfully:', data.orderId);

    } catch (err) {
        console.error('Validation Error:', err);
        showToast(err.message, "error");
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.innerText = 'Confirmer la commande';
        }
        // STOP HERE - Do not open WhatsApp if backend rejects (e.g. promo expired)
        return;
    }

    // ========================================
    // WHATSAPP REDIRECTION (Success)
    // ========================================

    console.log('Processing WhatsApp redirection...');

    // Build order summary for WhatsApp message
    const itemsList = cart.map(item =>
        `• ${item.title} x${item.quantity} - ${item.price} MAD`
    ).join('\n');

    // Build customer info from validated form data
    const customerName = `${shippingData.firstName} ${shippingData.lastName}`;
    const customerAddress = shippingData.zipCode
        ? `${shippingData.address}, ${shippingData.city} ${shippingData.zipCode}`
        : `${shippingData.address}, ${shippingData.city}`;
    const customerPhone = shippingData.phone;

    // WhatsApp message with order details
    const whatsappMessage = encodeURIComponent(
        `Bonjour! 👋 Je souhaite confirmer ma commande (Ref: #${Date.now().toString().slice(-6)}):
        
📦 *ARTICLES:*
${itemsList}

💰 *TOTAL:* ${finalTotal.toFixed(0)} MAD${appliedDiscount > 0 ? `\n🎁 *Remise appliquée:* ${(appliedDiscount * 100).toFixed(0)}% (${currentPromoCode})` : ''}

👤 *Client:* ${customerName}
📍 *Adresse:* ${customerAddress}
📞 *Téléphone:* ${customerPhone}

💵 *Paiement:* À la livraison

Merci! ☺️`
    );

    // WhatsApp business number
    const whatsappNumber = '212670767903';

    // Clear cart before redirect
    localStorage.removeItem('annakhil_cart');

    // Redirect to WhatsApp
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;
    console.log('WhatsApp URL:', whatsappUrl);

    showToast("Commande confirmée ! Redirection vers WhatsApp...", "success");

    setTimeout(() => {
        window.open(whatsappUrl, '_blank');
        location.href = 'index.html';
    }, 1000);
}

// --- ATTACH EVENT LISTENERS (CSP SAFE) ---
document.addEventListener('DOMContentLoaded', () => {
    // Step Indicators
    const s1 = document.getElementById('step1-indicator');
    const s2 = document.getElementById('step2-indicator');
    if (s1) s1.addEventListener('click', () => goToStep(1));
    if (s2) s2.addEventListener('click', () => goToStep(2));

    // Next Button
    const nextBtn = document.getElementById('next-step-btn');
    if (nextBtn) nextBtn.addEventListener('click', () => goToStep(2));

    // Back Button
    const backBtn = document.getElementById('back-to-step-1');
    if (backBtn) {
        backBtn.addEventListener('click', () => goToStep(1));
    }

    // Confirm Order Button
    const confirmBtn = document.getElementById('confirm-order-btn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', placeOrder);
    }

    // Promo Code
    const promoBtn = document.getElementById('apply-promo-btn');
    if (promoBtn) {
        promoBtn.addEventListener('click', checkPromoCode);
    }

    // Payment Cards
    document.querySelectorAll('.payment-card').forEach(card => {
        const input = card.querySelector('input');
        if (!input) return;
        const method = input.value;
        card.removeAttribute('onclick');
        card.addEventListener('click', () => {
            document.querySelectorAll('.payment-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            input.checked = true;
            selectPayment(method);
        });
    });

    // Close Cart Button (in case drawer is open)
    const closeCartBtn = document.querySelector('.cart-drawer button');
    if (closeCartBtn) {
        closeCartBtn.removeAttribute('onclick');
        closeCartBtn.addEventListener('click', () => {
            if (window.Ecommerce) window.Ecommerce.toggleCart(false);
        });
    }

    // Page Initialization - Check cart and render
    if (window.Ecommerce) {
        const cart = window.Ecommerce.cart();
        console.log('Checkout Init - Cart:', cart.length, 'items, Total:', window.Ecommerce.getCartTotal(), 'MAD');

        if (cart.length === 0) {
            // Show warning and redirect
            const container = document.getElementById('checkout-items');
            if (container) {
                container.innerHTML = '<p style="text-align:center; padding:20px; color:#e74c3c;">Votre panier est vide.</p>';
            }
            const st = document.getElementById('sub-total');
            const gt = document.getElementById('grand-total');
            if (st) st.innerText = '0 MAD';
            if (gt) gt.innerText = '0 MAD';

            setTimeout(() => {
                // If user just refreshed on empty cart, redirect
                // Avoid alert loop by checking if we already alerted? No, simpler.
                // Just redirect gracefully
                location.href = 'shop.html';
            }, 1000);
        } else {
            renderSummary();
        }
    }
});
