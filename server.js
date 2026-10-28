
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

import Farmer from "./models/Farmer.js";
import Product from "./models/Product.js";
import Order from "./models/Order.js";
import Notification from "./models/Notification.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --------------------------------------------------
// MIDDLEWARE
// --------------------------------------------------

app.use(cors());
app.use(express.json());

// --------------------------------------------------
// BASIC ROUTES
// --------------------------------------------------

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "FreshMart Backend API is running!",
  });
});
app.get("/api/farmer/profile", async (req, res, next) => {
  try {
    if (databaseMode !== "mongodb") {
      return res.status(503).json({
        success: false,
        message: "MongoDB is not connected"
      });
    }

    res.json({
      success: true,
      message: "Farmer profile API working",
      databaseMode
    });
  } catch (error) {
    next(error);
  }
});
app.get("/api/test-route", (req, res) => {
  res.json({
    success: true,
    message: "FreshMart API working correctly",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "freshmart-api",
    status: "healthy",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

// --------------------------------------------------
// PRODUCTS
// --------------------------------------------------

app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error("Fetch products error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products.",
      error: error.message,
    });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Add product error:", error);
    res.status(400).json({
      success: false,
      message: "Failed to add product.",
      error: error.message,
    });
  }
});

// --------------------------------------------------
// ORDERS
// --------------------------------------------------

const getOrderQuantity = (item) =>
  Number(item.quantity ?? item.qty ?? 1);

app.post("/api/orders", async (req, res) => {
  try {
    const { customer, items, paymentMethod } = req.body;

    if (
      !customer?.name ||
      !customer?.phone ||
      !customer?.address ||
      !customer?.city ||
      !customer?.pincode
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide complete delivery details.",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one product.",
      });
    }

    if (paymentMethod !== "COD") {
      return res.status(400).json({
        success: false,
        message: "Only Cash on Delivery is currently supported.",
      });
    }

    const normalizedItems = [];

    for (const item of items) {
      const productId = item.productId || item._id || item.id;

      if (!mongoose.isValidObjectId(productId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid product ID: ${item.name || "Unknown product"}`,
        });
      }

      const product = await Product.findById(productId);

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${item.name || "Unknown product"}`,
        });
      }

      const quantity = getOrderQuantity(item);

      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Invalid product quantity.",
        });
      }

      normalizedItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity,
      });
    }

    const calculatedSubtotal = normalizedItems.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );

    const calculatedDelivery =
      calculatedSubtotal >= 499 ? 0 : 40;

    const calculatedTotal =
      calculatedSubtotal + calculatedDelivery;

    const order = await Order.create({
      customer,
      items: normalizedItems,
      subtotal: calculatedSubtotal,
      deliveryCharge: calculatedDelivery,
      totalAmount: calculatedTotal,
      paymentMethod: "COD",
      paymentStatus: "Pending",
      orderStatus: "Pending",
    });

    // Create notification without failing the order response.
    try {
      const notification = await Notification.create({
        title: "New Order Received",
        message: `Order from ${customer.name} for Rs. ${calculatedTotal}.`,
        type: "new_order",
        orderId: order._id,
        isRead: false,
      });

      console.log(
        "Order notification created:",
        notification._id.toString()
      );
    } catch (notificationError) {
      console.error(
        "Order notification creation failed:",
        notificationError.message
      );
    }

    return res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      order,
    });
  } catch (error) {
    console.error("Create order error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save order.",
      error: error.message,
    });
  }
});

app.get("/api/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error("Fetch orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders.",
      error: error.message,
    });
  }
});

// --------------------------------------------------
// NOTIFICATIONS
// --------------------------------------------------

app.get("/api/notifications", async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(notifications);
  } catch (error) {
    console.error("Fetch notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications.",
      error: error.message,
    });
  }
});

app.get("/api/notifications/unread-count", async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      isRead: false,
    });

    res.json({ success: true, count });
  } catch (error) {
    console.error("Unread notification count error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch unread notification count.",
      error: error.message,
    });
  }
});

app.patch("/api/notifications/:id/read", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID.",
      });
    }

    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true, runValidators: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    res.json({
      success: true,
      message: "Notification marked as read.",
      notification,
    });
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update notification.",
      error: error.message,
    });
  }
});

app.patch("/api/notifications/read-all", async (req, res) => {
  try {
    await Notification.updateMany(
      { isRead: false },
      { $set: { isRead: true } }
    );

    res.json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update notifications.",
      error: error.message,
    });
  }
});

// --------------------------------------------------
// FARMER PROFILE
// --------------------------------------------------

app.get("/api/farmer/profile", async (req, res) => {
  try {
    let farmer = await Farmer.findOne();

    if (!farmer) {
      farmer = await Farmer.create({ name: "Arish" });
    }

    res.json({
      success: true,
      farmer,
    });
  } catch (error) {
    console.error("Get farmer profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load farmer profile.",
      error: error.message,
    });
  }
});

app.put("/api/farmer/profile", async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      farmName,
      location,
      profilePhoto,
    } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Farmer name is required.",
      });
    }

    const farmer = await Farmer.findOneAndUpdate(
      {},
      {
        $set: {
          name: name.trim(),
          phone: phone || "",
          email: email || "",
          farmName: farmName || "",
          location: location || "",
          profilePhoto: profilePhoto || "",
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    res.json({
      success: true,
      message: "Farmer profile saved successfully!",
      farmer,
    });
  } catch (error) {
    console.error("Save farmer profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save farmer profile.",
      error: error.message,
    });
  }
});

// --------------------------------------------------
// SALES ANALYTICS
// --------------------------------------------------

app.get("/api/analytics", async (req, res) => {
  try {
    const orders = await Order.find({
      orderStatus: { $ne: "Cancelled" },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter(
      (order) => order.createdAt >= today
    );

    const paidOrders = orders.filter(
      (order) => order.paymentStatus === "Paid"
    );

    const revenue = paidOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount || 0),
      0
    );

    const todaySales = todayOrders
      .filter((order) => order.paymentStatus === "Paid")
      .reduce(
        (sum, order) => sum + Number(order.totalAmount || 0),
        0
      );

    const dailySales = {};

    for (const order of paidOrders) {
      const date = order.createdAt.toISOString().slice(0, 10);

      dailySales[date] =
        (dailySales[date] || 0) +
        Number(order.totalAmount || 0);
    }

    res.json({
      success: true,
      totalOrders: orders.length,
      revenue,
      todayOrders: todayOrders.length,
      todaySales,
      dailySales: Object.entries(dailySales).map(
        ([date, sales]) => ({ date, sales })
      ),
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load analytics.",
      error: error.message,
    });
  }
});

// --------------------------------------------------
// START SERVER
// --------------------------------------------------

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is missing in your backend .env file.");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully!");

    app.listen(PORT, "0.0.0.0", () => {
      app.get("/api/farmer/profile", async (req, res) => {
  try {
    let farmer = await Farmer.findOne();

    if (!farmer) {
      farmer = await Farmer.create({ name: "Arish" });
    }

    res.json({
      success: true,
      farmer: farmer
    });
  } catch (error) {
    console.error("Farmer profile error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
      console.log(`FreshMart API running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB Connection Failed:", error.message);
    process.exit(1);
  });
