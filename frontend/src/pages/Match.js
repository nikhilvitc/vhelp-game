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
    <div style={{ textAlign: 'center', marginTop: 100 }}>
      <h2>Looking for a match...</h2>
    </div>
  );
} 