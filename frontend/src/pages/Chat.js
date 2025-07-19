import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import socket from '../socket';

export default function Chat() {
  const { state } = useLocation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [timer, setTimer] = useState(180);
  const inputRef = useRef();
  const navigate = useNavigate();
  const gameId = state?.gameId;

  useEffect(() => {
    // Listen for incoming chat messages
    socket.on('chat_message', ({ message, from }) => {
      setMessages(msgs => [...msgs, { message, from }]);
    });

    // On refresh, request chat history (and delete from DB)
    if (gameId) {
      socket.emit('request_chat', { gameId });
      socket.on('chat_history', ({ messages }) => {
        setMessages(messages || []);
      });
    }

    const interval = setInterval(() => {
      setTimer(t => t - 1);
    }, 1000);

    return () => {
      socket.off('chat_message');
      socket.off('chat_history');
      clearInterval(interval);
    };
  }, [gameId]);

  const sendMessage = () => {
    if (input.trim() && input.length <= 20) {
      socket.emit('chat_message', {
        gameId,
        message: input,
        from: 'me',
        to: state.opponentSocketId
      });
      setMessages(msgs => [...msgs, { message: input, from: 'me' }]);
      setInput('');
    }
  };

  if (timer <= 0) return <div>Chat ended!</div>;

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', border: '1px solid #ccc', borderRadius: 8, padding: 20 }}>
      <div style={{ minHeight: 200, marginBottom: 10 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ textAlign: msg.from === 'me' ? 'right' : 'left' }}>
            <span style={{ background: '#f0f0f0', borderRadius: 4, padding: '2px 8px', display: 'inline-block', margin: '2px 0' }}>
              {msg.message}
            </span>
          </div>
        ))}
      </div>
      <div>
        <input
          ref={inputRef}
          value={input}
          maxLength={20}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          style={{ width: '80%' }}
          disabled={timer <= 0}
        />
        <button onClick={sendMessage} disabled={timer <= 0 || !input.trim()}>Send</button>
      </div>
      <div style={{ marginTop: 10, color: '#888' }}>
        Time left: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
      </div>
    </div>
  );
} 