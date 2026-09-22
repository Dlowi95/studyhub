const Notification = require('../models/Notification');

// GET /api/notifications
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ notifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi lấy thông báo' });
  }
};

// GET /api/notifications/unread-count
exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    res.json({ unreadCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi đếm thông báo chưa đọc' });
  }
};

// PATCH /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Không tìm thấy thông báo' });
    }

    res.json({ notification });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi cập nhật trạng thái thông báo' });
  }
};

// PATCH /api/notifications/read-all
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );

    res.json({ message: 'Đã đánh dấu tất cả thông báo là đã đọc' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server khi đánh dấu đã đọc tất cả' });
  }
};
