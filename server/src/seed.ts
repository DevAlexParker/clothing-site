import dotenv from 'dotenv';
import { connectDB } from './db.js';
import { Product } from './models/Product.js';

dotenv.config();

// The same product data that was previously hardcoded in src/data.ts
const products = [
  {
    name: 'Minimalist Overcoat',
    price: 45000,
    category: 'Outerwear',
    isNew: true,
    images: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1550639524-a6f58345a278?auto=format&fit=crop&q=80&w=800'
    ],
    colors: [
      { name: 'Camel', hex: '#C19A6B' },
      { name: 'Black', hex: '#000000' }
    ],
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    name: 'Silk Crepe Dress',
    price: 28500,
    category: 'Dresses',
    images: [
      'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1495385794356-15371f348c31?auto=format&fit=crop&q=80&w=800'
    ],
    colors: [
      { name: 'Midnight', hex: '#191970' },
      { name: 'Ivory', hex: '#FFFFF0' }
    ],
    sizes: ['XS', 'S', 'M', 'L']
  },
  {
    name: 'Structured Blazer',
    price: 32000,
    category: 'Tailoring',
    isNew: true,
    images: [
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=800'
    ],
    colors: [
      { name: 'Charcoal', hex: '#36454F' }
    ],
    sizes: ['M', 'L', 'XL']
  },
  {
    name: 'Essential Cotton Tee',
    price: 4500,
    category: 'Basics',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1583336712395-8854cd3b7301?auto=format&fit=crop&q=80&w=800'
    ],
    colors: [
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Black', hex: '#000000' },
      { name: 'Olive', hex: '#808000' }
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  },
  {
    name: 'Tailored Wool Trousers',
    price: 18000,
    category: 'Bottoms',
    images: [
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&q=80&w=800'
    ],
    colors: [
      { name: 'Navy', hex: '#000080' },
      { name: 'Grey', hex: '#808080' }
    ],
    sizes: ['30', '32', '34', '36']
  },
  {
    name: 'Leather Crossbody',
    price: 21500,
    category: 'Accessories',
    images: [
      'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&q=80&w=800'
    ],
    colors: [
      { name: 'Tan', hex: '#D2B48C' },
      { name: 'Black', hex: '#000000' }
    ],
    sizes: ['One Size']
  },
  {
    name: 'Cashmere Blend Sweater',
    price: 35000,
    category: 'Outerwear',
    images: [
      'https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1620799139824-c15c8c5c7d0b?auto=format&fit=crop&q=80&w=800'
    ],
    colors: [
      { name: 'Grey', hex: '#808080' },
      { name: 'Cream', hex: '#FFFDD0' }
    ],
    sizes: ['S', 'M', 'L']
  },
  {
    name: 'Pleated Midi Skirt',
    price: 15000,
    category: 'Bottoms',
    images: [
      'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80'
    ],
    colors: [
      { name: 'Black', hex: '#000000' }
    ],
    sizes: ['XS', 'S', 'M', 'L']
  },
  {
    name: 'Linen Button-Down',
    price: 12000,
    category: 'Basics',
    isNew: true,
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80'
    ],
    colors: [
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Light Blue', hex: '#ADD8E6' }
    ],
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    name: 'Oversized Sunglasses',
    price: 8500,
    category: 'Accessories',
    images: [
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1511499767149-a48a237a8582?auto=format&fit=crop&q=80&w=800'
    ],
    colors: [
      { name: 'Tortoiseshell', hex: '#714E3D' },
      { name: 'Black', hex: '#000000' }
    ],
    sizes: ['One Size']
  },
  {
    name: 'Chunky Loafers',
    price: 26000,
    category: 'Accessories',
    isNew: true,
    images: [
      'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&q=80&w=800'
    ],
    colors: [
      { name: 'Black Leather', hex: '#000000' }
    ],
    sizes: ['38', '39', '40', '41', '42']
  }
];

async function seed() {
  await connectDB();

  // Clear existing products
  await Product.deleteMany({});
  console.log('🗑️  Cleared existing products');

  // Insert new products
  const inserted = await Product.insertMany(products);
  console.log(`✅ Seeded ${inserted.length} products into MongoDB`);

  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
