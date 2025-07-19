const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use('/api/questions', require('./routes/questionRoutes'));

app.get('/api/health', async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    res.json({ status: 'ok', db: 'connected' });
  } catch (e) {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

app.get('/', (req, res) => {
  res.send('Backend is running! Use the frontend to play the game.');
});

module.exports = app; 