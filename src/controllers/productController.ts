import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { Product } from '../models/Product';
import { AuthRequest } from '../middleware/auth';

// @desc  Get all products (with search, filter, pagination)
// @route GET /api/products
export const getProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const pageSize = Number(req.query.pageSize) || 12;
  const page = Number(req.query.page) || 1;

  const keyword = req.query.keyword
    ? {
        $or: [
          { name: { $regex: String(req.query.keyword), $options: 'i' } },
          { brand: { $regex: String(req.query.keyword), $options: 'i' } },
          { description: { $regex: String(req.query.keyword), $options: 'i' } },
          { category: { $regex: String(req.query.keyword), $options: 'i' } },
        ],
      }
    : {};
  const category =
    req.query.category && req.query.category !== 'all'
      ? { category: String(req.query.category) }
      : {};

  const filter = { ...keyword, ...category };

  let sort: Record<string, 1 | -1> = { createdAt: -1 };
  if (req.query.sort === 'price-asc') sort = { price: 1 };
  if (req.query.sort === 'price-desc') sort = { price: -1 };
  if (req.query.sort === 'rating') sort = { rating: -1 };

  const count = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .sort(sort)
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({ products, page, pages: Math.ceil(count / pageSize), total: count });
});

// @desc  Get product categories
// @route GET /api/products/categories
export const getCategories = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const categories = await Product.distinct('category');
  res.json(categories);
});

// @desc  Get featured products
// @route GET /api/products/featured
export const getFeatured = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const products = await Product.find({ featured: true }).limit(8);
  res.json(products);
});

// @desc  Get similar products (same category, excludes self)
// @route GET /api/products/:id/similar
export const getSimilarProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  const similar = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
  })
    .sort({ rating: -1 })
    .limit(4);
  res.json(similar);
});

// @desc  Get single product
// @route GET /api/products/:id
export const getProductById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json(product);
});

// @desc  Create product (admin)
// @route POST /api/products
export const createProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, description, price, category, brand, images, stock, featured } = req.body;
  const product = await Product.create({
    name,
    description,
    price,
    category,
    brand,
    images: images || [],
    stock,
    featured: !!featured,
  });
  res.status(201).json(product);
});

// @desc  Update product (admin)
// @route PUT /api/products/:id
export const updateProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  const fields = ['name', 'description', 'price', 'category', 'brand', 'images', 'stock', 'featured'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) (product as any)[f] = req.body[f];
  });
  const updated = await product.save();
  res.json(updated);
});

// @desc  Delete product (admin)
// @route DELETE /api/products/:id
export const deleteProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  await product.deleteOne();
  res.json({ message: 'Product removed' });
});
