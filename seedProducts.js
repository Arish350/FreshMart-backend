
import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/Product.js";

dotenv.config();

const products = [
  { name: "Fresh Tomatoes", category: "Vegetables", price: 30, quantity: 40, unit: "kg" },
  { name: "Sweet Bananas", category: "Fruits", price: 50, quantity: 40, unit: "dozen" },
  { name: "Fresh Spinach", category: "Leafy Greens", price: 20, quantity: 40, unit: "bunch" },
  { name: "Red Apples", category: "Fruits", price: 160, quantity: 40, unit: "kg" },
  { name: "Fresh Carrots", category: "Vegetables", price: 40, quantity: 40, unit: "kg" },
  { name: "Green Grapes", category: "Fruits", price: 90, quantity: 40, unit: "kg" },
  { name: "Organic Cucumber", category: "Organic", price: 35, quantity: 40, unit: "kg" },
  { name: "Fresh Coriander", category: "Leafy Greens", price: 10, quantity: 40, unit: "bunch" },
  { name: "Ponni Rice", category: "Rice", price: 60, quantity: 40, unit: "kg" },
  { name: "Raw Rice", category: "Rice", price: 55, quantity: 40, unit: "kg" },
  { name: "Basmati Rice", category: "Rice", price: 100, quantity: 40, unit: "kg" },
  { name: "Brown Rice", category: "Rice", price: 80, quantity: 40, unit: "kg" },
  { name: "Toor Dal", category: "Pulses", price: 120, quantity: 40, unit: "kg" },
  { name: "Urad Dal", category: "Pulses", price: 110, quantity: 40, unit: "kg" },
  { name: "Moong Dal", category: "Pulses", price: 100, quantity: 40, unit: "kg" },
  { name: "Chana Dal", category: "Pulses", price: 80, quantity: 40, unit: "kg" },
  { name: "Ragi", category: "Millets", price: 45, quantity: 40, unit: "kg" },
  { name: "Kambu", category: "Millets", price: 40, quantity: 40, unit: "kg" },
  { name: "Thinai", category: "Millets", price: 90, quantity: 40, unit: "kg" },
  { name: "Samai", category: "Millets", price: 85, quantity: 40, unit: "kg" },
  { name: "Wheat", category: "Other Grains", price: 40, quantity: 40, unit: "kg" },
  { name: "Maize", category: "Other Grains", price: 35, quantity: 40, unit: "kg" },
  { name: "Barley", category: "Other Grains", price: 70, quantity: 40, unit: "kg" },
  { name: "Country Chicken Eggs", category: "Eggs", price: 12, quantity: 40, unit: "piece" },
  { name: "Fresh Cow Milk", category: "Dairy", price: 35, quantity: 40, unit: "litre" },
  { name: "Fresh Curd", category: "Dairy", price: 40, quantity: 40, unit: "kg" },
  { name: "Fresh Butter", category: "Dairy", price: 60, quantity: 40, unit: "pack" },
  { name: "Pure Groundnut Oil", category: "Oils", price: 180, quantity: 40, unit: "litre" },
  { name: "Pure Sesame Oil", category: "Oils", price: 220, quantity: 40, unit: "litre" },
  { name: "Fresh Beetroot", category: "Vegetables", price: 40, quantity: 40, unit: "kg" },
  { name: "Fresh Cabbage", category: "Vegetables", price: 30, quantity: 40, unit: "kg" },
  { name: "Bitter Gourd", category: "Vegetables", price: 45, quantity: 40, unit: "kg" },
  { name: "Fresh Potato", category: "Vegetables", price: 35, quantity: 40, unit: "kg" },
  { name: "Fresh Onion", category: "Vegetables", price: 40, quantity: 40, unit: "kg" },
  { name: "Green Peas", category: "Vegetables", price: 60, quantity: 40, unit: "kg" },
  { name: "Fresh Broccoli", category: "Vegetables", price: 100, quantity: 40, unit: "kg" },
  { name: "Fresh Pumpkin", category: "Vegetables", price: 30, quantity: 40, unit: "kg" },
  { name: "Drumstick", category: "Vegetables", price: 50, quantity: 40, unit: "kg" },
  { name: "Fresh Mushroom", category: "Vegetables", price: 120, quantity: 40, unit: "kg" },
  { name: "French Beans", category: "Vegetables", price: 60, quantity: 40, unit: "kg" },
  { name: "Bottle Gourd", category: "Vegetables", price: 30, quantity: 40, unit: "kg" },
  { name: "Fresh Turnip", category: "Vegetables", price: 45, quantity: 40, unit: "kg" },
  { name: "Green Chilli", category: "Vegetables", price: 50, quantity: 40, unit: "kg" }
];

async function seedProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Connected database:", mongoose.connection.name);

    if (mongoose.connection.name !== "freshmart") {
      throw new Error("Wrong database! Expected freshmart.");
    }

    const count = await Product.countDocuments();

    if (count > 0) {
      console.log(`Already ${count} products exist. Import skipped.`);
      return;
    }

    const result = await Product.insertMany(products);

    console.log(`Successfully imported ${result.length} products.`);
  } catch (error) {
    console.error("Import error:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedProducts();
