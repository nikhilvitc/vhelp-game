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

  if (timer <= 0) return <div className="text-center mt-20 text-xl font-bold text-accent">Chat ended!</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white py-10 px-4">
      <div className="max-w-md w-full mx-auto bg-white rounded shadow p-6 flex flex-col items-center">
        <div className="mb-2 text-sm text-gray-700">Time left: {timer}s</div>
        <div className="w-full flex-1 mb-4 overflow-y-auto" style={{ maxHeight: 200 }}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`mb-1 text-sm ${msg.from === 'me' ? 'text-blue-700 text-right' : 'text-gray-800 text-left'}`}>{msg.message}</div>
          ))}
        </div>
        <div className="flex w-full gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            maxLength={20}
            className="flex-1 px-2 py-1 border rounded"
            disabled={timer <= 0}
            onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
          />
          <button onClick={sendMessage} className="px-4 py-1 bg-blue-500 text-white rounded" disabled={timer <= 0}>Send</button>
        </div>
      </div>
    </div>
  );
} 