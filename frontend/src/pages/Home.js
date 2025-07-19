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
      <h1>1v1 Compatibility Game</h1>
      <label>
        <input
          type="checkbox"
          checked={anonymous}
          onChange={() => setAnonymous(!anonymous)}
        />
        Stay Anonymous
      </label>
      {!anonymous && (
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ marginLeft: 10 }}
        />
      )}
      <br /><br />
      <button onClick={handleStart}>Find a Match</button>
    </div>
  );
} 