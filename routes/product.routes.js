import { Router } from 'express';
import {
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getCategories
} from '../controllers/product.controllers.js';
import authorize from '../middleware/authorize.js';
import restrictTo from '../middleware/restrictTo.js';
import upload from '../config/multer.js';
import { uploadProductImage } from '../controllers/product.controllers.js';
import { createProductWithImages } from '../controllers/product.controllers.js';

const productRouter = Router();

// All product routes are protected
productRouter.post('/', authorize, restrictTo('admin'), upload.array('images', 5), createProductWithImages);
productRouter.get('/categories', getCategories);
productRouter.get('/', getProducts);
productRouter.get('/:id', getProductById);
productRouter.put('/:id', authorize, restrictTo('admin'), updateProduct);
productRouter.delete('/:id', authorize, restrictTo('admin'), deleteProduct);
productRouter.post('/upload', authorize, restrictTo('admin'), upload.single('image'), uploadProductImage);

export default productRouter;
