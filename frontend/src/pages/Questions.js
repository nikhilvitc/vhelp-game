import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import socket from '../socket';

function OopsModal({ onRetry }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 text-center animate-bounce">
        <div className="text-5xl mb-2">😅</div>
        <h2 className="text-2xl font-bold text-red-600">Oops! Better luck next time!</h2>
        <button
          onClick={onRetry}
          className="mt-6 px-6 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}

export default function Questions() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState(state?.questions || []);
  const [gameId, setGameId] = useState(state?.gameId || null);
  const [lobbyCode, setLobbyCode] = useState(state?.code || '');

  const [question, setQuestion] = useState(null);
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const [timer, setTimer] = useState(20);
  const timerRef = useRef();

  const [waiting, setWaiting] = useState(!state?.questions);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [showOops, setShowOops] = useState(false);

  // Socket listeners
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
      if (code) setLobbyCode(code);
      setWaiting(false);
    });

    socket.on('question', ({ question, index }) => {
      setQuestion(question);
      setIndex(index);
      setAnswered(false);
      setSelectedAnswer(null);
      setTimer(20);
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

  // Timer countdown
  useEffect(() => {
    if (!answered && question) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setAnswered(true);
            setWaitingForOpponent(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [question, answered]);

  // Display first question if not set
  useEffect(() => {
    if (questions.length && gameId && !question) {
      setQuestion(questions[0]);
      setIndex(0);
      setAnswered(false);
      setTimer(20);
    }
  }, [questions, gameId, question]);

  const handleAnswer = (ansIndex) => {
    if (answered) return;
    setSelectedAnswer(ansIndex);
    setAnswered(true);
    setWaitingForOpponent(true);
    socket.emit('question_answered', { gameId, answer: ansIndex });
  };

  if (showOops) return <OopsModal onRetry={() => navigate('/')} />;
  if (waiting) return <div className="text-center mt-10 text-xl">🔍 Waiting for your partner...</div>;
  if (!question) return <div className="text-center mt-10 text-xl">⏳ Loading question...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 flex items-center justify-center px-4 py-10 relative">
      {/* Home Button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 right-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full px-3 py-1 text-sm font-semibold shadow z-10"
      >
        🏠 Home
      </button>
      <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-2xl text-center relative">
        <div className="absolute top-2 right-4 text-xs text-gray-400 font-mono">
          Lobby: {(lobbyCode || (gameId || '').slice(0, 6)).toUpperCase()}
        </div>

        <div className="text-sm text-gray-700 mb-2">Question {index + 1} of {questions.length}</div>

        <h2 className="text-lg font-semibold text-black mb-6">{question.question}</h2>

        <div className="flex flex-col gap-4">
          {[question.optionA, question.optionB].map((option, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={answered}
              className={`py-2 px-4 rounded-lg text-lg font-medium transition-all duration-300 shadow 
                ${
                  answered
                    ? selectedAnswer === i
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-300 text-gray-500'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Time left: <span className="font-bold text-blue-600">{timer}s</span>
        </div>

        {answered && waitingForOpponent && (
          <div className="mt-2 text-blue-700 font-semibold animate-pulse">Waiting for your opponent...</div>
        )}
      </div>
    </div>
  );
}
