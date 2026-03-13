/**
 * MAGNETIC BUTTONS EFFECT
 * Adds a subtle magnetic pull to buttons for a premium feel.
 * Target class: .btn-luxe, .nav-link, .product-card
 */

const MagneticButtons = (() => {
    const init = () => {
        const magnets = document.querySelectorAll('.btn-luxe, .nav-link, .btn-luxe-mini');

        magnets.forEach(magnet => {
            magnet.addEventListener('mousemove', (e) => {
                const rect = magnet.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                // Strength of the pull
                const strength = 15;

                magnet.style.transform = `translate(${x / strength}px, ${y / strength}px)`;
                magnet.style.transition = 'transform 0.1s ease';
            });

            magnet.addEventListener('mouseleave', () => {
                magnet.style.transform = 'translate(0, 0)';
                magnet.style.transition = 'transform 0.5s cubic-bezier(0.19, 1, 0.22, 1)';
            });
        });

        console.log('🧲 Magnetic Effects Initialized');
    };

    return { init };
})();

document.addEventListener('DOMContentLoaded', MagneticButtons.init);
