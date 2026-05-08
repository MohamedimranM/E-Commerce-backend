import { Router } from 'express';
import {
  getProducts,
  getProductBySlug,
  getProductById,
  updateProduct,
  deleteProduct,
  getCategories,
  uploadProductImage,
  createProductWithImages,
  bulkUploadProducts,
  downloadBulkTemplate
} from '../controllers/product.controllers.js';
import authorize from '../middleware/authorize.js';
import restrictTo from '../middleware/restrictTo.js';
import upload from '../config/multer.js';

const productRouter = Router();

// All product routes are protected
productRouter.post('/', authorize, restrictTo('admin'), upload.array('images', 5), createProductWithImages);
productRouter.post('/bulk-upload', authorize, restrictTo('admin'), upload.single('file'), bulkUploadProducts);
productRouter.get('/bulk-template', authorize, restrictTo('admin'), downloadBulkTemplate);
productRouter.get('/categories', getCategories);
productRouter.get('/', getProducts);
productRouter.get('/slug/:slug', getProductBySlug);
productRouter.get('/:id', getProductById);
productRouter.put('/:id', authorize, restrictTo('admin'), updateProduct);
productRouter.delete('/:id', authorize, restrictTo('admin'), deleteProduct);
productRouter.post('/upload', authorize, restrictTo('admin'), upload.single('image'), uploadProductImage);

export default productRouter;
