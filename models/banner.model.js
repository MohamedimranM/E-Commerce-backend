import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter banner name'],
      trim: true,
    },
    image: {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
    },
  },
  { timestamps: true }
);

const Banner = mongoose.model('Banner', bannerSchema);
export default Banner;
