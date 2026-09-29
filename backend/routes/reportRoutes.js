const express = require('express');
const router = express.Router();

const {
  createReport,
  checkReportStatus,
  getMyReports,
  getAllReports,
  updateReportStatus,
  deleteReport,
} = require('../controllers/reportController');

const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.post('/reports', authenticateToken, createReport);
router.get('/reports/check/:documentId', authenticateToken, checkReportStatus);
router.get('/reports/my', authenticateToken, getMyReports);
router.get('/reports', authenticateToken, authorizeRoles('admin', 'moderator'), getAllReports);
router.put('/reports/:id/status', authenticateToken, authorizeRoles('admin', 'moderator'), updateReportStatus);
router.delete('/reports/:id', authenticateToken, authorizeRoles('admin'), deleteReport);

module.exports = router;
