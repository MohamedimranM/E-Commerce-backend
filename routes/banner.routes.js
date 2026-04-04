import { Router } from 'express';
import {
  createBanner,
  getBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
} from '../controllers/banner.controllers.js';
import authorize from '../middleware/authorize.js';
import restrictTo from '../middleware/restrictTo.js';
import upload from '../config/multer.js';

const bannerRouter = Router();

bannerRouter.post('/', authorize, restrictTo('admin'), upload.single('image'), createBanner);
bannerRouter.get('/', getBanners);
bannerRouter.get('/:id', getBannerById);
bannerRouter.put('/:id', authorize, restrictTo('admin'), upload.single('image'), updateBanner);
bannerRouter.delete('/:id', authorize, restrictTo('admin'), deleteBanner);

export default bannerRouter;
