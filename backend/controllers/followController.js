const mongoose = require("mongoose");
const Follow = require("../models/Follow");
const User = require("../models/user");

exports.getMyFollowSummary = async (req, res) => {
  try {
    const [followers, following] = await Promise.all([
      Follow.countDocuments({ followingId: req.user._id }),
      Follow.countDocuments({ followerId: req.user._id }),
    ]);
    return res.json({ followers, following });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Không thể tải thống kê theo dõi" });
  }
};

exports.getFollowStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.isObjectIdOrHexString(userId)) {
      return res.status(400).json({ message: "Mã người dùng không hợp lệ" });
    }
    const [target, following, followerCount] = await Promise.all([
      User.findOne({ _id: userId, status: "active" }).select("_id"),
      Follow.exists({ followerId: req.user._id, followingId: userId }),
      Follow.countDocuments({ followingId: userId }),
    ]);
    if (!target) return res.status(404).json({ message: "Không tìm thấy người dùng" });
    return res.json({ following: Boolean(following), followerCount });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Không thể tải trạng thái theo dõi" });
  }
};

exports.followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.isObjectIdOrHexString(userId)) {
      return res.status(400).json({ message: "Mã người dùng không hợp lệ" });
    }
    if (String(req.user._id) === String(userId)) {
      return res.status(400).json({ message: "Bạn không thể tự theo dõi mình" });
    }
    const target = await User.findOne({ _id: userId, status: "active" }).select("_id");
    if (!target) return res.status(404).json({ message: "Không tìm thấy người dùng" });

    await Follow.updateOne(
      { followerId: req.user._id, followingId: userId },
      { $setOnInsert: { followerId: req.user._id, followingId: userId } },
      { upsert: true }
    );
    const followerCount = await Follow.countDocuments({ followingId: userId });
    return res.json({ following: true, followerCount });
  } catch (error) {
    if (error.code === 11000) return res.json({ following: true });
    console.error(error);
    return res.status(500).json({ message: "Không thể theo dõi người dùng lúc này" });
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.isObjectIdOrHexString(userId)) {
      return res.status(400).json({ message: "Mã người dùng không hợp lệ" });
    }
    await Follow.deleteOne({ followerId: req.user._id, followingId: userId });
    const followerCount = await Follow.countDocuments({ followingId: userId });
    return res.json({ following: false, followerCount });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Không thể bỏ theo dõi người dùng lúc này" });
  }
};
