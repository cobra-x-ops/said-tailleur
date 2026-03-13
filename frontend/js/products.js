const products = [
    {
        id: 'blue-leather-jacket',
        title: 'Veste en Cuir Bleu',
        price: '2800 MAD',
        description: 'Une pièce maîtresse de votre garde-robe. Cette veste en cuir bleu allie l\u2019audace moderne au savoir-faire traditionnel. Coupe ajustée pour une silhouette élancée.',
        image: 'product info/blue cuire jacket.png',
        category: 'Vestes'
    },
    {
        id: 'black-shoes',
        title: 'Chaussures Sapatos Noires',
        price: '1500 MAD',
        description: 'L\u2019élégance jusqu\u2019au bout des pieds. Ces chaussures en cuir noir sont fabriquées à la main pour garantir confort et durabilité lors de vos événements formels.',
        image: 'product info/chosure noire sapatos.png',
        category: 'Chaussures'
    },
    {
        id: 'beige-suit',
        title: 'Costume Beige Premium',
        price: '3800 MAD',
        description: 'La sophistication estivale. Ce costume beige, léger et respirant, est idéal pour les mariages ou les événements en journée. Finitions impeccables.',
        image: 'product info/costume bieg.png',
        category: 'Costumes'
    },
    {
        id: 'classic-blue-suit',
        title: 'Costume Bleu Classique',
        price: '3500 MAD',
        description: 'Un incontournable. Laine italienne de première qualité, coupe moderne. Le choix parfait pour le business ou les soirées élégantes.',
        image: 'product info/costume blue.png',
        category: 'Costumes'
    },
    {
        id: 'dark-blue-suit',
        title: 'Costume Bleu Nuit',
        price: '4000 MAD',
        description: 'Autorité et prestige. Ce costume bleu foncé profond est taillé pour les décideurs. Disponible en coupe croisée sur demande.',
        image: 'product info/costume bleu foncé.png',
        category: 'Costumes'
    },
    {
        id: 'brown-jacket',
        title: 'Veste Marron Casual',
        price: '2200 MAD',
        description: 'L’élégance décontractée. S’associe parfaitement avec un pantalon chino ou un jean. Détails cousus main.',
        image: 'product info/jacket brown.png',
        category: 'Vestes'
    },
    {
        id: 'dark-jeans',
        title: 'Jean Denim Brut',
        price: '900 MAD',
        description: 'Jean en denim brut premium, coupe sur mesure. Idéal pour un look casual chic et durable.',
        image: 'product info/jeans_dark.jpg',
        category: 'Pantalons'
    }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { products };
} else if (typeof window !== 'undefined') {
    window.products = products;
}
