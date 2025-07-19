const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(
            process.env.MONGODB_URI || "mongodb://localhost:27017/piepay",
            {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            },
        );
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error("Database connection failed:", error.message);
        process.exit(1);
    }
};

module.exports = { connectDB };
