/**
 * 3D Effects Engine - Tailleur Annakhil
 * Heavyweight visual impact, lightweight performance.
 */

class Luxe3DEngine {
    constructor() {
        this.cards = document.querySelectorAll('.luxe-card-3d');
        this.heroLayers = document.querySelectorAll('.hero-layer');
        this.isMobile = window.matchMedia('(max-width: 768px)').matches;

        if (!this.isMobile) {
            this.init();
        }
    }

    init() {
        // Init Card Tilt
        this.cards.forEach(card => {
            card.addEventListener('mousemove', (e) => this.handleCardTilt(e, card));
            card.addEventListener('mouseleave', () => this.resetCard(card));
        });

        // Init Hero Parallax
        if (this.heroLayers.length > 0) {
            document.addEventListener('mousemove', (e) => this.handleHeroParallax(e));
        }
    }

    handleCardTilt(e, card) {
        requestAnimationFrame(() => {
            const cardRect = card.getBoundingClientRect();
            const cardCenterX = cardRect.left + cardRect.width / 2;
            const cardCenterY = cardRect.top + cardRect.height / 2;

            const mouseX = e.clientX - cardCenterX;
            const mouseY = e.clientY - cardCenterY;

            // Max rotation degrees
            const rotateXMax = 10;
            const rotateYMax = 10;

            const rotateY = (mouseX / (cardRect.width / 2)) * rotateYMax;
            const rotateX = -1 * (mouseY / (cardRect.height / 2)) * rotateXMax;

            // Apply transform
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

            // Adjust Shine gradient based on mouse angle
            const shine = card.querySelector('.luxe-card-shine');
            if (shine) {
                const angle = Math.atan2(mouseY, mouseX) * (180 / Math.PI) - 90;
                shine.style.background = `linear-gradient(${angle}deg, rgba(255,255,255,0) 0%, rgba(197, 160, 89, 0.1) 50%, rgba(255,255,255,0) 100%)`;
            }
        });
    }

    resetCard(card) {
        card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
        const shine = card.querySelector('.luxe-card-shine');
        if (shine) shine.style.opacity = '0';
    }

    handleHeroParallax(e) {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;

        this.heroLayers.forEach(layer => {
            const speed = layer.getAttribute('data-speed') || 0.05;
            const x = (window.innerWidth * widthFactor(mouseX) * speed);
            const y = (window.innerHeight * heightFactor(mouseY) * speed);

            layer.style.transform = `translateX(${x}px) translateY(${y}px)`;
        });
    }
}

// Helpers
function widthFactor(x) { return 0.5 - x; }
function heightFactor(y) { return 0.5 - y; }

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Luxe3DEngine();
});
