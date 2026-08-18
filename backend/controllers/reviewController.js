const Review = require('../models/review');
const Document = require('../models/document'); // do Thành viên 2 tạo

// Hàm nội bộ: tính lại avgRating cho 1 document sau khi review thay đổi
async function recalculateAvgRating(documentId) {
  const stats = await Review.aggregate([
    { $match: { documentId } },
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

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating phải từ 1 đến 5' });
    }

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
    }

    const review = await Review.create({
      documentId,
      userId,
      rating,
      comment: comment || '',
    });

    const avgRating = await recalculateAvgRating(documentId);

    const populated = await review.populate('userId', 'name avatarUrl');

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

    const reviews = await Review.find({ documentId })
      .populate('userId', 'name avatarUrl')
      .sort({ createdAt: -1 });

    res.json({ reviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi lấy đánh giá' });
  }
};

// DELETE /api/reviews/:id
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
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
    const avgRating = await recalculateAvgRating(documentId);

    res.json({ message: 'Đã xoá đánh giá', avgRating });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi xoá đánh giá' });
  }
};
