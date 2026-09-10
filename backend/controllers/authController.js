const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");

const avatarDir = path.join(__dirname, "..", "uploads", "avatars");

const saveLocalAvatar = async (file) => {
  fs.mkdirSync(avatarDir, { recursive: true });
  const ext = path.extname(file.originalname || "") || ".png";
  const safeName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
  const filePath = path.join(avatarDir, safeName);
  await fs.promises.writeFile(filePath, file.buffer);
  return `http://localhost:${process.env.PORT || 5000}/uploads/avatars/${encodeURIComponent(safeName)}`;
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      passwordHash,
      role: "student",
      status: "active",
      avatarUrl: "",
    });

    await newUser.save();

    // Generate token
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        avatarUrl: newUser.avatarUrl || "",
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during registration", error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (user.status === "blocked") {
      return res.status(403).json({ message: "Your account has been locked" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        avatarUrl: user.avatarUrl || "",
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during login", error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    // req.user is populated by authenticateToken middleware
    const user = req.user;
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarUrl || "",
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching profile", error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Chưa xác thực người dùng" });
    }

    const { name } = req.body;
    if (name && name.trim()) {
      user.name = name.trim();
    }

    if (req.file) {
      let avatarUrl = "";
      if (cloudinary.isConfigured) {
        try {
          const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: "studyhub/avatars",
                resource_type: "image",
              },
              (error, uploadResult) => {
                if (error) reject(error);
                else resolve(uploadResult);
              }
            );
            stream.end(req.file.buffer);
          });
          avatarUrl = result.secure_url;
        } catch (cloudErr) {
          avatarUrl = await saveLocalAvatar(req.file);
        }
      } else {
        avatarUrl = await saveLocalAvatar(req.file);
      }
      user.avatarUrl = avatarUrl;
    } else if (req.body.avatarUrl) {
      user.avatarUrl = req.body.avatarUrl;
    }

    await user.save();

    return res.json({
      message: "Cập nhật hồ sơ thành công",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        avatarUrl: user.avatarUrl || "",
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi cập nhật hồ sơ",
      error: error.message,
    });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { email, name, avatarUrl } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required from Google account" });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      const userCount = await User.countDocuments();
      const assignedRole = userCount === 0 ? "admin" : "student";

      const dummyHash = await bcrypt.hash(Math.random().toString(36), 10);

      user = new User({
        name: name || email.split("@")[0],
        email,
        passwordHash: dummyHash,
        role: assignedRole,
        avatarUrl: avatarUrl || "",
        status: "active",
      });

      await user.save();
    } else {
      // Keep a previously uploaded avatar instead of replacing it on Google login.
      if (avatarUrl && !user.avatarUrl) {
        user.avatarUrl = avatarUrl;
        await user.save();
      }
    }

    if (user.status === "blocked") {
      return res.status(403).json({ message: "Tài khoản của bạn đã bị khoá" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      message: "Đăng nhập Google thành công",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        avatarUrl: user.avatarUrl || "",
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi xử lý đăng nhập Google", error: error.message });
  }
};

