/**
 * admin-dashboard.js
 * Handles Admin Dashboard Logic
 * Extracted from admin-dashboard.html
 */

const token = localStorage.getItem('annakhil_token');
let currentProductId = null; // If null -> Create, if set -> Update
let salesChartInstance = null; // Track chart instance

// Auth Check
if (!token) location.href = 'login.html';

// TAB LOGIC
function switchTab(tabId) {
    // 1. Update Sidebar Active State
    document.querySelectorAll('.nav-item').forEach(e => {
        e.classList.remove('active');
        if (e.dataset.tab === tabId) e.classList.add('active');
    });

    // 2. Show Target Section
    const sections = ['overview', 'products', 'orders', 'customers'];
    sections.forEach(id => {
        const el = document.getElementById('tab-' + id);
        if (el) el.style.display = (id === tabId) ? 'grid' : 'none';

        // Handle specific display overrides
        if (id === tabId) {
            if (id === 'products') document.getElementById('tab-products').style.display = 'block';
            if (id === 'orders') document.getElementById('tab-orders').style.display = 'block';
            if (id === 'customers') document.getElementById('tab-customers').style.display = 'block';
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initDashboard();

    // Attach Event Listeners
    const addProductForm = document.getElementById('add-product-form');
    if (addProductForm) {
        addProductForm.addEventListener('submit', handleProductSubmit);
    }

    // INTERCEPT SIDEBAR LINKS (SPA BEHAVIOR)
    document.querySelectorAll('.sidebar .nav-item').forEach(link => {
        link.addEventListener('click', (e) => {
            const targetTab = link.dataset.tab;
            if (targetTab) {
                e.preventDefault(); // Stop navigation to .html file
                switchTab(targetTab);

                // Optional: Update URL without reload (cleaner URL)
                history.pushState({ tab: targetTab }, '', link.getAttribute('href'));
            }
            // If no data-tab (e.g. Shop, Logout), let default action happen
        });
    });

    // Handle Browser Back Button
    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.tab) switchTab(e.state.tab);
    });

    // Handle Initial URL Load (Deep Linking)
    const path = window.location.pathname;
    if (path.includes('orders.html')) switchTab('orders');
    else if (path.includes('products.html')) switchTab('products');
    else if (path.includes('clients.html')) switchTab('customers');
    else switchTab('overview');
});


// 🎯 QUICK ACTIONS DRAWER TOGGLE
function toggleDrawer() {
    const drawer = document.getElementById('quick-actions-drawer');
    if (drawer) drawer.classList.toggle('active');
}

// 🎯 NOTIFICATIONS TOGGLE
function toggleNotifications() {
    const panel = document.getElementById('notifications-panel');
    if (panel) panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
}

