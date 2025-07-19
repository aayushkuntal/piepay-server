const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const errorHandler = require("./middleware/errorHandler");
const offerRoutes = require("./routes/offerRoutes");
const discountRoutes = require("./routes/discountRoutes");
const { connectDB } = require("./config/database");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use("/api/v1/offer", offerRoutes);
app.use("/api/v1/highest-discount", discountRoutes);

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "OK", message: "Server is running" });
});

// Error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
