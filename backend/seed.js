const mongoose = require('mongoose');
const Question = require('./models/Question');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const questions = [
  { question: "Pineapple on pizza?", optionA: "Yes, love it!", optionB: "No way!" },
  { question: "Cats or dogs?", optionA: "Cats", optionB: "Dogs" },
  { question: "Early bird or night owl?", optionA: "Early bird", optionB: "Night owl" },
  { question: "Coffee or tea?", optionA: "Coffee", optionB: "Tea" },
  { question: "Beach or mountains?", optionA: "Beach", optionB: "Mountains" },
  { question: "Read a book or watch a movie?", optionA: "Read a book", optionB: "Watch a movie" },
  { question: "Summer or winter?", optionA: "Summer", optionB: "Winter" },
  { question: "Introvert or extrovert?", optionA: "Introvert", optionB: "Extrovert" },
  { question: "Travel by plane or train?", optionA: "Plane", optionB: "Train" },
  { question: "Sweet or savory?", optionA: "Sweet", optionB: "Savory" }
];

Question.insertMany(questions)
  .then(() => {
    console.log('Questions seeded!');
    mongoose.disconnect();
  })
  .catch(err => {
    console.error(err);
    mongoose.disconnect();
  }); 