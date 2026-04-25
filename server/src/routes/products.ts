import { Router } from 'express';
import { z } from 'zod';
import { Product } from '../models/Product.js';
import { authenticate, authorize } from '../middleware/auth.js';
import multer from 'multer';
import { optimizeImage, optimizeFromUrl } from '../utils/image-processor.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});
const productPayloadSchema = z.object({
  name: z.string().trim().min(2).max(150),
  price: z.number().positive().max(10000000),
  category: z.string().trim().min(2).max(80),
  images: z.array(z.string()).max(10).default([]),
  colors: z.array(
    z.object({
      name: z.string().trim().min(1).max(40),
      hex: z.string().trim().regex(/^#[0-9A-Fa-f]{3,8}$/),
    })
  ).max(20).default([]),
  sizes: z.array(z.string().trim().min(1).max(20)).max(20).default([]),
  stock: z.number().int().min(0).max(100000).default(0),
  isNewArrival: z.boolean().optional(),
  gender: z.enum(['men', 'women', 'unisex']).optional(),
});

// GET /api/products — Get all products
router.get('/', async (req, res) => {
  try {
    const showDeleted = req.query.deleted === 'true';
    const products = await Product.find({ isDeleted: showDeleted }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/low-stock — Get products with stock <= 3 (for client "Almost Gone" section)
router.get('/low-stock', async (_req, res) => {
  try {
    const products = await Product.find({ 
      stock: { $gt: 0, $lte: 3 },
      isDeleted: { $ne: true } 
    }).sort({ stock: 1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching low-stock products:', error);
    res.status(500).json({ error: 'Failed to fetch low-stock products' });
  }
});

// POST /api/products/upload — Upload and optimize an image
router.post('/upload', authenticate, authorize(['admin']), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }
    const optimizedUrl = await optimizeImage(req.file.buffer, req.file.originalname);
    res.json({ url: optimizedUrl });
  } catch (error) {
    console.error('Upload failed:', error);
    res.status(500).json({ error: 'Failed to upload image' });
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
    
    // Optimize URLs in the images array
    if (payload.images && payload.images.length > 0) {
      payload.images = await Promise.all(
        payload.images.map(url => optimizeFromUrl(url))
      );
    }

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

    // Optimize URLs in the images array
    if (payload.images && payload.images.length > 0) {
      payload.images = await Promise.all(
        payload.images.map(url => optimizeFromUrl(url))
      );
    }

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

// PATCH /api/products/:id/soft-delete — Move product to recycle bin
router.patch('/:id/soft-delete', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ message: 'Product moved to recycle bin', product });
  } catch (error) {
    console.error('Error soft deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// PATCH /api/products/:id/restore — Restore product from recycle bin
router.patch('/:id/restore', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isDeleted: false, deletedAt: undefined },
      { new: true }
    );
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ message: 'Product restored successfully', product });
  } catch (error) {
    console.error('Error restoring product:', error);
    res.status(500).json({ error: 'Failed to restore product' });
  }
});

// DELETE /api/products/bulk — Permanently delete multiple products
router.delete('/bulk', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: 'No product IDs provided' });
      return;
    }
    await Product.deleteMany({ _id: { $in: ids } });
    res.json({ message: 'Products permanently deleted' });
  } catch (error) {
    console.error('Error bulk deleting products:', error);
    res.status(500).json({ error: 'Failed to delete products' });
  }
});

// DELETE /api/products/:id — Permanently delete a product
router.delete('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ message: 'Product permanently deleted' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// PATCH /api/products/bulk-soft-delete — Move multiple products to recycle bin
router.patch('/bulk-soft-delete', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: 'No product IDs provided' });
      return;
    }
    await Product.updateMany(
      { _id: { $in: ids } },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );
    res.json({ message: 'Products moved to recycle bin' });
  } catch (error) {
    console.error('Error bulk soft deleting products:', error);
    res.status(500).json({ error: 'Failed to delete products' });
  }
});

// PATCH /api/products/bulk-restore — Restore multiple products
router.patch('/bulk-restore', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: 'No product IDs provided' });
      return;
    }
    await Product.updateMany(
      { _id: { $in: ids } },
      { $set: { isDeleted: false }, $unset: { deletedAt: "" } }
    );
    res.json({ message: 'Products restored successfully' });
  } catch (error) {
    console.error('Error bulk restoring products:', error);
    res.status(500).json({ error: 'Failed to restore products' });
  }
});

// PATCH /api/products/bulk-stock — Update stock for multiple products
router.patch('/bulk-stock', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { ids, stock } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: 'No product IDs provided' });
      return;
    }
    if (typeof stock !== 'number' || stock < 0) {
      res.status(400).json({ error: 'Invalid stock value' });
      return;
    }

    await Product.updateMany(
      { _id: { $in: ids } },
      { $set: { stock } }
    );

    res.json({ message: 'Stock updated successfully' });
  } catch (error) {
    console.error('Error bulk updating stock:', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

export default router;

