const Question = require('../models/Question');
exports.getRandomQuestions = async (req, res) => {
  const count = parseInt(req.query.count) || 5;
  const questions = await Question.aggregate([{ $sample: { size: count } }]);
  res.json(questions);
}; 