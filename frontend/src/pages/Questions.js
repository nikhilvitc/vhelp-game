import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import socket from '../socket';

export default function Questions() {
  const { state } = useLocation();
  const [questions, setQuestions] = useState(state?.questions || []);
  const [gameId, setGameId] = useState(state?.gameId || null);
  const [question, setQuestion] = useState(null);
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [timer, setTimer] = useState(20);
  const [waiting, setWaiting] = useState(!state?.questions);
  const [oops, setOops] = useState(false);
  const timerRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    if (state?.questions && state?.gameId) {
      setQuestions(state.questions);
      setGameId(state.gameId);
      setWaiting(false);
    }
    socket.on('start_questions', ({ questions, gameId }) => {
      setQuestions(questions);
      setGameId(gameId);
      setWaiting(false);
    });
    socket.on('question', ({ question, index }) => {
      setQuestion(question);
      setIndex(index);
      setAnswered(false);
      setTimer(20);
      setWaiting(false);
    });
    socket.on('end_game', () => {
      setOops(true);
      setTimeout(() => navigate('/'), 2000);
    });
    socket.on('all_matched', ({ opponentSocketId }) => {
      navigate('/chat', { state: { ...state, opponentSocketId } });
    });
    return () => {
      socket.off('start_questions');
      socket.off('question');
      socket.off('end_game');
      socket.off('all_matched');
    };
  }, [navigate, state]);

  useEffect(() => {
    if (!answered && question) {
      timerRef.current = setInterval(() => {
        setTimer(t => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            setAnswered(true);
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [question, answered]);

  // When questions and gameId are set, show the first question
  useEffect(() => {
    if (questions.length && gameId && !question) {
      setQuestion(questions[0]);
      setIndex(0);
      setAnswered(false);
      setTimer(20);
      setWaiting(false);
    }
  }, [questions, gameId, question]);

  const handleAnswer = (ans) => {
    if (answered) return;
    setAnswered(true);
    socket.emit('question_answered', { gameId, answer: ans });
  };

  if (oops) return <div style={{ textAlign: 'center', marginTop: 100, color: 'red', fontSize: 24 }}>Oops, better luck next time!</div>;
  if (waiting) return <div style={{ textAlign: 'center', marginTop: 100 }}>Waiting for your partner...</div>;
  if (!question) return <div style={{ textAlign: 'center', marginTop: 100 }}>Loading question...</div>;

  return (
    <div style={{ textAlign: 'center', marginTop: 100 }}>
      <h2>{question.question}</h2>
      <button
        onClick={() => handleAnswer('A')}
        disabled={answered}
        style={{ marginRight: 20 }}
      >
        {question.optionA}
      </button>
      <button
        onClick={() => handleAnswer('B')}
        disabled={answered}
      >
        {question.optionB}
      </button>
      <div style={{ marginTop: 20, fontSize: 18 }}>Time left: {timer}s</div>
      <div>Question {index + 1} of 5</div>
    </div>
  );
} 