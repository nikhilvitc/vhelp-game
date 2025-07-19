const mongoose = require('mongoose');
const QuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  optionA: { type: String, required: true },
  optionB: { type: String, required: true }
});
module.exports = mongoose.model('Question', QuestionSchema); 