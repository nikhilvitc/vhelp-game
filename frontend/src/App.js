import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Match from './pages/Match';
import Questions from './pages/Questions';
import Chat from './pages/Chat';
import HealthCheck from './HealthCheck';
import socket from './socket';

function AppRoutes() {
  const navigate = useNavigate();

  useEffect(() => {
    const onStartQuestions = ({ questions, gameId, myName, myAnonymous, opponentName, opponentAnonymous }) => {
      // Pass all state needed for Questions page
      navigate('/questions', {
        state: { questions, gameId, myName, myAnonymous, opponentName, opponentAnonymous }
      });
    };
    socket.on('start_questions', onStartQuestions);
    return () => {
      socket.off('start_questions', onStartQuestions);
    };
  }, [navigate]);

  return (
    <>
      <HealthCheck />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/match" element={<Match />} />
        <Route path="/questions" element={<Questions />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
export default App; 