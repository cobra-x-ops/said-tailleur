document.addEventListener('DOMContentLoaded', () => {

    // --- Preloader ---
    const preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 800);
        }, 1500);
    }

    // --- Dark/Light Mode Toggle ---
    const themeBtn = document.getElementById('theme-toggle');
    const htmlEl = document.documentElement;

    // Check local storage
    if (localStorage.getItem('theme') === 'light') {
        htmlEl.setAttribute('data-theme', 'light');
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const currentTheme = htmlEl.getAttribute('data-theme');
            if (currentTheme === 'light') {
                htmlEl.removeAttribute('data-theme');
                localStorage.setItem('theme', 'dark');
            } else {
                htmlEl.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
            }
        });
    }

    // --- Mobile Menu Toggle ---
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            mobileToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Close menu when clicking a link
        document.querySelectorAll('.nav-item').forEach(link => {
            link.addEventListener('click', () => {
                mobileToggle.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('nav')) {
                mobileToggle.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    }

    // --- Custom Cursor (Optimized) ---
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorCircle = document.querySelector('.cursor-circle');

    if (cursorDot && cursorCircle && window.matchMedia("(min-width: 900px)").matches) {
        let mouseX = -100, mouseY = -100;
        let circleX = -100, circleY = -100;
        let isMoving = false;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            if (!isMoving) {
                cursorDot.style.opacity = "1";
                cursorCircle.style.opacity = "1";
                isMoving = true;
            }
            cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
        });

        const animateCursor = () => {
            circleX += (mouseX - circleX) * 0.2;
            circleY += (mouseY - circleY) * 0.2;
            cursorCircle.style.transform = `translate3d(${circleX}px, ${circleY}px, 0) translate(-50%, -50%)`;
            requestAnimationFrame(animateCursor);
        };
        animateCursor();

        document.addEventListener('mouseover', (e) => {
            if (e.target.closest('a, button, .product-card, .gallery-item, .insta-item, input, textarea, .filter-btn')) {
                document.body.classList.add('hovering');
            }
        });
        document.addEventListener('mouseout', (e) => {
            if (e.target.closest('a, button, .product-card, .gallery-item, .insta-item, input, textarea, .filter-btn')) {
                document.body.classList.remove('hovering');
            }
        });
    }

    // --- Scroll Animations (Observer) ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal-text, .product-card').forEach(el => observer.observe(el));

    // --- Header Scroll ---
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
    });

    // --- Dynamic Product Grid (Index) & Filtering ---
    const productGrid = document.querySelector('.products-wrapper');
    const filterBtns = document.querySelectorAll('.filter-btn');

    function renderProducts(category) {
        if (!productGrid || !window.products) return;

        // Clear grid
        productGrid.innerHTML = '';

        const filtered = category === 'all'
            ? window.products
            : window.products.filter(p => p.category === category);

        filtered.forEach((product, index) => {
            const card = document.createElement('div');
            card.classList.add('product-card', 'reveal-text');
            // Stagger animation
            card.style.transitionDelay = `${index * 50}ms`;

            const imagePath = encodeURI(product.image);

            card.innerHTML = `
                <div class="img-container">
                    <img src="${imagePath}" alt="${product.title}">
                </div>
                <div class="card-info">
                    <h3 class="card-title">${product.title}</h3>
                    <span class="card-price">${product.price}</span>
                    <a href="product.html?id=${product.id}" class="btn">Voir Détails</a>
                </div>
            `;
            productGrid.appendChild(card);

            // Trigger animation frame
            setTimeout(() => card.classList.add('visible'), 50);
        });
    }

    if (productGrid) {
        // Initial Render
        renderProducts('all');

        // Filter Click Events
        if (filterBtns) {
            filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    // Remove active class from all
                    filterBtns.forEach(b => b.classList.remove('active'));
                    // Add to clicked
                    btn.classList.add('active');
                    // Filter
                    renderProducts(btn.dataset.filter);
                });
            });
        }
    }

    // --- Product Detail Page ---
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (productId && window.products) {
        const product = window.products.find(p => p.id === productId);

        if (product) {
            document.title = `${product.title} | Tailleur Annakhil`;

            // Populate Details (assuming structure exists in product.html)
            const imgEl = document.querySelector('.detail-img');
            const titleEl = document.querySelector('.detail-title');
            const priceEl = document.querySelector('.detail-price');
            const descEl = document.querySelector('.detail-desc');
            const waLink = document.querySelector('.wa-link');

            if (imgEl) imgEl.src = encodeURI(product.image);
            if (titleEl) titleEl.innerText = product.title;
            if (priceEl) priceEl.innerText = product.price;
            if (descEl) descEl.innerText = product.description;
            if (waLink) waLink.href = `https://wa.me/212670767903?text=Bonjour, je suis intéressé par : ${encodeURIComponent(product.title)}`;
        }
    }

    // --- Contact Form Submission ---
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // UI Feedback
            formStatus.style.display = 'block';
            formStatus.style.background = 'rgba(197, 160, 89, 0.1)';
            formStatus.style.color = 'var(--gold)';
            formStatus.textContent = 'Envoi en cours...';

            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                message: document.getElementById('message').value
            };

            try {
                // Check if running on file:// protocol
                if (window.location.protocol === 'file:') {
                    throw new Error('Le formulaire nécessite le serveur Node.js. Lancez "npm start" et accédez à http://localhost:3000');
                }

                const response = await fetch('http://localhost:3030/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (response.ok) {
                    formStatus.style.background = 'rgba(40, 167, 69, 0.1)';
                    formStatus.style.color = '#28a745';
                    formStatus.textContent = result.message;
                    contactForm.reset();
                } else {
                    throw new Error(result.errors ? result.errors[0].msg : 'Erreur lors de l\'envoi.');
                }
            } catch (error) {
                formStatus.style.background = 'rgba(220, 53, 69, 0.1)';
                formStatus.style.color = '#dc3545';
                formStatus.textContent = error.message.includes('Failed to fetch')
                    ? 'Impossible de contacter le serveur. Assurez-vous que "npm start" est lancé.'
                    : error.message;
            }
        });
    }
});
