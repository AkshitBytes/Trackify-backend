const { validationResult, body } = require('express-validator');
const Question = require('../models/Question');
const User = require('../models/User');

// Validation rules
const questionValidation = [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required (max 200 chars)'),
  body('topic').trim().isLength({ min: 1, max: 100 }).withMessage('Topic is required (max 100 chars)'),
  body('pattern').optional().trim().isLength({ max: 100 }).withMessage('Pattern max length is 100 chars'),
  body('difficulty').isIn(['Easy', 'Medium', 'Hard']).withMessage('Difficulty must be Easy, Medium, or Hard'),
];

// Helper: update user streak on activity
const updateStreak = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastActive = user.streak.lastActiveDate;

  if (lastActive) {
    const lastDate = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());
    const diffDays = Math.round((today - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      user.streak.current += 1;
      if (user.streak.current > user.streak.longest) {
        user.streak.longest = user.streak.current;
      }
    } else if (diffDays > 1) {
      user.streak.current = 1;
    }
    // diffDays === 0 means same day, no change
  } else {
    user.streak.current = 1;
  }

  user.streak.lastActiveDate = now;
  await user.save();
};

// GET /api/questions
const getQuestions = async (req, res) => {
  try {
    const { topic, pattern, status, difficulty, search, sortBy = 'createdAt', order = 'desc' } = req.query;

    const filter = { user: req.user.id };
    if (topic) filter.topic = topic;
    if (pattern) filter.pattern = pattern;
    if (status) filter.status = status;
    if (difficulty) filter.difficulty = difficulty;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
        { pattern: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const questions = await Question.find(filter)
      .sort({ [sortBy]: sortOrder })
      .lean();

    res.json({ questions });
  } catch (error) {
    console.error('GetQuestions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/questions
const createQuestion = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { title, topic, pattern, difficulty, status, link, notes } = req.body;

    // Get the max order for this user to append at end
    const maxOrder = await Question.findOne({ user: req.user.id })
      .sort({ order: -1 })
      .select('order')
      .lean();

    const question = await Question.create({
      user: req.user.id,
      title,
      topic,
      pattern: pattern?.trim() || 'General',
      difficulty,
      status: status || 'todo',
      link: link || '',
      notes: notes || '',
      order: (maxOrder?.order ?? -1) + 1,
    });

    await updateStreak(req.user.id);

    res.status(201).json({ question });
  } catch (error) {
    console.error('CreateQuestion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/questions/:id
const updateQuestion = async (req, res) => {
  try {
    const question = await Question.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const { title, topic, pattern, difficulty, status, link, notes } = req.body;

    if (title !== undefined) question.title = title;
    if (topic !== undefined) question.topic = topic;
    if (pattern !== undefined) question.pattern = pattern?.trim() || 'General';
    if (difficulty !== undefined) question.difficulty = difficulty;
    if (link !== undefined) question.link = link;
    if (notes !== undefined) question.notes = notes;

    if (status !== undefined) {
      question.status = status;
      if (status === 'done') {
        question.completedAt = new Date();
      } else {
        question.completedAt = null;
      }
    }

    await question.save();
    await updateStreak(req.user.id);

    res.json({ question });
  } catch (error) {
    console.error('UpdateQuestion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/questions/:id
const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json({ message: 'Question deleted' });
  } catch (error) {
    console.error('DeleteQuestion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/questions/:id/status
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['todo', 'in-progress', 'done', 'revision'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const question = await Question.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    question.status = status;
    question.completedAt = status === 'done' ? new Date() : null;
    await question.save();

    await updateStreak(req.user.id);

    res.json({ question });
  } catch (error) {
    console.error('UpdateStatus error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/questions/reorder
const reorderQuestions = async (req, res) => {
  try {
    const { items } = req.body; // [{ id, order, status }]

    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'Items array is required' });
    }

    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: { _id: item.id, user: req.user.id },
        update: { $set: { order: item.order, status: item.status } },
      },
    }));

    await Question.bulkWrite(bulkOps);

    res.json({ message: 'Reordered successfully' });
  } catch (error) {
    console.error('Reorder error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  updateStatus,
  reorderQuestions,
  questionValidation,
};
