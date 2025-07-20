import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import socket from '../socket';

export default function Match() {
  const { state } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    socket.emit('find_match', state);

    socket.on('start_questions', ({ questions, gameId }) => {
      navigate('/questions', { state: { ...state, questions, gameId } });
    });

    return () => {
      socket.off('start_questions');
    };
  }, [state, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-200 via-pink-200 to-yellow-100">
      <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md w-full">
        <div className="animate-spin mx-auto mb-4 h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Looking for a match...</h2>
        <p className="text-gray-500 text-sm">Hang tight! We’re finding someone just like you 👀</p>
      </div>
    </div>
  );
}
