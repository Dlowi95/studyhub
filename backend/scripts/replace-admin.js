// One-time, explicitly applied account replacement; does not change passwords.
require("dotenv").config({ quiet: true });
require("dns").setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
const mongoose = require("mongoose");
const User = require("../models/user");
const Document = require("../models/Document");
const Report = require("../models/report");
const Review = require("../models/review");
const Notification = require("../models/Notification");

async function main() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/studyhub", {
    serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000,
  });
  const targetEmail = "dailoivo23@gmail.com";
  const oldEmail = "admin@gmail.com";
  const apply = process.argv.includes("--apply");
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const target = await User.findOne({ email: targetEmail }).session(session);
      const old = await User.findOne({ email: oldEmail }).session(session);
      if (!target) throw new Error("Tài khoản đích chưa tồn tại; cần đăng ký trước khi chuyển quyền.");
      if (target.status !== "active") throw new Error("Tài khoản đích đang bị khóa.");
      result = { applied: apply, email: targetEmail, previousRole: target.role, oldAccountExists: Boolean(old) };
      if (!apply) return;
      target.role = "admin";
      await target.save({ session });
      if (old) {
        const targetReviews = await Review.find({ userId: target._id }).select("documentId").session(session).lean();
        const occupiedDocuments = targetReviews.map((review) => review.documentId);
        result.documents = (await Document.updateMany({ uploaderId: old._id }, { $set: { uploaderId: target._id } }, { session })).modifiedCount;
        await Report.updateMany({ reporterId: old._id }, { $set: { reporterId: target._id } }, { session });
        result.handledReports = (await Report.updateMany({ handledBy: old._id }, { $set: { handledBy: target._id } }, { session })).modifiedCount;
        // If both accounts reviewed one document, keep the old review's history
        // anonymous rather than overwrite the target's review or change its average.
        result.reviews = (await Review.updateMany({ userId: old._id, documentId: { $nin: occupiedDocuments } }, { $set: { userId: target._id } }, { session })).modifiedCount;
        result.anonymousReviews = await Review.countDocuments({ userId: old._id }).session(session);
        await Notification.deleteMany({ recipient: old._id }, { session });
        const removed = await User.deleteOne({ _id: old._id, email: oldEmail }, { session });
        if (removed.deletedCount !== 1) throw new Error("Tài khoản cũ đã thay đổi; hủy giao dịch.");
      }
    });
  } finally {
    await session.endSession();
  }
  const target = await User.findOne({ email: targetEmail }).select("email role status").lean();
  const oldExists = await User.exists({ email: oldEmail });
  if (apply && (target?.role !== "admin" || target?.status !== "active" || oldExists)) {
    throw new Error("Không đạt điều kiện xác minh sau chuyển quyền.");
  }
  console.log(JSON.stringify({ ...result, verified: { target, oldAccountExists: Boolean(oldExists) } }));
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
