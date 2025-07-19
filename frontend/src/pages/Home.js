import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../socket';

export default function Home() {
  const [anonymous, setAnonymous] = useState(true);
  const [name, setName] = useState('');
  const [lobbyMode, setLobbyMode] = useState(null); // 'create' | 'join' | null
  const [lobbyCode, setLobbyCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState('');
  const [lobbyReady, setLobbyReady] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const navigate = useNavigate();

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
      setWaiting(false);
    });
    socket.on('lobby_ready', () => {
      setLobbyReady(true);
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
      else setLobbyCode(inputCode.trim().toUpperCase());
    });
    socket.on('lobby_ready', () => {
      setLobbyReady(true);
    });
  };

  const handleStartLobbyGame = () => {
    socket.emit('start_lobby_game', { code: lobbyCode });
  };

  // Clean up listeners on unmount
  React.useEffect(() => {
    const onGameStarted = ({ questions, gameId }) => {
      setLobbyMode(null);
      setLobbyCode('');
      setLobbyReady(false);
      navigate('/questions', { state: { anonymous, name, questions, gameId } });
    };
    socket.on('lobby_game_started', onGameStarted);
    return () => {
      socket.off('lobby_ready');
      socket.off('lobby_game_started', onGameStarted);
    };
  }, [navigate, name, anonymous]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white py-10 px-4">
      <div className="max-w-md w-full mx-auto bg-white rounded shadow p-6 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-2">1v1 Compatibility Game</h1>
        <p className="text-base text-gray-700 mb-4 text-center">
          Find a partner and see how compatible you are! Answer 5 fun questions and chat if you match.
        </p>
        <div className="flex items-center gap-2 mb-4">
          <label className="text-sm">Anonymous</label>
          <input type="checkbox" checked={anonymous} onChange={() => setAnonymous(!anonymous)} />
        </div>
        {!anonymous && (
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="mb-4 px-2 py-1 border rounded w-full text-center"
          />
        )}
        {!lobbyMode && (
          <div className="flex flex-col gap-3 w-full mt-2">
            <button onClick={handleStart} className="w-full py-2 bg-blue-500 text-white rounded">Quick Match</button>
            <button onClick={handleCreateLobby} className="w-full py-2 bg-green-500 text-white rounded">Create Lobby</button>
            <button onClick={handleJoinLobby} className="w-full py-2 bg-gray-500 text-white rounded">Join Lobby</button>
          </div>
        )}
        {lobbyMode === 'create' && (
          <div className="mt-6 flex flex-col items-center w-full">
            <div className="text-base mb-2">Your Lobby Code:</div>
            <div className="text-xl font-mono font-bold text-blue-700 mb-2">{lobbyCode || '...'}</div>
            {!lobbyReady && <div className="text-sm text-gray-500 mb-2">Waiting for another player to join...</div>}
            {lobbyReady && isCreator && <button onClick={handleStartLobbyGame} className="w-full py-2 bg-blue-600 text-white rounded">Start Now</button>}
          </div>
        )}
        {lobbyMode === 'join' && (
          <div className="mt-6 flex flex-col items-center w-full">
            <input
              type="text"
              placeholder="Enter Lobby Code"
              value={inputCode}
              onChange={e => setInputCode(e.target.value)}
              className="text-lg px-2 py-1 border rounded w-full text-center mb-2"
            />
            <button onClick={handleJoinSubmit} className="w-full py-2 bg-blue-500 text-white rounded mb-2">Join</button>
            {lobbyCode && <div className="text-base text-gray-700 mb-2">Joined lobby <b>{lobbyCode}</b>. Waiting for another player...</div>}
          </div>
        )}
        {waiting && <div className="text-sm text-gray-500 mt-2">Please wait...</div>}
        {error && <div className="text-red-500 mt-2">{error}</div>}
      </div>
    </div>
  );
} 