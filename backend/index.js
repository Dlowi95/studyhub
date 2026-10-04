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
const subjectRoutes = require("./routes/subjectRoutes");
const reportRoutes = require("./routes/reportRoutes");   
const reviewRoutes = require("./routes/reviewRoutes");   
const notificationRoutes = require("./routes/notificationRoutes");
const followRoutes = require("./routes/followRoutes");
const fileRoutes = require("./routes/fileRoutes");
const bookmarkRoutes = require("./routes/bookmarkRoutes");
const { createCorsOriginValidator, parseCorsOrigins } = require("./utils/corsOrigin");

const app = express();
const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/studyhub";
const mongoOptions = {
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 30000,
  ...(mongoUri.startsWith("mongodb+srv://") ? { tls: true, tlsAllowInvalidCertificates: false } : {}),
};

const allowedOrigins = parseCorsOrigins(process.env.CORS_ORIGINS);
app.use(cors({
  origin: createCorsOriginValidator({
    allowedOrigins,
    isProduction: process.env.NODE_ENV === "production",
  }),
}));
app.use(express.json());
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Content-Security-Policy", "sandbox; default-src 'none'");
    },
  })
);

app.get("/api/health", (req, res) => {
  const isMongoConnected = mongoose.connection.readyState === 1;
  res.status(isMongoConnected ? 200 : 503).json({
    status: isMongoConnected ? "ok" : "unavailable",
    mongo: isMongoConnected ? "connected" : "disconnected",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

app.use("/api/documents", documentRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/files", fileRoutes);

app.use("/api", reportRoutes);   
app.use("/api", reviewRoutes);
app.use("/api", notificationRoutes);
app.use("/api/follows", followRoutes);
app.use("/api", bookmarkRoutes);

// Base route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to StudyHub API" });
});

const startServer = async () => {
  if (process.env.NODE_ENV === "production") {
    const missing = ["MONGO_URI", "JWT_SECRET"].filter((key) => !process.env[key]?.trim());
    if (missing.length) {
      throw new Error(`Missing required production environment variables: ${missing.join(", ")}`);
    }
  }

  await mongoose.connect(mongoUri, mongoOptions);
  console.log("MongoDB connected successfully");

  return app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
  });
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Application failed to start:", error.message);
    process.exitCode = 1;
  });
}

module.exports = { app, startServer };
