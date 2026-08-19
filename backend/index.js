const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const documentRoutes = require("./routes/documentRoutes");
const reportRoutes = require("./routes/reportRoutes");   
const reviewRoutes = require("./routes/reviewRoutes");   

const app = express();
const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/studyhub";

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

app.use("/api/documents", documentRoutes);

app.use("/api", reportRoutes);   
app.use("/api", reviewRoutes);

// Base route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to StudyHub API" });
});

mongoose
  .connect(mongoUri, {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 30000,
    tls: true,
    tlsAllowInvalidCertificates: false,
  })
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed. Check MONGO_URI or start a local MongoDB instance.");
    console.error(error.message);

    app.listen(port, () => {
      console.log(`Server running on port ${port} without MongoDB connection.`);
    });
  });