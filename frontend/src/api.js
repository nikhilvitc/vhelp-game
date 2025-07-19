import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL || 'https://vhelp-game.onrender.com/api';
export const getRandomQuestions = async () => {
  const res = await axios.get(`${API_URL}/questions/random?count=5`);
  return res.data;
}; 