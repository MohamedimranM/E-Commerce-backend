
import reviewRoutes from './routes/review.routes.js';
import cartRoutes from './routes/cart.routes.js';
import orderRoutes from './routes/order.routes.js';
import errorHandler from "./middleware/errorhandle.js";
import express from "express";
import cors from "cors";
import { PORT, NODE_ENV } from "./config/env.js";
import connectDB from "./database/connection.js";
import authRoutes from "./routes/auth.routes.js";
import forgotRoutes from "./routes/forgot.routes.js";
import userRouter from "./routes/users.routes.js";
import paymentRoutes from './routes/payment.routes.js';
import productRoutes from './routes/product.routes.js';
import bannerRoutes from './routes/banner.routes.js';

const app = express();


app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "https://shoppingecomadmin.vercel.app" , "https://shoppinghubecom.vercel.app" , "http://localhost:8000"],
  credentials: true,
}));

// Stripe webhook needs raw body
app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRouter);
app.use("/api/v1", forgotRoutes);
app.use("/api/v1/products", productRoutes);
app.use('/api/v1', reviewRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/banners', bannerRoutes);
app.use('/api/v1/payments', paymentRoutes);

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// Global error handler (should be after all routes)
app.use(errorHandler);

// Connect to the database, then start the server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} in ${NODE_ENV} mode`);
  });
});
