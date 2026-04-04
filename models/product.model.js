import mongoose from 'mongoose';
import User from './user.model.js';

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    }, // Tracks which admin added the product
    name: { 
      type: String, 
      required: [true, 'Please enter product name'], 
      trim: true 
    },
    slug: { 
      type: String, 
      unique: true, 
      sparse: true,
      lowercase: true 
    }, // Useful for SEO-friendly URLs (e.g., /product/iphone-15-pro)
    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true }, // For Cloudinary management
      }
    ],
    brand: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    reviews: [reviewSchema], // Embedded sub-document
    rating: { type: Number, required: true, default: 0 },
    numReviews: { type: Number, required: true, default: 0 },
    price: { type: Number, required: true, default: 0 },
    countInStock: { type: Number, required: true, default: 0 },
    isFeatured: { type: Boolean, default: false },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexing for search performance
productSchema.index({ name: 'text', brand: 'text', category: 'text' });

const Product = mongoose.model('Product', productSchema);
export default Product;