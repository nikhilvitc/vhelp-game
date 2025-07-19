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
    <div style={{ textAlign: 'center', marginTop: 100 }}>
      <h1 style={{ fontSize: 36, marginBottom: 10 }}>1v1 Compatibility Game</h1>
      <p style={{ fontSize: 18, color: '#666', marginBottom: 30 }}>
        Find a partner and see how compatible you are!<br />
        Answer 5 fun questions and chat if you match.
      </p>
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 16 }}>
          <input
            type="checkbox"
            checked={anonymous}
            onChange={() => setAnonymous(!anonymous)}
            style={{ marginRight: 8 }}
          />
          Stay Anonymous
        </label>
        {!anonymous && (
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ marginLeft: 10, padding: 6, fontSize: 16, borderRadius: 4, border: '1px solid #ccc' }}
          />
        )}
      </div>
      {!lobbyMode && (
        <>
          <button
            onClick={handleStart}
            style={{
              padding: '12px 32px',
              fontSize: 18,
              background: '#4f8cff',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              marginRight: 10
            }}
          >
            Find a Partner
          </button>
          <button
            onClick={handleCreateLobby}
            style={{
              padding: '12px 32px',
              fontSize: 18,
              background: '#34b233',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              marginRight: 10
            }}
          >
            Create Lobby
          </button>
          <button
            onClick={handleJoinLobby}
            style={{
              padding: '12px 32px',
              fontSize: 18,
              background: '#ffb300',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}
          >
            Join Lobby
          </button>
        </>
      )}
      {lobbyMode === 'create' && (
        <div style={{ marginTop: 30 }}>
          <h2>Your Lobby Code:</h2>
          <div style={{ fontSize: 32, fontWeight: 'bold', letterSpacing: 4, margin: 10 }}>{lobbyCode || '...'}</div>
          {!lobbyReady && <div>Waiting for another player to join...</div>}
          {lobbyReady && isCreator && <button onClick={handleStartLobbyGame} style={{ marginTop: 20, padding: '10px 30px', fontSize: 18 }}>Start Now</button>}
        </div>
      )}
      {lobbyMode === 'join' && (
        <div style={{ marginTop: 30 }}>
          <input
            type="text"
            placeholder="Enter Lobby Code"
            value={inputCode}
            onChange={e => setInputCode(e.target.value)}
            style={{ fontSize: 20, padding: 8, borderRadius: 4, border: '1px solid #ccc', letterSpacing: 2 }}
          />
          <button onClick={handleJoinSubmit} style={{ marginLeft: 10, padding: '10px 30px', fontSize: 18 }}>Join</button>
          {lobbyCode && <div style={{ marginTop: 20 }}>Joined lobby <b>{lobbyCode}</b>. Waiting for another player...</div>}
          {/* Only creator sees Start Now */}
        </div>
      )}
      {waiting && <div style={{ marginTop: 20 }}>Please wait...</div>}
      {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
    </div>
  );
} 