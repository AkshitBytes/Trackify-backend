const Question = require('../models/Question');

// GET /api/stats
const getStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all questions for the user
    const questions = await Question.find({ user: userId }).lean();

    const total = questions.length;
    const done = questions.filter((q) => q.status === 'done').length;
    const inProgress = questions.filter((q) => q.status === 'in-progress').length;
    const todo = questions.filter((q) => q.status === 'todo').length;
    const revision = questions.filter((q) => q.status === 'revision').length;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const solvedToday = questions.filter((q) => {
      if (!q.completedAt) return false;
      return new Date(q.completedAt) >= todayStart;
    }).length;

    // Overall progress
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;

    // Topic-wise breakdown
    const topicMap = {};
    questions.forEach((q) => {
      if (!topicMap[q.topic]) {
        topicMap[q.topic] = { total: 0, done: 0, inProgress: 0, todo: 0, revision: 0 };
      }
      topicMap[q.topic].total += 1;
      topicMap[q.topic][q.status === 'in-progress' ? 'inProgress' : q.status] += 1;
    });

    const topicStats = Object.entries(topicMap).map(([topic, data]) => ({
      topic,
      ...data,
      progress: data.total > 0 ? Math.round((data.done / data.total) * 100) : 0,
    }));

    // Sort topics by total questions descending
    topicStats.sort((a, b) => b.total - a.total);

    // Difficulty breakdown
    const easy = questions.filter((q) => q.difficulty === 'Easy').length;
    const medium = questions.filter((q) => q.difficulty === 'Medium').length;
    const hard = questions.filter((q) => q.difficulty === 'Hard').length;

    const easyDone = questions.filter((q) => q.difficulty === 'Easy' && q.status === 'done').length;
    const mediumDone = questions.filter((q) => q.difficulty === 'Medium' && q.status === 'done').length;
    const hardDone = questions.filter((q) => q.difficulty === 'Hard' && q.status === 'done').length;

    res.json({
      overview: { total, done, solvedToday, inProgress, todo, revision, progress },
      topicStats,
      difficultyStats: {
        easy: { total: easy, done: easyDone },
        medium: { total: medium, done: mediumDone },
        hard: { total: hard, done: hardDone },
      },
    });
  } catch (error) {
    console.error('GetStats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getStats };
