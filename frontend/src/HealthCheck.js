import React, { useEffect, useState } from 'react';
import axios from 'axios';

function HealthCheck() {
  const [live, setLive] = useState(false);

  useEffect(() => {
    const apiUrl = (process.env.REACT_APP_API_URL || 'https://vhelp-game.onrender.com/api')
      .replace(/\/api$/, '') + '/api/health';

    axios.get(apiUrl)
      .then(res => {
        if (res.data.status === 'ok' && res.data.db === 'connected') {
          setLive(true);
        }
      })
      .catch(() => {
        setLive(false); // Do nothing on failure
      });
  }, []);

  return (
    <>
      {live && (
  <div className="fixed top-2 left-2 text-green-600 text-lg font-bold bg-white/20 backdrop-blur px-5 py-2 rounded-full shadow-md z-50">
    🟢 Live
  </div>
)}

    </>
  );
}

export default HealthCheck;
