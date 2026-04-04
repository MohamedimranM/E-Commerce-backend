import Banner from '../models/banner.model.js';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';

// Create a new banner
export const createBanner = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name) {
      const err = new Error('Banner name is required.');
      err.statusCode = 400;
      return next(err);
    }

    if (!req.file) {
      const err = new Error('Banner image is required.');
      err.statusCode = 400;
      return next(err);
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'banners',
    });
    fs.unlinkSync(req.file.path);

    const banner = await Banner.create({
      name,
      image: { url: result.secure_url, public_id: result.public_id },
    });

    res.status(201).json({ success: true, banner });
  } catch (error) {
    next(error);
  }
};

// Get all banners
export const getBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, totalBanners: banners.length, banners });
  } catch (error) {
    next(error);
  }
};

// Get a single banner by ID
export const getBannerById = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      const err = new Error('Banner not found.');
      err.statusCode = 404;
      return next(err);
    }
    res.status(200).json({ success: true, banner });
  } catch (error) {
    next(error);
  }
};

// Update a banner by ID
export const updateBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      const err = new Error('Banner not found.');
      err.statusCode = 404;
      return next(err);
    }

    if (req.body.name) {
      banner.name = req.body.name;
    }

    if (req.file) {
      // Delete old image from Cloudinary
      await cloudinary.uploader.destroy(banner.image.public_id);

      // Upload new image
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'banners',
      });
      fs.unlinkSync(req.file.path);

      banner.image = { url: result.secure_url, public_id: result.public_id };
    }

    await banner.save();
    res.status(200).json({ success: true, banner });
  } catch (error) {
    next(error);
  }
};

// Delete a banner by ID
export const deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      const err = new Error('Banner not found.');
      err.statusCode = 404;
      return next(err);
    }

    // Delete image from Cloudinary
    await cloudinary.uploader.destroy(banner.image.public_id);

    await Banner.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Banner deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
