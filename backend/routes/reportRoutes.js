const express = require('express');
const router = express.Router();

const {
  createReport,
  getMyReports,
  getAllReports,
  updateReportStatus,
} = require('../controllers/reportController');

const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.post('/reports', authenticateToken, createReport);
router.get('/reports/my', authenticateToken, getMyReports);
router.get('/reports', authenticateToken, authorizeRoles('admin'), getAllReports);
router.put('/reports/:id/status', authenticateToken, authorizeRoles('admin'), updateReportStatus);

module.exports = router;
