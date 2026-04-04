import Product from '../models/product.model.js';
import slugify from 'slugify';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';

// Get all distinct categories
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct('category');
    res.status(200).json({ success: true, categories });
  } catch (error) {
    next(error);
  }
};

// Create a new product

export const createProductWithImages = async (req, res, next) => {
  try {
    const { name, brand, category, description, price, countInStock } = req.body;
    const files = req.files; // array of images

    if (!files || files.length === 0) {
      const err = new Error('At least one image is required.');
      err.statusCode = 400;
      return next(err);
    }

    // Upload all images to Cloudinary
    const images = [];
    for (const file of files) {
      const result = await cloudinary.uploader.upload(file.path, { folder: 'products' });
      images.push({ url: result.secure_url, public_id: result.public_id });
      fs.unlinkSync(file.path); // remove local file
    }

    const slug = slugify(name, { lower: true, strict: true });

    const product = new Product({
      name,
      slug,
      brand,
      category,
      description,
      price,
      countInStock,
      images,
      user: req.user.id
    });

    await product.save();
    res.status(201).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const { name, brand, category, description, price, countInStock, images } = req.body;
    if (!name || !brand || !category || !description || !price || !countInStock || !images) {
      const err = new Error('All required fields must be provided.');
      err.statusCode = 400;
      return next(err);
    }
    const slug = slugify(name, { lower: true, strict: true });
    const product = new Product({
      ...req.body,
      slug,
      user: req.user.id // assumes authorize middleware sets req.user
    });
    await product.save();
    res.status(201).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// Get all products
export const getProducts = async (req, res, next) => {
  try {
    const { category, minPrice, maxPrice, name } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    const products = await Product.find(filter).populate('user', 'name email');
    res.status(200).json({ totalProducts: products.length, success: true, products });
  } catch (error) {
    next(error);
  }
};

// Get a single product by ID
export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate('user', 'name email');
    if (!product) {
      const err = new Error('Product not found.');
      err.statusCode = 404;
      return next(err);
    }
    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// Update a product by ID
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (updates.name) {
      updates.slug = slugify(updates.name, { lower: true, strict: true });
    }
    const product = await Product.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!product) {
      const err = new Error('Product not found.');
      err.statusCode = 404;
      return next(err);
    }
    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// Delete a product by ID
export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      const err = new Error('Product not found.');
      err.statusCode = 404;
      return next(err);
    }
    res.status(200).json({ success: true, message: 'Product deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// Upload product image
export const uploadProductImage = async (req, res, next) => {
  try {
    if (!req.file) {
      const err = new Error('No image file provided.');
      err.statusCode = 400;
      return next(err);
    }
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'products',
    });
    // Remove local file after upload
    fs.unlinkSync(req.file.path);
    res.status(200).json({ url: result.secure_url, public_id: result.public_id });
  } catch (error) {
    next(error);
  }
};
