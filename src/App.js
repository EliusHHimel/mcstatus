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
          <p><img width="48" height="48" src="https://img.icons8.com/fluency/48/minecraft-pickaxe.png" alt="minecraft-pickaxe" /> Players Online: {serverStatus?.players?.online}/{serverStatus.players.max}</p>
          <p><img width="48" height="48" src="https://img.icons8.com/stickers/48/minecraft-folder.png" alt="minecraft-folder" /> Server Version: {serverStatus?.version.name_clean}</p>
          <p><img width="48" height="48" src="https://img.icons8.com/plasticine/100/minecraft-forge.png" alt="minecraft-forge" />Server Port: {serverStatus?.port}</p>
          <p><img width="48" height="48" src="https://img.icons8.com/color/48/minecraft-golden-apple.png" alt="minecraft-golden-apple" /> Server MOTD: {serverStatus?.motd.clean}</p>
        </div>
      }
    </div>
  );
}

export default App;
