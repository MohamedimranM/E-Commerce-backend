import Product from '../models/product.model.js';
import slugify from 'slugify';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';
import xlsx from 'xlsx';

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

// Get a single product by slug
export const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({ slug }).populate('user', 'name email');
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

// Bulk upload products from Excel file
export const bulkUploadProducts = async (req, res, next) => {
  try {
    if (!req.file) {
      const err = new Error('No Excel file provided.');
      err.statusCode = 400;
      return next(err);
    }

    // Read Excel file
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    // Remove local file after reading
    fs.unlinkSync(req.file.path);

    if (!data || data.length === 0) {
      const err = new Error('Excel file is empty or invalid.');
      err.statusCode = 400;
      return next(err);
    }

    const results = {
      successful: [],
      failed: [],
      total: data.length,
    };

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // Validate required fields
        if (!row.name || !row.brand || !row.category || !row.description || !row.price || row.countInStock === undefined) {
          results.failed.push({
            row: i + 2, // Excel rows start at 1, header at 1, data at 2
            data: row,
            error: 'Missing required fields (name, brand, category, description, price, countInStock)',
          });
          continue;
        }

        // Parse images (comma-separated URLs with public_ids)
        let images = [];
        if (row.imageUrls && row.imagePublicIds) {
          const urls = row.imageUrls.split(',').map(u => u.trim()).filter(u => u);
          const publicIds = row.imagePublicIds.split(',').map(p => p.trim()).filter(p => p);
          
          if (urls.length === publicIds.length) {
            images = urls.map((url, idx) => ({
              url,
              public_id: publicIds[idx],
            }));
          }
        }

        // Generate slug
        const slug = slugify(row.name, { lower: true, strict: true });

        // Check if product with same slug already exists
        const existingProduct = await Product.findOne({ slug });
        if (existingProduct) {
          results.failed.push({
            row: i + 2,
            data: row,
            error: `Product with name "${row.name}" already exists`,
          });
          continue;
        }

        // Create product
        const product = new Product({
          name: row.name,
          slug,
          brand: row.brand,
          category: row.category,
          description: row.description,
          price: Number(row.price),
          countInStock: Number(row.countInStock),
          images: images.length > 0 ? images : [],
          isFeatured: row.isFeatured === 'true' || row.isFeatured === true || row.isFeatured === 'TRUE' || false,
          user: req.user.id,
        });

        await product.save();
        results.successful.push({
          row: i + 2,
          productId: product._id,
          name: product.name,
        });
      } catch (error) {
        results.failed.push({
          row: i + 2,
          data: row,
          error: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk upload completed. ${results.successful.length} products created, ${results.failed.length} failed.`,
      results,
    });
  } catch (error) {
    next(error);
  }
};

// Download Excel template for bulk upload
export const downloadBulkTemplate = async (req, res, next) => {
  try {
    // Create sample data
    const sampleData = [
      {
        name: 'Sample Product 1',
        brand: 'Sample Brand',
        category: 'Electronics',
        description: 'This is a sample product description',
        price: 99.99,
        countInStock: 50,
        isFeatured: false,
        imageUrls: 'https://example.com/image1.jpg,https://example.com/image2.jpg',
        imagePublicIds: 'products/sample1,products/sample2',
      },
      {
        name: 'Sample Product 2',
        brand: 'Another Brand',
        category: 'Fashion',
        description: 'Another sample product description',
        price: 149.99,
        countInStock: 30,
        isFeatured: true,
        imageUrls: 'https://example.com/image3.jpg',
        imagePublicIds: 'products/sample3',
      },
    ];

    // Create workbook and worksheet
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(sampleData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 30 }, // name
      { wch: 20 }, // brand
      { wch: 20 }, // category
      { wch: 50 }, // description
      { wch: 10 }, // price
      { wch: 15 }, // countInStock
      { wch: 12 }, // isFeatured
      { wch: 60 }, // imageUrls
      { wch: 40 }, // imagePublicIds
    ];

    xlsx.utils.book_append_sheet(workbook, worksheet, 'Products');

    // Write to buffer
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    res.setHeader('Content-Disposition', 'attachment; filename=product_upload_template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};
