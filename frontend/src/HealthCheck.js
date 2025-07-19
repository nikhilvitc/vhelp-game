import React, { useEffect, useState } from 'react';
import axios from 'axios';

function HealthCheck() {
  const [status, setStatus] = useState('Checking...');

  useEffect(() => {
    const apiUrl = (process.env.REACT_APP_API_URL || 'https://vhelp-game.onrender.com/api').replace(/\/api$/, '') + '/api/health';
    axios.get(apiUrl)
      .then(res => {
        if (res.data.status === 'ok' && res.data.db === 'connected') {
          setStatus('✅ Backend & Database Connected');
          console.log('Backend and database are connected!');
        } else {
          setStatus('❌ Backend or Database Disconnected');
          console.log('Backend or database are disconnected!');
        }
      })
      .catch(() => {
        setStatus('❌ Backend or Database Disconnected');
        console.log('Backend or database are disconnected!');
      });
  }, []);

  return <div style={{textAlign: 'center', margin: 10, color: '#888'}}>{status}</div>;
}

export default HealthCheck; 