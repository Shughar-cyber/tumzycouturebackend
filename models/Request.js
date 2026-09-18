import mongoose from "mongoose";

const measurementsSchema = new mongoose.Schema(
  {
    bust: Number,
    waist: Number,
    hip: Number,
    shoulder: Number,
    sleeveLength: Number,
    dressLength: Number,
    trouserLength: Number,
    topLength: Number,
    neck: Number,
    thigh: Number,
    armhole: Number,
  },
  { _id: false }
);

const requestSchema = new mongoose.Schema(
  {
    requestNumber: { type: String, required: true, unique: true, index: true },

    // Customer info (no account created)
    customerName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    whatsapp: { type: String, trim: true, default: "" },

    // Selected design (snapshot fields kept in case the design changes later)
    design: { type: mongoose.Schema.Types.ObjectId, ref: "Design", required: true },
    designName: { type: String, required: true },
    designPrice: { type: Number, required: true },

    quantity: { type: Number, default: 1, min: 1 },
    preferredSize: {
      type: String,
      enum: ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Custom Measurement"],
      required: true,
    },
    preferredColor: { type: String, trim: true, default: "" },
    preferredDate: { type: Date },
    measurements: measurementsSchema,
    notes: { type: String, default: "" },

    referenceImage: {
      url: { type: String },
      publicId: { type: String },
    },

    status: {
      type: String,
      enum: ["New", "Contacted", "Confirmed", "In Progress", "Completed", "Cancelled"],
      default: "New",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Request", requestSchema);
