const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Question title is required'],
    trim: true,
    maxlength: 200,
  },
  topic: {
    type: String,
    required: [true, 'Topic is required'],
    trim: true,
    maxlength: 100,
  },
  pattern: {
    type: String,
    trim: true,
    default: 'General',
    maxlength: 100,
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium',
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'done', 'revision'],
    default: 'todo',
  },
  link: {
    type: String,
    trim: true,
    default: '',
  },
  notes: {
    type: String,
    trim: true,
    default: '',
    maxlength: 1000,
  },
  order: {
    type: Number,
    default: 0,
  },
  completedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Compound index for efficient queries
questionSchema.index({ user: 1, topic: 1 });
questionSchema.index({ user: 1, topic: 1, pattern: 1 });
questionSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Question', questionSchema);
