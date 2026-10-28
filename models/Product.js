
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    category: {
      type: String,
      required: true,
      enum: [
        "Fruits",
        "Vegetables",
        "Leafy Greens",
        "Organic",
        "Rice",
        "Pulses",
        "Millets",
        "Other Grains",
        "Eggs",
        "Dairy",
        "Oils",
        "Combo Packs"
      ]
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    quantity: {
      type: Number,
      default: 0,
      min: 0
    },

    unit: {
      type: String,
      default: "kg"
    },

    image: {
      type: String,
      default: ""
    },

    description: {
      type: String,
      default: ""
    },

    farmer: {
      type: String,
      default: "Local Farmer"
    },

    location: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

const Product =
  mongoose.models.Product ||
  mongoose.model("Product", productSchema);

export default Product;
