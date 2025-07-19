const mongoose = require('mongoose');
const UserSessionSchema = new mongoose.Schema({
  socketId: String,
  name: String,
  anonymous: Boolean,
  answers: [String]
}, { timestamps: true });
module.exports = mongoose.model('UserSession', UserSessionSchema); 