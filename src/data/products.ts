import type { Category } from '@/lib/types';

export const categories: Category[] = [
  {
    id: 'food-items',
    name: 'Food Items',
    catalogs: [
      {
        id: 'veg-pickles',
        name: 'Veg Pickles',
        products: [
          { id: 'p1', name: 'Mango Pickle', price: 150, imageId: 'product-1', description: 'Spicy and tangy mango pickle', rating: 4.8, deliveryTime: '2-3 days', variants: [{ name: 'Weight', options: ['250gm', '500gm', '1kg'] }, { name: 'Bottle', options: ['Bottle', 'Without Bottle'] }], deliveryCost: 50, pricing: [], createdAt: '2023-01-01T00:00:00Z', famous: true },
          { id: 'p2', name: 'Lime Pickle', price: 120, imageId: 'product-2', description: 'Sour and spicy lime pickle', rating: 4.7, deliveryTime: '2-3 days', variants: [{ name: 'Weight', options: ['250gm', '500gm'] }], deliveryCost: 50, pricing: [], createdAt: '2023-01-01T00:00:00Z', famous: true },
          { id: 'p15', name: 'Garlic Pickle', price: 160, imageId: 'product-15', description: 'Flavorful garlic pickle', rating: 4.9, deliveryTime: '3-4 days', variants: [{ name: 'Weight', options: ['250gm', '500gm'] }], deliveryCost: 50, pricing: [], createdAt: '2023-01-01T00:00:00Z' },
          { id: 'p16', name: 'Mixed Veg Pickle', price: 140, imageId: 'product-16', description: 'A mix of seasonal vegetables', rating: 4.6, deliveryTime: '2-3 days', variants: [{ name: 'Weight', options: ['500gm', '1kg'] }], deliveryCost: 50, pricing: [], createdAt: '2023-01-01T00:00:00Z' },
          { id: 'p17', name: 'Chilli Pickle', price: 130, imageId: 'product-17', description: 'Hot and spicy chilli pickle', rating: 4.7, deliveryTime: '1-2 days', variants: [{ name: 'Weight', options: ['250gm'] }], deliveryCost: 50, pricing: [], createdAt: '2023-01-01T00:00:00Z' },
        ],
      },
      {
        id: 'non-veg-pickles',
        name: 'Non-Veg Pickles',
        products: [

          {
            id: '1',
            name: 'Chicken Pickle',
            price: 300,
            imageId: 'product-13',
            description: 'Traditional homemade sweet',
            rating: 4.5,
            deliveryTime: '3-5 days',
            deliveryCost: 40.0,
            createdAt: '2026-01-06T10:25:40.988292',
            variants: [],
            famous: false,
            ingredients: "Gram flour, ghee, sugar",
            bestBefore: "15 days",
            instructions: "Store in a cool, dry place",
            pricing: [
              {
                id: '1',
                price: 300.00,
                quantity: '250 g',
                sizeColours: [
                  { id: '1', name: 'Bottle ', price: 10.00 }
                ]
              },
              {
                id: '2',
                price: 550.00,
                quantity: '500 g',
                sizeColours: [
                  { id: '2', name: 'Bottle ', price: 20.00 }
                ]
              },
              {
                id: '3',
                price: 800.00,
                quantity: '1 Kg',
                sizeColours: [
                  { id: '4', name: 'Gift packing', price: 50.00 },
                  { id: '3', name: 'Glass packing', price: 30.00 }
                ]
              }
            ]
          },
          { id: 'p13', name: 'Chicken Pickle', price: 250, imageId: 'product-13', description: 'Spicy chicken pickle', rating: 4.9, deliveryTime: '3-5 days', variants: [{ name: 'Weight', options: ['250gm', '500gm', '1kg'] }, { name: 'Bottle', options: ['Bottle', 'Without Bottle'] }], deliveryCost: 50, pricing: [], createdAt: '2023-01-01T00:00:00Z' },
          { id: 'p14', name: 'Prawn Pickle', price: 300, imageId: 'product-14', description: 'Tangy and spicy prawn pickle', rating: 4.8, deliveryTime: '4-5 days', variants: [{ name: 'Weight', options: ['250gm', '500gm'] }], deliveryCost: 50, pricing: [], createdAt: '2023-01-01T00:00:00Z' },
          { id: 'p18', name: 'Mutton Pickle', price: 350, imageId: 'product-18', description: 'Rich and spicy mutton pickle', rating: 4.9, deliveryTime: '3-5 days', variants: [{ name: 'Weight', options: ['500gm', '1kg'] }], deliveryCost: 50, pricing: [], createdAt: '2023-01-01T00:00:00Z' },
          { id: 'p19', name: 'Fish Pickle', price: 280, imageId: 'product-19', description: 'Tangy fish pickle with spices', rating: 4.7, deliveryTime: '4-5 days', variants: [{ name: 'Weight', options: ['250gm', '500gm'] }], deliveryCost: 50, pricing: [], createdAt: '2023-01-01T00:00:00Z' },
        ],
      },
      {
        id: 'chutneys',
        name: 'Chutneys',
        products: [
          { id: 'p3', name: 'Sweet Mango Chutney', price: 180, imageId: 'product-3', description: 'Sweet and sour mango chutney', rating: 4.9, deliveryTime: '2-3 days', deliveryCost: 50, pricing: [], createdAt: '2023-01-01T00:00:00Z', famous: true },
          { id: 'p20', name: 'Coriander Chutney', price: 100, imageId: 'product-20', description: 'Fresh coriander and mint chutney', rating: 4.8, deliveryTime: '1-2 days', deliveryCost: 50, pricing: [], createdAt: '2023-01-01T00:00:00Z' },
          { id: 'p21', name: 'Tamarind Chutney', price: 110, imageId: 'product-21', description: 'Sweet and tangy tamarind chutney', rating: 4.7, deliveryTime: '2-3 days', deliveryCost: 50, pricing: [], createdAt: '2023-01-01T00:00:00Z' },
        ],
      },
      {
        id: 'spices',
        name: 'Spices',
        products: [
          { id: 'p22', name: 'Garam Masala', price: 200, imageId: 'product-22', description: 'Aromatic blend of ground spices', rating: 4.9, deliveryTime: '3-4 days', deliveryCost: 50, pricing: [], createdAt: '2023-01-01T00:00:00Z', famous: true },
          { id: 'p23', name: 'Turmeric Powder', price: 80, imageId: 'product-23', description: 'Pure and authentic turmeric powder', rating: 4.8, deliveryTime: '2-3 days', deliveryCost: 50, pricing: [], createdAt: '2023-01-01T00:00:00Z' },
          { id: 'p24', name: 'Red Chilli Powder', price: 90, imageId: 'product-24', description: 'Spicy red chilli powder', rating: 4.7, deliveryTime: '2-3 days', deliveryCost: 50, pricing: [], createdAt: '2023-01-01T00:00:00Z' },
        ],
      },
    ],
  },
  {
    id: 'cat2',
    name: 'Jewellery',
    catalogs: [
      {
        id: 'earrings',
        name: 'Earrings',
        products: [
          { id: 'p4', name: 'Jhumka Earrings', price: 500, imageId: 'product-4', description: 'Traditional gold-plated jhumkas', rating: 4.8, deliveryTime: '5-7 days', deliveryCost: 50, pricing: [], createdAt: '2023-01-01T00:00:00Z' },
          { id: 'p5', name: 'Stud Earrings', price: 350, imageId: 'product-5', description: 'Elegant silver studs', rating: 4.6, deliveryTime: '4-6 days', deliveryCost: 50, pricing: [], createdAt: '2023-01-01T00:00:00Z' },
        ],
      },
      {
        id: 'necklaces',
        name: 'Necklaces',
        products: [
          { id: 'p6', name: 'Kundan Necklace Set', price: 2500, imageId: 'product-6', description: 'Exquisite Kundan necklace for weddings', rating: 4.9, deliveryTime: '7-10 days', deliveryCost: 50, pricing: [], createdAt: '2023-01-01T00:00:00Z' },
        ],
      }
    ],
  },
  {
    id: 'cat3',
    name: 'Clothing',
    catalogs: [
      {
        id: 'women',
        name: 'Women',
        products: [
          { id: 'p7', name: 'Anarkali Suit', price: 3500, imageId: 'product-7', description: 'Designer Anarkali suit for parties', rating: 4.8, deliveryTime: '5-8 days', deliveryCost: 50, pricing: [], createdAt: '2023-01-01T00:00:00Z' },
          { id: 'p8', name: 'Cotton Saree', price: 1500, imageId: 'product-8', description: 'Handloom cotton saree', rating: 4.7, deliveryTime: '4-6 days', deliveryCost: 50, pricing: [], createdAt: '2023-01-01T00:00:00Z' },
        ]
      },
      {
        id: 'men',
        name: 'Men',
        products: [
          { id: 'p9', name: 'Kurta Pyjama', price: 2000, imageId: 'product-9', description: 'Silk Kurta Pyjama for festivals', rating: 4.6, deliveryTime: '5-7 days', deliveryCost: 50, pricing: [], createdAt: '2023-01-01T00:00:00Z' },
        ]
      }
    ]
  }
];
