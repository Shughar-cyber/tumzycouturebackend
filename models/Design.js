import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false }
);

const videoSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false }
);

const designSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    price: { type: Number, required: true, min: 0 },
    colors: [{ type: String, trim: true }],
    sizes: [
      {
        type: String,
        enum: ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Custom Measurement"],
      },
    ],
    fabric: { type: String, trim: true, default: "" },
    mainImage: { type: imageSchema, required: true },
    additionalImages: [imageSchema],
    videos: [videoSchema],
    available: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

designSchema.index({ name: "text", description: "text" });

export default mongoose.model("Design", designSchema);
