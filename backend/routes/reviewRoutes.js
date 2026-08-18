const express = require('express');
const router = express.Router();

const {
  createReview,
  getReviewsByDocument,
  deleteReview,
} = require('../controllers/reviewController');

const { authenticateToken } = require('../middleware/auth');

router.post('/documents/:documentId/reviews', authenticateToken, createReview);
router.get('/documents/:documentId/reviews', getReviewsByDocument); // public
router.delete('/reviews/:id', authenticateToken, deleteReview);

module.exports = router;
