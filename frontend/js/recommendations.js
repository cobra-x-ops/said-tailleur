/**
 * TAILLEUR ANNAKHIL - AI Recommendation Engine v1.0
 * Client-side "Lightweight AI" that learns from user behavior
 */

const Recommendations = (() => {

    // --- STATE ---
    const STORAGE_KEY_VIEWS = 'annakhil_views';
    const CACHE_KEY_PRODUCTS = 'annakhil_products_cache';

    // Track a product view
    const trackView = (product) => {
        let views = JSON.parse(localStorage.getItem(STORAGE_KEY_VIEWS)) || {};

        // Track count per category
        if (!views[product.category]) views[product.category] = 0;
        views[product.category]++;

        // Track specific product interest (could be expanded)
        localStorage.setItem(STORAGE_KEY_VIEWS, JSON.stringify(views));
    };

    // Calculate affinity score for a product
    const calculateScore = (product, userViews, wishlistIds) => {
        let score = 0;

        // 1. Category Affinity
        // If user looks at "suits" often, boost suit scores
        if (userViews[product.category]) {
            score += userViews[product.category] * 10;
        }

        // 2. Wishlist Affinity (if similar items are in wishlist)
        // For simplicity, we just check if it's IN wishlist (filtered out later) or similar category

        // 3. "Trending" Boost (Randomness to simulate discovery)
        score += Math.random() * 5;

        return score;
    };

    // Main Function to Get Suggestions
    const getSuggestions = async (limit = 4) => {
        // 1. Fetch all products (or use cache)
        let products = [];
        try {
            // Ideally fetch from API, for now using a direct fetch if available or fallback
            // Assuming we can fetch all for analysis
            const res = await fetch('http://localhost:3030/api/products');
            const data = await res.json();
            if (data.success) products = data.data;
        } catch (e) {
            console.error("AI Engine: Could not fetch products", e);
            return [];
        }

        // 2. Get User Context
        const userViews = JSON.parse(localStorage.getItem(STORAGE_KEY_VIEWS)) || {};
        const wishlist = JSON.parse(localStorage.getItem('annakhil_wishlist')) || [];
        const cart = JSON.parse(localStorage.getItem('annakhil_cart')) || [];

        const cartIds = cart.map(p => p._id || p.id);
        const wishlistIds = wishlist.map(p => p._id || p.id);

        // 3. Score & Filter
        const scoredProducts = products
            .filter(p => !cartIds.includes(p._id)) // Don't recommend what's already in cart
            .map(p => {
                return {
                    ...p,
                    score: calculateScore(p, userViews, wishlistIds)
                };
            });

        // 4. Sort by Score DESC
        scoredProducts.sort((a, b) => b.score - a.score);

        return scoredProducts.slice(0, limit);
    };

    // Render Recommendations to DOM
    const render = async (containerId, title = "Recommandé pour vous") => {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `<div style="text-align:center; padding:20px;">Analysis of your style profile in progress...</div>`;

        const suggestions = await getSuggestions(3);

        if (suggestions.length === 0) {
            container.innerHTML = ''; // Nothing to show
            return;
        }

        const html = `
            <div style="margin-bottom:20px; animation:fadeUp 1s ease;">
                <h3 style="font-family:var(--font-serif); font-size:24px; margin-bottom:10px; color:var(--text-main);">${title}</h3>
                <p style="font-size:13px; color:var(--text-muted);">Sélectionné par notre IA selon vos goûts.</p>
            </div>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:20px;">
                ${suggestions.map(p => `
                    <div class="product-card" data-slug="${p.slug}" style="box-shadow:none; border:1px solid var(--border); background:var(--bg-secondary); padding:0; border-radius:12px; overflow:hidden;">
                        <div class="product-card-image">
                            <img src="${p.mainImage}" alt="${p.title}">
                            ${p.marketingBadge ? `<span class="product-card-badge">${p.marketingBadge}</span>` : ''}
                        </div>
                        <div class="product-card-info" style="padding:15px;">
                            <h4 style="font-size:14px; margin-bottom:5px;">${p.title}</h4>
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span style="color:var(--gold); font-weight:600;">${p.price} MAD</span>
                                <button class="btn-luxe-mini" 
                                    data-id="${p._id || p.id}"
                                    data-title="${p.title}"
                                    data-price="${p.price.toString().replace(/[^0-9.]/g, '')}"
                                    data-image="${p.mainImage}"
                                    data-currency="${p.currency || 'MAD'}">
                                    +
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        container.innerHTML = html;
    };

    return {
        trackView,
        render,
        getSuggestions
    };

})();

// Expose
window.Recommendations = Recommendations;
