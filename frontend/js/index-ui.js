/**
 * index-ui.js
 * Handles Homepage UI Logic (Featured Products, etc.)
 */

// Backend URL constant
const BACKEND_URL = 'http://localhost:3030';

document.addEventListener('DOMContentLoaded', () => {
    loadFeatured();
});

// Load Featured Products from MongoDB
async function loadFeatured() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/products?limit=4&isFeatured=true&_t=${Date.now()}`);
        const data = await response.json();
        console.log('Featured products data:', data);

        const grid = document.getElementById('featured-products');
        if (!grid) return;

        if (data.success && data.data.length > 0) {
            grid.innerHTML = data.data.map(product => {
                // Fix image path - prepend backend URL if it's a relative path
                const imageUrl = product.mainImage.startsWith('http')
                    ? product.mainImage
                    : `${BACKEND_URL}${product.mainImage.startsWith('/') ? '' : '/'}${product.mainImage}`;

                return `
                <div class="product-card luxe-card-3d" data-reveal data-slug="${product.slug}">
                    <div class="luxe-card-inner">
                        <div class="luxe-card-shine"></div>
                        <div class="product-card-image luxe-card-img">
                            <img src="${imageUrl}" alt="${product.title}">
                        </div>
                        <div class="product-card-info luxe-card-content">
                            <h3>${product.title}</h3>
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <p class="product-card-price">${product.price} ${product.currency}</p>
                                <button class="btn-luxe-mini" 
                                    type="button"
                                    data-id="${product._id || product.id}"
                                    data-title="${product.title}"
                                    data-price="${product.price.toString().replace(/[^0-9.]/g, '')}"
                                    data-image="${imageUrl}"
                                    data-currency="${product.currency}">
                                    +
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `}).join('');

            // Re-initialize animations for new elements if available
            if (window.Ecommerce && window.Ecommerce.init) {
                // Ideally Ecommerce.init handles new elements, or we manually trigger reveal
                document.querySelectorAll('[data-reveal]:not(.visible)').forEach(el => el.classList.add('visible'));
            }
        } else {
            grid.innerHTML = '<div style="text-align:center; padding:50px; grid-column:1/-1; opacity:0.5;">Aucun produit en vedette pour le moment.</div>';
        }

    } catch (err) {
        console.error('Erreur chargement produits:', err);
        const grid = document.getElementById('featured-products');
        if (grid) grid.innerHTML = '<div style="text-align:center; padding:50px; grid-column:1/-1; opacity:0.5;">Impossible de charger les produits.</div>';
    }
}
