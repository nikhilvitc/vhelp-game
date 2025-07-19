import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Match from './pages/Match';
import Questions from './pages/Questions';
import Chat from './pages/Chat';
import HealthCheck from './HealthCheck';

function App() {
  return (
    <Router>
      <HealthCheck />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/match" element={<Match />} />
        <Route path="/questions" element={<Questions />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </Router>
  );
}
export default App; 