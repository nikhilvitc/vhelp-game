import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import socket from '../socket';

export default function Match() {
  const { state } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    socket.emit('find_match', state);

    socket.on('match_found', ({ opponent }) => {
      navigate('/questions', { state: { ...state, opponent } });
    });

    return () => {
      socket.off('match_found');
    };
  }, [state, navigate]);

  return (
    <div style={{ textAlign: 'center', marginTop: 100 }}>
      <h2>Looking for a match...</h2>
    </div>
  );
} 