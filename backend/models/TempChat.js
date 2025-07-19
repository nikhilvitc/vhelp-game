const mongoose = require('mongoose');
const TempChatSchema = new mongoose.Schema({
  gameId: String,
  messages: [{ from: String, text: String, timestamp: Date }]
});
module.exports = mongoose.model('TempChat', TempChatSchema); 