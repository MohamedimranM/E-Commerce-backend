import Product from '../models/product.model.js';

export const addReview = async (req, res, next) => {
  try {
    const { id } = req.params; // product ID
    const { rating, comment } = req.body;
    const user = req.user; // assumes authorize middleware

    const product = await Product.findById(id);
    if (!product) {
      const err = new Error('Product not found.');
      err.statusCode = 404;
      return next(err);
    }

    // Check if user already reviewed
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === user.id
    );
    if (alreadyReviewed) {
      const err = new Error('Product already reviewed by this user.');
      err.statusCode = 400;
      return next(err);
    }

    const review = {
      user: user.id,
      name: user.name,
      rating: Number(rating),
      comment,
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();
    res.status(201).json({ success: true, message: 'Review added.' });
  } catch (error) {
    next(error);
  }
};
