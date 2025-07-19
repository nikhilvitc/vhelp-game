import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import socket from '../socket';

function OopsModal({ onRetry }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center">
        <div className="text-4xl mb-2">😅</div>
        <h2 className="text-2xl font-bold mb-2 text-red-600">Oops, better luck next time!</h2>
        <button onClick={onRetry} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded shadow">Go Home</button>
      </div>
    </div>
  );
}

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
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [showOops, setShowOops] = useState(false);
  const timerRef = useRef();
  const navigate = useNavigate();
  const [lobbyCode, setLobbyCode] = useState(state?.code || '');

  useEffect(() => {
    if (state?.questions && state?.gameId) {
      setQuestions(state.questions);
      setGameId(state.gameId);
      setWaiting(false);
      if (state.code) setLobbyCode(state.code);
    }
    socket.on('start_questions', ({ questions, gameId, code }) => {
      setQuestions(questions);
      setGameId(gameId);
      setWaiting(false);
      if (code) setLobbyCode(code);
    });
    socket.on('question', ({ question, index }) => {
      setQuestion(question);
      setIndex(index);
      setAnswered(false);
      setTimer(20);
      setWaiting(false);
    });
    socket.on('end_game', () => {
      setShowOops(true);
      setWaitingForOpponent(false);
      setTimeout(() => navigate('/'), 3000);
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
    setWaitingForOpponent(true);
    socket.emit('question_answered', { gameId, answer: ans });
  };

  if (showOops) return <OopsModal onRetry={() => navigate('/')} />;
  if (waiting) return <div className="text-center mt-10">Waiting for your partner...</div>;
  if (!question) return <div className="text-center mt-10">Loading question...</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-blue-100 py-10 px-4">
      <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center relative">
        <div className="absolute top-2 right-4 text-xs text-gray-400 font-mono">Lobby: {(lobbyCode || (gameId || '').slice(0, 6)).toUpperCase()}</div>
        <div className="mb-2 text-sm text-gray-700">Question {index + 1} / {questions.length}</div>
        <div className="mb-4 text-lg font-bold text-black text-center">{question.question}</div>
        <div className="flex flex-col gap-3 w-full mb-4">
          {[question.optionA, question.optionB].map((opt, i) => (
            <button
              key={i}
              className={`w-full py-2 rounded text-lg font-semibold shadow transition-colors ${answered ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
              onClick={() => handleAnswer(i)}
              disabled={answered}
            >
              {opt}
            </button>
          ))}
        </div>
        {answered && waitingForOpponent && (
          <div className="text-center text-blue-600 font-medium mt-2">Waiting for your opponent...</div>
        )}
        <div className="text-sm text-gray-600 mt-2">Time left: {timer}s</div>
      </div>
    </div>
  );
} 