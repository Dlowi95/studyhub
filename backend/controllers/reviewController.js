const mongoose = require('mongoose');
const Review = require('../models/review');
const Document = require('../models/Document'); // do Thành viên 2 tạo
const ReviewReply = require('../models/ReviewReply');
const { notifyReviewComment, notifyReviewReply } = require('../utils/notificationService');

// Hàm nội bộ: tính lại avgRating cho 1 document sau khi review thay đổi
async function recalculateAvgRating(documentId) {
  const stats = await Review.aggregate([
    { $match: { documentId: new mongoose.Types.ObjectId(documentId) } },
    {
      $group: {
        _id: '$documentId',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  const avgRating = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;

  await Document.findByIdAndUpdate(documentId, { avgRating });
  return avgRating;
}

// POST /api/documents/:documentId/reviews
exports.createReview = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    if (!mongoose.isObjectIdOrHexString(documentId)) return res.status(400).json({ message: 'Mã tài liệu không hợp lệ' });
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Điểm đánh giá phải là số nguyên từ 1 đến 5' });
    }
    if (comment !== undefined && (typeof comment !== 'string' || comment.trim().length > 1000)) {
      return res.status(400).json({ message: 'Nhận xét tối đa 1.000 ký tự' });
    }

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
    }
    if (document.status !== 'approved') {
      return res.status(403).json({ message: 'Tài liệu chưa được kiểm duyệt' });
    }

    const review = await Review.create({
      documentId,
      userId,
      rating,
      comment: comment?.trim() || '',
    });

    const avgRating = await recalculateAvgRating(documentId);

    const populated = await review.populate('userId', 'name avatarUrl');
    if (populated.comment) {
      await notifyReviewComment(populated, document).catch((error) => {
        console.error('Không thể thông báo nhận xét mới:', error.message);
      });
    }

    res.status(201).json({ review: populated, avgRating });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Bạn đã đánh giá tài liệu này rồi' });
    }
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi tạo đánh giá' });
  }
};

// GET /api/documents/:documentId/reviews
exports.getReviewsByDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    if (!mongoose.isObjectIdOrHexString(documentId)) return res.status(400).json({ message: 'Mã tài liệu không hợp lệ' });

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
    }
    if (document.status !== 'approved') {
      return res.status(403).json({ message: 'Tài liệu chưa được kiểm duyệt' });
    }

    const reviewItems = await Review.find({ documentId })
      .populate('userId', 'name avatarUrl')
      .sort({ createdAt: -1 })
      .lean();

    const replies = reviewItems.length
      ? await ReviewReply.find({ reviewId: { $in: reviewItems.map((review) => review._id) } })
          .populate('userId', 'name avatarUrl')
          .populate('replyToUserId', 'name')
          .sort({ createdAt: 1 })
          .lean()
      : [];
    const repliesByReview = new Map();
    for (const reply of replies) {
      const key = String(reply.reviewId);
      const group = repliesByReview.get(key) || [];
      group.push(reply);
      repliesByReview.set(key, group);
    }
    const reviews = reviewItems.map((review) => ({ ...review, replies: repliesByReview.get(String(review._id)) || [] }));

    res.json({ reviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi lấy đánh giá' });
  }
};

// POST /api/reviews/:reviewId/replies
exports.createReviewReply = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const comment = req.body?.comment;
    if (!mongoose.isObjectIdOrHexString(reviewId)) return res.status(400).json({ message: 'Mã nhận xét không hợp lệ' });
    if (typeof comment !== 'string' || !comment.trim() || comment.trim().length > 1000) {
      return res.status(400).json({ message: 'Phản hồi cần có nội dung và tối đa 1.000 ký tự' });
    }
    const review = await Review.findById(reviewId).populate('userId', 'name avatarUrl');
    if (!review) return res.status(404).json({ message: 'Không tìm thấy nhận xét' });
    const document = await Document.findById(review.documentId);
    if (!document || document.status !== 'approved') return res.status(403).json({ message: 'Tài liệu không còn công khai' });
    const reply = await ReviewReply.create({
      reviewId,
      userId: req.user._id,
      replyToUserId: review.userId?._id || review.userId,
      comment: comment.trim(),
    });
    await reply.populate('userId', 'name avatarUrl');
    await reply.populate('replyToUserId', 'name');
    await notifyReviewReply(reply, review, document).catch((error) => {
      console.error('Không thể thông báo phản hồi mới:', error.message);
    });
    return res.status(201).json({ reply });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Không thể gửi phản hồi lúc này' });
  }
};

// DELETE /api/reviews/:id
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isObjectIdOrHexString(id)) return res.status(400).json({ message: 'Mã đánh giá không hợp lệ' });
    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ message: 'Không tìm thấy đánh giá' });
    }

    const isOwner = review.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Không có quyền xoá đánh giá này' });
    }

    const documentId = review.documentId;
    await review.deleteOne();
    await ReviewReply.deleteMany({ reviewId: review._id });
    const avgRating = await recalculateAvgRating(documentId);

    res.json({ message: 'Đã xoá đánh giá', avgRating });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi xoá đánh giá' });
  }
};
