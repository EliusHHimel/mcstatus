import './App.css';
import { useEffect, useState } from 'react';

function App() {
  const [serverStatus, setServerStatus] = useState(null);
  useEffect(() => {
    fetch('https://api.mcstatus.io/v2/status/java/20.188.117.254')
      .then(response => response.json())
      .then(data => setServerStatus(data));
  }, []);
  console.log(serverStatus);

  return (
    <div className="App">
      <h1 style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }
      }> <img width="100" height="100" src="https://img.icons8.com/plasticine/100/minecraft-grass-cube--v2.png" alt="minecraft-grass-cube--v2" /> Minecraft Server Status</h1>

      <div className="status-only">
        <p><img width="48" height="48" src="https://img.icons8.com/color-glass/48/ip-address.png" alt="ip-address" /> Server IP: {serverStatus?.ip_address}</p>
        <p><img width="48" height="48" src="https://img.icons8.com/color-glass/48/connection-status-on.png" alt="connection-status-on" /> Server Status: <span style={serverStatus?.online ? { color: 'lightseagreen' } : { color: 'red' }}>{serverStatus?.online ? 'Online' : 'Offline'}</span></p>
      </div>
      {
        serverStatus?.online &&
        <div className='detailed-info'>
          <p><img width="64" height="64" src="https://img.icons8.com/external-itim2101-flat-itim2101/64/external-gamer-blogger-and-influencer-itim2101-flat-itim2101.png" alt="external-gamer-blogger-and-influencer-itim2101-flat-itim2101" /> Players Online: {serverStatus?.players?.online}</p>
          <p>Players Max: {serverStatus?.players?.max}</p>
          <p>Server Version: {serverStatus?.version.name_clean}</p>
          <p>Server Port: {serverStatus?.port}</p>
          <p>Server MOTD: {serverStatus?.motd.clean}</p>
        </div>
      }
    </div>
  );
}

export default App;
