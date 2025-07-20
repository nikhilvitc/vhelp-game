const Question = require('../models/Question');

const questions = [
  { question: "Netflix or YouTube binge?", optionA: "Netflix", optionB: "YouTube" },
  { question: "Cricket or Football?", optionA: "Cricket", optionB: "Football" },
  { question: "Group study or solo grind?", optionA: "Group", optionB: "Solo" },
  { question: "Front row or back bench?", optionA: "Front", optionB: "Back" },
  { question: "Have you bunked classes?", optionA: "Too many!", optionB: "Never!" },
  // ✅ ADD all your remaining questions here...
];

const seedDB = async () => {
  try {
    await Question.deleteMany({});
    await Question.insertMany(questions);
    console.log("Database seeded successfully.");
  } catch (err) {
    console.error("Error seeding DB:", err);
  }
};

module.exports = seedDB;
