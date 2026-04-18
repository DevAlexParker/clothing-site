import { Router } from 'express';
import { z } from 'zod';
import { Product } from '../models/Product.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
const productPayloadSchema = z.object({
  name: z.string().trim().min(2).max(150),
  price: z.number().positive().max(10000000),
  category: z.string().trim().min(2).max(80),
  images: z.array(z.string().url()).max(10).default([]),
  colors: z.array(
    z.object({
      name: z.string().trim().min(1).max(40),
      hex: z.string().trim().regex(/^#[0-9A-Fa-f]{3,8}$/),
    })
  ).max(20).default([]),
  sizes: z.array(z.string().trim().min(1).max(20)).max(20).default([]),
  stock: z.number().int().min(0).max(100000).default(0),
  isNewArrival: z.boolean().optional(),
});

// GET /api/products — Get all products
router.get('/', async (_req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/low-stock — Get products with stock <= 3 (for client "Almost Gone" section)
router.get('/low-stock', async (_req, res) => {
  try {
    const products = await Product.find({ stock: { $gt: 0, $lte: 3 } }).sort({ stock: 1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching low-stock products:', error);
    res.status(500).json({ error: 'Failed to fetch low-stock products' });
  }
});

// GET /api/products/:id — Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /api/products — Create a new product
router.post('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const payload = productPayloadSchema.parse(req.body);
    const product = new Product(payload);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request payload' });
      return;
    }
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /api/products/:id — Update a product
router.put('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const payload = productPayloadSchema.parse(req.body);
    const product = await Product.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request payload' });
      return;
    }
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// PATCH /api/products/:id/stock — Update product stock quantity
router.patch('/:id/stock', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { stock } = req.body;
    if (stock === undefined || stock < 0) {
      res.status(400).json({ error: 'Valid stock quantity is required' });
      return;
    }
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { stock },
      { new: true }
    );
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(product);
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

// DELETE /api/products/:id — Delete a product
router.delete('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;

