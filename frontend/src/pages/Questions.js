import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getRandomQuestions } from '../api';
import socket from '../socket';

export default function Questions() {
  const { state } = useLocation();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [current, setCurrent] = useState(0);
  const [waiting, setWaiting] = useState(false);
  const [matched, setMatched] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getRandomQuestions().then(setQuestions);
    socket.on('match_result', ({ matched }) => {
      setMatched(matched);
      if (matched) {
        setTimeout(() => {
          navigate('/chat', { state: { ...state, opponentSocketId: state.opponent.socketId } });
        }, 1000);
      }
    });
    return () => {
      socket.off('match_result');
    };
  }, [state, navigate]);

  const handleAnswer = (ans) => {
    const newAnswers = [...answers, ans];
    setAnswers(newAnswers);
    if (current === 4) {
      setWaiting(true);
      socket.emit('submit_answers', { answers: newAnswers, opponentSocketId: state.opponent.socketId });
    } else {
      setCurrent(current + 1);
    }
  };

  if (!questions.length) return <div>Loading questions...</div>;
  if (waiting) return <div>Waiting for your opponent...</div>;
  if (matched === false) return <div>No compatibility! Try again.</div>;

  const q = questions[current];
  return (
    <div style={{ textAlign: 'center', marginTop: 100 }}>
      <h2>{q.question}</h2>
      <button onClick={() => handleAnswer('A')}>{q.optionA}</button>
      <button onClick={() => handleAnswer('B')} style={{ marginLeft: 20 }}>{q.optionB}</button>
      <div>Question {current + 1} of 5</div>
    </div>
  );
} 