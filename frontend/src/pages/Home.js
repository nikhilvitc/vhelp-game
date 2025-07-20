import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../socket';

export default function Home() {
  const [anonymous, setAnonymous] = useState(true);
  const [name, setName] = useState('');
  const [lobbyMode, setLobbyMode] = useState(null);
  const [lobbyCode, setLobbyCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState('');
  const [lobbyReady, setLobbyReady] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [joinedUser, setJoinedUser] = useState(null);
  const navigate = useNavigate();
  const homeRef = useRef();

  const handleStart = () => {
    navigate('/match', { state: { anonymous, name } });
  };

  const handleCreateLobby = () => {
    setError('');
    setLobbyMode('create');
    setWaiting(true);
    setIsCreator(true);
    socket.emit('create_lobby', { name, anonymous }, ({ code }) => {
      setLobbyCode(code);
      localStorage.setItem('lobbyCode', code);
      setWaiting(false);
    });
  };

  const handleJoinLobby = () => {
    setError('');
    setLobbyMode('join');
    setIsCreator(false);
  };

  const handleJoinSubmit = () => {
    setError('');
    setWaiting(true);
    socket.emit('join_lobby', { code: inputCode.trim().toUpperCase(), userData: { name, anonymous } }, (res) => {
      setWaiting(false);
      if (res && res.error) setError(res.error);
      else {
        setLobbyCode(inputCode.trim().toUpperCase());
        localStorage.setItem('lobbyCode', inputCode.trim().toUpperCase());
      }
    });
  };

  const handleStartLobbyGame = () => {
    socket.emit('start_lobby_game', { code: lobbyCode });
  };

  // Home reset function
  const resetHome = () => {
    setAnonymous(true);
    setName('');
    setLobbyMode(null);
    setLobbyCode('');
    localStorage.removeItem('lobbyCode');
    setInputCode('');
    setWaiting(false);
    setError('');
    setLobbyReady(false);
    setIsCreator(false);
    setJoinedUser(null);
    navigate('/', { replace: true });
  };

  useEffect(() => {
    // Listen for lobby_ready only once
    const onLobbyReady = (data) => {
      setLobbyReady(true);
      if (data && data.userData && data.userData.length > 1) {
        setJoinedUser(data.userData[1]);
      }
    };
    socket.on('lobby_ready', onLobbyReady);
    return () => {
      socket.off('lobby_ready', onLobbyReady);
    };
  }, []);

  useEffect(() => {
    // Listen for start_questions for both quick match and lobby
    const onStartQuestions = ({ questions, gameId, myName, myAnonymous, opponentName, opponentAnonymous }) => {
      console.log('Received start_questions in Home.js', { questions, gameId, myName, myAnonymous, opponentName, opponentAnonymous });
      setLobbyMode(null);
      setLobbyCode('');
      setLobbyReady(false);
      setJoinedUser(null);
      console.log('Navigating to /questions');
      navigate('/questions', { state: { anonymous, name, questions, gameId, myName, myAnonymous, opponentName, opponentAnonymous } });
    };
    socket.on('start_questions', onStartQuestions);
    return () => {
      socket.off('start_questions', onStartQuestions);
    };
  }, [navigate, name, anonymous]);

  // Rejoin lobby on mount if lobbyCode is present
  useEffect(() => {
    const code = lobbyCode || localStorage.getItem('lobbyCode');
    if (code) {
      socket.emit('rejoin_lobby', { code, userData: { name, anonymous } });
    }
  }, [lobbyCode, name, anonymous]);

  // Force browser back to go to home
  useEffect(() => {
    const handlePopState = (e) => {
      navigate('/', { replace: true });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

  return (
    <div ref={homeRef} className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-400 to-purple-500 px-4 py-10 relative overflow-hidden">
      {/* Home Button */}
      <button
        onClick={resetHome}
        className="absolute top-4 right-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full px-3 py-1 text-sm font-semibold shadow z-10"
      >
        🏠 Home
      </button>
      {/* Blur Overlay with Spinner */}
      {waiting && (
        <div className="absolute inset-0 bg-white bg-opacity-60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-700 font-semibold">Please wait... Connecting to the server</p>
        </div>
      )}

      <div className={`bg-white rounded-3xl shadow-xl p-8 w-full max-w-md text-center transition duration-300 ease-in-out ${waiting ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
        <div className="text-4xl mb-3">🎮</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">1v1 Compatibility Game</h1>
        <p className="text-gray-600 mb-6">Find your perfect match by answering 5 fun questions!</p>

        <div className="flex items-center justify-center gap-2 mb-4">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={() => setAnonymous(!anonymous)}
            className="w-5 h-5 accent-blue-600"
          />
          <label className="text-gray-700 font-medium text-sm">Anonymous</label>
        </div>

        {!anonymous && (
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-4 w-full px-3 py-2 border rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        )}

        {!lobbyMode && (
          <div className="flex flex-col gap-3">
            <button onClick={handleStart} className="bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-full font-semibold transition">
              Quick Match
            </button>
            <button onClick={handleCreateLobby} className="bg-pink-500 hover:bg-pink-600 text-white py-2 rounded-full font-semibold transition">
              Create Lobby
            </button>
            <button onClick={handleJoinLobby} className="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-full font-semibold transition">
              Join Lobby
            </button>
          </div>
        )}

        {lobbyMode === 'create' && (
          <div className="mt-6">
            <p className="text-gray-700 text-sm">Your Lobby Code:</p>
            <p className="text-xl font-mono font-bold text-blue-700 mb-2">{lobbyCode || '...'}</p>
            {!lobbyReady && <p className="text-sm text-gray-500">Waiting for another player to join...</p>}
            {lobbyReady && isCreator && (
              <>
                <button onClick={handleStartLobbyGame} className="mt-3 bg-blue-700 hover:bg-blue-800 text-white py-2 px-6 rounded-full font-semibold">
                  Start Now
                </button>
                {joinedUser && (
                  <div className="mt-2 text-green-700 text-sm font-semibold">
                    Joined: {joinedUser.anonymous ? 'Anonymous' : (joinedUser.name || 'Anonymous')}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {lobbyMode === 'join' && (
          <div className="mt-6 space-y-3">
            <input
              type="text"
              placeholder="Enter Lobby Code"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-center uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button onClick={handleJoinSubmit} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-full font-semibold transition">
              Join
            </button>
            {lobbyCode && (
              <p className="text-sm text-gray-700 mt-2">
                Joined lobby <strong>{lobbyCode}</strong>. Waiting for another player...
              </p>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-600 mt-4">❌ {error}</p>}
      </div>
    </div>
  );
}
