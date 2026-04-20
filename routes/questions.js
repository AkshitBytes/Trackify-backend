const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  updateStatus,
  reorderQuestions,
  questionValidation,
} = require('../controllers/questionController');

// All routes require authentication
router.use(auth);

router.get('/', getQuestions);
router.post('/', questionValidation, createQuestion);
router.put('/:id', updateQuestion);
router.delete('/:id', deleteQuestion);
router.patch('/:id/status', updateStatus);
router.patch('/reorder', reorderQuestions);

module.exports = router;
