import { Router } from 'express';
import { addReview } from '../controllers/review.controllers.js';
import authorize from '../middleware/authorize.js';

const reviewRouter = Router();

// Add review to a product
reviewRouter.post('/products/:id/reviews', authorize, addReview);

export default reviewRouter;
