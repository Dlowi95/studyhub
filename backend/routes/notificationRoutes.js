const express = require('express');
const router = express.Router();

const {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} = require('../controllers/notificationController');

const { authenticateToken } = require('../middleware/auth');

router.get('/notifications', authenticateToken, getMyNotifications);
router.get('/notifications/unread-count', authenticateToken, getUnreadCount);
router.patch('/notifications/:id/read', authenticateToken, markAsRead);
router.patch('/notifications/read-all', authenticateToken, markAllAsRead);

module.exports = router;
