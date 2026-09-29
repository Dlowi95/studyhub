const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const cloudinary = require("../config/cloudinary");

const avatarDir = path.join(__dirname, "..", "uploads", "avatars");

const saveLocalAvatar = async (file, req) => {
  fs.mkdirSync(avatarDir, { recursive: true });
  const ext = path.extname(file.originalname || "") || ".png";
  const safeName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
  const filePath = path.join(avatarDir, safeName);
  await fs.promises.writeFile(filePath, file.buffer);
  const baseUrl = process.env.BASE_URL || (req ? `${req.protocol}://${req.get("host")}` : `http://localhost:${process.env.PORT || 5000}`);
  return `${baseUrl}/uploads/avatars/${encodeURIComponent(safeName)}`;
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
      { expiresIn: "7d" }
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
      { expiresIn: "7d" }
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
          avatarUrl = await saveLocalAvatar(req.file, req);
        }
      } else {
        avatarUrl = await saveLocalAvatar(req.file, req);
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
    const { token, accessToken, credential, idToken } = req.body;
    const googleAuthToken = accessToken || token || credential || idToken;

    if (!googleAuthToken) {
      return res.status(400).json({ message: "Thiếu token xác thực Google" });
    }

    let verifiedEmail = "";
    let verifiedName = "";
    let verifiedPicture = "";

    // 1. Xác thực Google OAuth2 Access Token hoặc ID Token với Google APIs
    try {
      if (credential || idToken) {
        // Xác thực Google ID Token
        const verifyRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential || idToken)}`
        );
        if (!verifyRes.ok) {
          throw new Error("ID Token Google không hợp lệ");
        }
        const payload = await verifyRes.json();
        verifiedEmail = payload.email;
        verifiedName = payload.name;
        verifiedPicture = payload.picture;
      } else {
        // Xác thực Google Access Token qua UserInfo endpoint
        const verifyRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${googleAuthToken}` },
        });
        if (!verifyRes.ok) {
          throw new Error("Access Token Google không hợp lệ hoặc đã hết hạn");
        }
        const profile = await verifyRes.json();
        verifiedEmail = profile.email;
        verifiedName = profile.name || profile.given_name;
        verifiedPicture = profile.picture;
      }
    } catch (verifyErr) {
      return res.status(401).json({
        message: "Xác thực tài khoản Google thất bại: " + verifyErr.message,
      });
    }

    if (!verifiedEmail) {
      return res.status(400).json({ message: "Không tìm thấy email từ tài khoản Google được xác thực" });
    }

    const email = verifiedEmail.toLowerCase().trim();
    const name = (verifiedName || req.body.name || email.split("@")[0]).trim();
    const avatarUrl = verifiedPicture || req.body.avatarUrl || "";

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      const userCount = await User.countDocuments();
      const assignedRole = userCount === 0 ? "admin" : "student";

      const dummyHash = await bcrypt.hash(Math.random().toString(36), 10);

      user = new User({
        name,
        email,
        passwordHash: dummyHash,
        role: assignedRole,
        avatarUrl,
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

    const appToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Đăng nhập Google thành công",
      token: appToken,
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

