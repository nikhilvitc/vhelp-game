const express = require('express');
const seedDB = require('../seedDB');
const router = express.Router();

router.get('/seed', async (req, res) => {
  await seedDB();
  res.send("Database seeded with fresh questions.");
});

module.exports = router; 