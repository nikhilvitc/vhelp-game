const express = require('express');
const router = express.Router();
const { getRandomQuestions } = require('../controllers/questionController');
router.get('/random', getRandomQuestions);
module.exports = router; 