import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [anonymous, setAnonymous] = useState(true);
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/match', { state: { anonymous, name } });
  };

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
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}
      >
        Find a Partner
      </button>
    </div>
  );
} 