// 🎯 LOAD NOTIFICATIONS FROM backend
async function loadNotifications() {
    try {
        const res = await fetch('http://localhost:3030/api/admin/notifications', { headers: { 'Authorization': 'Bearer ' + token } });
        const json = await res.json();
        if (json.success) {
            const list = document.getElementById('notifications-list');
            const badge = document.getElementById('notif-badge');
            const count = document.getElementById('notif-count');
            if (!list) return;
            if (json.data.length === 0) {
                list.innerHTML = '<div style="padding:20px; text-align:center; color:#666;">Aucune alerte</div>';
                badge.style.display = 'none';
                count.textContent = '0';
                return;
            }
            // Update badge & count
            badge.style.display = 'inline-block';
            badge.textContent = json.data.length;
            count.textContent = json.data.length;
            // Render items
            list.innerHTML = json.data.map(notif => `
                <div class="notif-item ${notif.type}" onclick="handleNotification('${notif.id}')">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span>${notif.icon}</span>
                        <div>
                            <div style="font-size:13px; font-weight:600; color:white;">${notif.title}</div>
                            <div style="font-size:11px; color:#888;">${notif.message}</div>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch (e) {
        console.error('Load notifications error:', e);
    }
}

// 🎯 HANDLE NOTIFICATION CLICK
function handleNotification(id) {
    const panel = document.getElementById('notifications-panel');
    if (panel) panel.style.display = 'none';
    loadNotifications();
    if (id.startsWith('stock')) {
        switchTab('products');
    } else if (id.startsWith('orders')) {
        switchTab('orders');
    }
}

// 🎯 PROMOTIONS MODAL
function openPromotionsModal() {
    showToast('🚀 Fonctionnalité Promo à implémenter (Coming Soon)', 'info');
}

// 🎯 MAIN INITIALIZATION FUNCTION
async function initDashboard() {
    try {
        const res = await fetch('http://localhost:3030/api/admin/stats', { headers: { 'Authorization': 'Bearer ' + token } });
        const json = await res.json();

        if (json.success) {
            const data = json.data;
            animateValue('kpi-revenue', 0, data.revenue, 1000, ' MAD');
            animateValue('kpi-orders', 0, data.orders.total, 1000);
            animateValue('kpi-users', 0, data.users.total, 1000);
            animateValue('kpi-low-stock', 0, data.products.lowStock, 1000);
            renderSalesChart();
            renderActivityFeed(data.orders.pending);

            if (data.products.lowStock > 0) {
                const el = document.getElementById('stock-intelligence-list');
                if (el) el.innerHTML = `
                <div style="padding:15px; border-bottom:1px solid #222;">
                    <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:5px;">
                        <span style="color:#EDEDED;">Stocks Critiques</span>
                        <span style="color:#FF0080;">${data.products.lowStock} produits</span>
                    </div>
                    <div class="progress-bar"><div class="progress-fill fill-critical" style="width: 20%;"></div></div>
                </div>`;

                showToast(`⚠️ ${data.products.lowStock} produit(s) en stock critique`, 'error');
            }
        }
    } catch (e) {
        console.error(e);
        showToast('Erreur lors du chargement des statistiques', 'error');
    }

    loadInsights();
    loadProducts();
    loadOrders();
    loadCustomers();
    loadNotifications();
}

function animateValue(id, start, end, duration, suffix = '') {
    const obj = document.getElementById(id);
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start) + suffix;
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

// 🎯 SEARCH & FILTER logic
window.filterItems = (inputId, listId, itemClass) => {
    const input = document.getElementById(inputId);
    const filter = input.value.toUpperCase();
    const container = document.getElementById(listId);
    // Handle both table rows and list items
    const items = container.getElementsByClassName(itemClass.replace('.', ''));

    for (let i = 0; i < items.length; i++) {
        const txtValue = items[i].textContent || items[i].innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
            items[i].style.display = "";
        } else {
            items[i].style.display = "none";
        }
    }
};

window.filterOrders = (status) => {
    const rows = document.querySelectorAll('#orders-table-body tr');
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    // Add active class to clicked button logic here if we passed element

    rows.forEach(row => {
        if (status === 'all') {
            row.style.display = '';
        } else {
            const statusText = row.querySelector('td:last-child').innerText;
            row.style.display = statusText.includes(status) ? '' : 'none';
        }
    });
};

// 🎯 CLIENTS LOGIC
async function loadCustomers() {
    const tbody = document.getElementById('customers-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#666;">Chargement...</td></tr>';

    try {
        const res = await fetch('http://localhost:3030/api/admin/users', { headers: { 'Authorization': 'Bearer ' + token } });
        const json = await res.json();
        if (json.success) {
            if (json.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#666;">Aucun client trouvé.</td></tr>';
                return;
            }
            tbody.innerHTML = json.data.map(u => `
                <tr class="customer-row" style="border-bottom:1px solid #222;">
                    <td style="padding:15px; display:flex; align-items:center; gap:10px;">
                        <div style="width:32px; height:32px; background:#111; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#888;">${u.name.charAt(0).toUpperCase()}</div>
                        <div style="font-weight:600; color:white;">${u.name}</div>
                    </td>
                    <td style="color:#888;">${u.email}</td>
                    <td style="color:#888;">${new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                        <button onclick="toggleUserRole('${u._id}', '${u.role}')" 
                            style="background:rgba(${u.role === 'admin' ? '212, 175, 55' : '102, 102, 102'}, 0.1); 
                                   color:${u.role === 'admin' ? '#D4AF37' : '#888'}; 
                                   border:1px solid ${u.role === 'admin' ? '#D4AF37' : '#333'};
                                   padding:2px 8px; border-radius:4px; font-size:11px; cursor:pointer;">
                            ${u.role.toUpperCase()}
                        </button>
                    </td>
                    <td><span style="background:rgba(0, 112, 243, 0.1); color:#0070F3; padding:2px 8px; border-radius:4px; font-size:11px;">Actif</span></td>
                </tr>
            `).join('');

            // Update Stats
            const kpi = document.getElementById('kpi-users');
            if (kpi) kpi.innerText = json.count;
        }
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:red;">Erreur de chargement</td></tr>';
    }
}

// 🎯 Charger insights
async function loadInsights() {
    try {
        const res = await fetch('http://localhost:3030/api/admin/insights', { headers: { 'Authorization': 'Bearer ' + token } });
        const json = await res.json();

        if (json.success) {
            const { averageCart, topProducts, salesByDay, labels } = json.data;

            // 1. Panier Moyen
            animateValue('kpi-avg-cart', 0, averageCart, 1000, ' MAD');
            const trendEl = document.getElementById('cart-trend');
            if (trendEl) trendEl.innerText = averageCart > 800 ? '↗ Bon' : '→ OK';

            // 2. Top 3 Produits
            const topList = document.getElementById('top-products-list');
            if (!topList) return;
            if (topProducts.length === 0) {
                topList.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">Aucune vente encore</div>';
            } else {
                topList.innerHTML = topProducts.map((p, i) => `
                    <div style="display:flex; align-items:center; gap:12px; padding:10px; background:rgba(255,255,255,0.02); border-radius:8px; border:1px solid #222;">
                        <div style="font-size:20px; color:${i === 0 ? '#D4AF37' : '#888'};">${i + 1}</div>
                        <img src="${p.image}" style="width:40px; height:40px; object-fit:cover; border-radius:4px; background:#222;">
                        <div style="flex:1;">
                            <div style="font-size:13px; font-weight:600; color:white;">${p.title}</div>
                            <div style="font-size:11px; color:#888;">${p.quantity || 0} vendus • ${p.revenue || 0} MAD</div>
                        </div>
                        <button onclick="switchTab('products')" 
                            style="border:1px solid #333; background:#111; color:#0070F3; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:11px;">
                            Voir
                        </button>
                    </div>
                `).join('');
            }

            // 3. Graphique avec vraies données
            renderSalesChart(salesByDay, labels);
        } else {
            const topList = document.getElementById('top-products-list');
            if (topList) topList.innerHTML = '<div style="text-align:center; padding:20px; color:#FF0080;">Erreur de chargement</div>';
            renderSalesChart();
        }
    } catch (e) {
        console.error('Insights error:', e);
        const topList = document.getElementById('top-products-list');
        if (topList) topList.innerHTML = '<div style="text-align:center; padding:20px; color:#FF0080;">Erreur réseau</div>';
        renderSalesChart();
    }
}

function renderSalesChart(salesData, labelsData) {
    const canvas = document.getElementById('salesChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (salesChartInstance) salesChartInstance.destroy();

    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(212, 175, 55, 0.2)');
    gradient.addColorStop(1, 'rgba(212, 175, 55, 0)');

    const data = salesData || [1500, 2300, 3200, 2900, 4500, 5100, 4200];
    const labels = labelsData || ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

    salesChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Revenus (MAD)',
                data: data,
                borderColor: '#D4AF37',
                backgroundColor: gradient,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#D4AF37'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#111',
                    titleColor: '#D4AF37',
                    bodyColor: '#fff',
                    borderColor: '#333',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: (context) => `${context.parsed.y} MAD`
                    }
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#666' } },
                y: { grid: { color: '#222' }, ticks: { color: '#666' } }
            }
        }
    });
}

async function renderActivityFeed() {
    try {
        const res = await fetch('http://localhost:3030/api/orders/admin', { headers: { 'Authorization': 'Bearer ' + token } });
        const json = await res.json();
        const activityList = document.getElementById('activity-list');

        if (!activityList) return;

        if (json.success && json.data && json.data.length > 0) {
            const recentOrders = json.data.slice(0, 5);
            activityList.innerHTML = recentOrders.map(order => {
                const timeAgo = getTimeAgo(new Date(order.createdAt));
                const customerName = order.guestInfo?.name || order.user?.name || 'Client Inconnu';
                const amount = order.totalAmount !== undefined ? order.totalAmount : 0;

                return `
                    <li style="padding:12px 0; border-bottom:1px solid #222; display:flex; align-items:center; gap:12px;">
                        <div style="width:8px; height:8px; border-radius:50%; background:#0070F3; flex-shrink:0;"></div>
                        <div style="flex:1;">
                            <div style="font-size:13px; color:white;">${customerName} a passé une commande</div>
                            <div style="font-size:11px; color:#888;">${amount} MAD • ${timeAgo}</div>
                        </div>
                    </li>
                `;
            }).join('');
        } else {
            activityList.innerHTML = '<li style="text-align:center; padding:20px; color:#666;">Aucune activité récente</li>';
        }
    } catch (e) {
        console.error('Activity feed error:', e);
        const activityList = document.getElementById('activity-list');
        if (activityList) activityList.innerHTML = '<li style="text-align:center; padding:20px; color:#666;">Erreur de chargement</li>';
    }
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    const intervals = { 'jour': 86400, 'heure': 3600, 'minute': 60 };
    for (const [name, seconds_in_interval] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / seconds_in_interval);
        if (interval >= 1) return `Il y a ${interval} ${name}${interval > 1 ? 's' : ''}`;
    }
    return 'À l\'instant';
}

// ===========================================
// PRODUCT CRUD LOGIC
// ===========================================
async function loadProducts() {
    const tbody = document.getElementById('products-table-body');
    try {
        const res = await fetch('http://localhost:3030/api/products?limit=100');
        const json = await res.json();
        if (json.success) {
            window.allProducts = json.data; // Store globally
            tbody.innerHTML = json.data.map((p, index) => `
            <tr class="product-row" style="border-bottom:1px solid #222;">
                <td class="col-product" style="padding:15px;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="${p.mainImage}" style="width:40px; height:40px; object-fit:cover; border-radius:4px; background:#222;">
                        <div>
                            <div style="font-weight:600; color:white;">${p.title}</div>
                            <div style="font-size:11px; color:#888;">${p.category}</div>
                        </div>
                    </div>
                </td>
                <td class="col-price" style="font-family:monospace; color:#D4AF37;">${p.price} MAD</td>
                <td class="col-stock"><span style="color:${p.stock < 5 ? '#FF0080' : '#0070F3'}; background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:4px;">${p.stock}</span></td>
                <td class="col-actions">
                    <div style="display:flex; gap:8px;">
                        <button onclick="openEditModalByIndex(${index})" 
                            style="border:1px solid #333; background:#111; color:#fff; padding:6px 10px; border-radius:4px; cursor:pointer;" title="Modifier">✎</button>
                        <button onclick="deleteProduct('${p._id}')" 
                            style="border:1px solid #333; background:#220000; color:#FF0080; padding:6px 10px; border-radius:4px; cursor:pointer;" title="Supprimer">✕</button>
                    </div>
                </td>
            </tr>
        `).join('');
        }
    } catch (e) { console.error(e); }
}

async function deleteProduct(id) {
    if (confirm('⚠️ Êtes-vous sûr de vouloir supprimer ce produit définitivement ?')) {
        try {
            const res = await fetch('http://localhost:3030/api/admin/products/' + id, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const json = await res.json();
            if (res.ok) {
                showToast('Produit supprimé.', 'success');
                loadProducts();
                initDashboard();
            } else {
                showToast('Erreur: ' + json.message, 'error');
            }
        } catch (e) { showToast('Erreur réseau', 'error'); }
    }
}

function openEditModal(product) {
    currentProductId = product._id;
    document.querySelector('#add-product-modal h2').innerText = 'Modifier le Produit';
    document.querySelector('#add-product-form button[type="submit"]').innerText = 'Mettre à jour';

    // Fill Form
    document.getElementById('p-title').value = product.title;
    document.getElementById('p-price').value = product.price;
    document.getElementById('p-stock').value = product.stock;
    document.getElementById('p-category').value = product.category;
    document.getElementById('p-image').value = product.mainImage;
    document.getElementById('p-desc').value = product.description;
    document.getElementById('p-featured').checked = product.isFeatured || false;

    openModal('add-product-modal');
}

function openCreateModal() {
    currentProductId = null;
    document.querySelector('#add-product-modal h2').innerText = 'Ajouter un Produit';
    document.querySelector('#add-product-form button[type="submit"]').innerText = 'Enregistrer le Produit';
    document.getElementById('add-product-form').reset();
    openModal('add-product-modal');
}

function openEditModalByIndex(index) {
    const product = window.allProducts[index];
    if (product) openEditModal(product);
}

function toggleAddProductForm() {
    openCreateModal();
}

async function loadOrders() {
    const tbody = document.getElementById('orders-table-body');
    try {
        const res = await fetch('http://localhost:3030/api/orders/admin', { headers: { 'Authorization': 'Bearer ' + token } });
        const json = await res.json();
        if (json.success) {
            const sortedOrders = json.data.sort((a, b) => {
                const dateA = new Date(a.createdAt);
                const dateB = new Date(b.createdAt);
                const daysDiff = (dateB - dateA) / (1000 * 60 * 60 * 24);
                if (Math.abs(daysDiff) > 1) return dateA - dateB;
                return b.totalAmount - a.totalAmount;
            });

            tbody.innerHTML = sortedOrders.map(o => {
                const orderDate = o.createdAt ? new Date(o.createdAt) : new Date();
                const orderAge = Math.floor((Date.now() - orderDate) / (1000 * 60 * 60));
                const isUrgent = orderAge > 48 && o.status === 'En attente';
                const total = o.totalAmount !== undefined ? o.totalAmount : 0;
                const status = o.status || 'Inconnu';
                const userDisplayName = o.guestInfo?.name || o.user?.name || 'Inconnu';
                const orderId = o._id ? o._id.slice(-6).toUpperCase() : '??????';

                return `
                <tr style="border-bottom:1px solid #222; ${isUrgent ? 'background:rgba(255,0,128,0.05);' : ''}">
                    <td style="padding:15px; color:#D4AF37; font-family:monospace;">
                        #${orderId}
                        ${isUrgent ? '<span style="color:#FF0080; font-size:10px; margin-left:8px;">⚠️ URGENT</span>' : ''}
                    </td>
                    <td>${userDisplayName}</td>
                    <td>${orderDate.toLocaleDateString()}</td>
                    <td style="font-weight:${total > 1000 ? '700' : '400'};">${total} MAD</td>
                    <td><span style="background:#222; padding:2px 8px; border-radius:4px; font-size:11px;">${status}</span></td>
                </tr>
            `}).join('');
        }
    } catch (e) { }
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

async function handleProductSubmit(e) {
    e.preventDefault();

    let imagePath = document.getElementById('p-image').value;
    const fileInput = document.getElementById('p-image-file');

    // 1. Upload Image if file selected
    if (fileInput.files.length > 0) {
        const formData = new FormData();
        formData.append('image', fileInput.files[0]);

        try {
            showToast('Téléchargement de l\'image...', 'info');
            const uploadRes = await fetch('http://localhost:3030/api/upload', {
                method: 'POST',
                body: formData
            });
            const uploadJson = await uploadRes.json();

            if (uploadJson.success) {
                imagePath = uploadJson.filePath; // Use uploaded file path
            } else {
                return showToast('Erreur upload: ' + uploadJson.message, 'error');
            }
        } catch (uploadErr) {
            return showToast('Erreur upload image', 'error');
        }
    }

    const data = {
        title: document.getElementById('p-title').value,
        price: Number(document.getElementById('p-price').value),
        category: document.getElementById('p-category').value,
        mainImage: imagePath, // Use new path
        stock: Number(document.getElementById('p-stock').value),
        description: document.getElementById('p-desc').value,
        isFeatured: document.getElementById('p-featured').checked
    };

    const method = currentProductId ? 'PUT' : 'POST';
    const url = currentProductId ? ('http://localhost:3030/api/admin/products/' + currentProductId) : 'http://localhost:3030/api/admin/products';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            showToast(currentProductId ? 'Produit mis à jour !' : 'Produit ajouté !', 'success');
            closeModal('add-product-modal');
            loadProducts();
            initDashboard();
        } else {
            const json = await res.json();
            showToast('Erreur: ' + json.message, 'error');
        }
    } catch (e) {
        showToast('Erreur de connexion', 'error');
    }
}

// Preview Handler
document.getElementById('p-image-file').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const preview = document.getElementById('image-preview');
            preview.innerHTML = `<img src="${e.target.result}" style="max-width:100%; max-height:100%; object-fit:contain;">`;
        }
        reader.readAsDataURL(file);
    }
});

// Toast Notification (Reused)
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

async function toggleUserRole(userId, currentRole) {
    const newRole = currentRole === 'admin' ? 'customer' : 'admin';
    if (!confirm(`Changer le rôle de cet utilisateur en ${newRole.toUpperCase()} ?`)) return;

    try {
        const res = await fetch(`http://localhost:3030/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ role: newRole })
        });

        if (res.ok) {
            showToast('Rôle mis à jour avec succès.', 'success');
            loadCustomers();
        } else {
            const json = await res.json();
            showToast('Erreur: ' + (json.message || 'Action non autorisée'), 'error');
        }
    } catch (e) {
        showToast('Erreur réseau', 'error');
    }
}

// Make globally available for onclick handlers in HTML
window.switchTab = switchTab;
window.toggleDrawer = toggleDrawer;
window.toggleNotifications = toggleNotifications;
window.handleNotification = handleNotification;
window.openCreateModal = openCreateModal;
window.openEditModal = openEditModal;
window.openEditModalByIndex = openEditModalByIndex;
window.deleteProduct = deleteProduct;
window.toggleAddProductForm = toggleAddProductForm;
window.toggleUserRole = toggleUserRole;
window.openPromotionsModal = openPromotionsModal;
window.openModal = openModal;
window.closeModal = closeModal;
window.logout = function () {
    localStorage.removeItem('annakhil_token');
    location.href = 'login.html';
};
