import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import socket from '../socket';

export default function Chat() {
  const { state } = useLocation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [timer, setTimer] = useState(180);
  const [chatEnded, setChatEnded] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const gameId = state?.gameId;

  useEffect(() => {
    socket.on('chat_message', ({ message, from }) => {
      setMessages(msgs => [...msgs, { message, from }]);
    });

    if (gameId) {
      socket.emit('request_chat', { gameId });
      socket.on('chat_history', ({ messages }) => {
        setMessages(messages || []);
      });
    }

    const interval = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(interval);
          setChatEnded(true);
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      socket.off('chat_message');
      socket.off('chat_history');
      clearInterval(interval);
    };
  }, [gameId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const endChat = () => {
    setChatEnded(true);
    setTimer(0);
  };

  const playAgain = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100 py-10 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 flex flex-col">
        {!chatEnded && (
          <div className="text-sm text-gray-600 mb-3 text-center font-semibold">
            🕒 Time left: {timer}s
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-64 pr-2 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div className="flex flex-col items-start max-w-[70%]">
                <span className={`text-xs font-semibold ${msg.from === 'me' ? 'text-right text-blue-500' : 'text-left text-gray-600'}`}>
                  {msg.from === 'me' ? 'You' : 'Stranger'}
                </span>
                <div
                  className={`mt-1 px-4 py-2 text-sm rounded-lg shadow transition-all
                    ${msg.from === 'me'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-gray-200 text-gray-900 rounded-bl-none'
                    }`}
                >
                  {msg.message}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {!chatEnded ? (
          <>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                maxLength={20}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-300"
                disabled={timer <= 0}
                onKeyDown={e => {
                  if (e.key === 'Enter') sendMessage();
                }}
              />
              <button
                onClick={sendMessage}
                className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
                disabled={timer <= 0}
              >
                Send
              </button>
            </div>
            <button
              onClick={endChat}
              className="mt-1 w-full text-sm bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded-lg transition"
            >
              End Chat
            </button>
          </>
        ) : (
          <div className="text-center">
            <div className="text-xl font-bold text-red-600 mb-3">Chat Ended!</div>
            <button
              onClick={playAgain}
              className="px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition"
            >
              🔁 Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
