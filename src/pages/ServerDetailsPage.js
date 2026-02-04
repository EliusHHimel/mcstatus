import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

function ServerDetailsPage() {
  const { ip } = useParams();
  const [serverData, setServerData] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    const loadServer = async () => {
      setStatus("loading");
      try {
        const statusResponse = await fetch(
          `https://api.mcstatus.io/v2/status/java/${ip}`,
        );

        const data = await statusResponse.json();
        if (!cancelled) {
          setServerData(data);
          setStatus("ready");
        }
      } catch (error) {
        if (!cancelled) {
          setStatus("error");
        }
      }
    };

    if (ip) {
      loadServer();
    }

    return () => {
      cancelled = true;
    };
  }, [ip]);

  const resolvedIp =
    serverData?.ip_address || serverData?.ip || serverData?.host || ip;

  const serverIcon =
    serverData?.icon ||
    serverData?.favicon ||
    serverData?.server?.icon ||
    serverData?.server?.favicon ||
    null;

  const playersList =
    serverData?.players?.list || serverData?.players?.sample || [];

  const getAvatarUrl = (player) => {
    const uuid = player?.id || player?.uuid;
    const name = player?.name_clean || player?.name;
    if (uuid) {
      return `https://mc-heads.net/avatar/${uuid}/64`;
    }
    if (name) {
      return `https://mc-heads.net/avatar/${name}/64`;
    }
    return null;
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Server Details</h1>
        <Link className="nav-link" to="/online">
          Back to Online Servers
        </Link>
      </div>

      <div className="panel">
        <div className="panel-meta">
          <span>Server IP: {resolvedIp}</span>
          <span>Status: {serverData?.online ? "Online" : "Offline"}</span>
          <span>
            Players: {serverData?.players?.online ?? 0}/
            {serverData?.players?.max ?? 0}
          </span>
        </div>
      </div>

      {status === "loading" && (
        <div className="empty-state">Loading server details...</div>
      )}

      {status === "error" && (
        <div className="empty-state">Unable to load server details.</div>
      )}

      {status === "ready" && (
        <div className="details-grid">
          <div className="details-card">
            <h2>Server Info</h2>
            <div className="server-hero">
              {serverIcon ? (
                <img
                  className="server-icon-large"
                  src={serverIcon}
                  alt={`${resolvedIp} icon`}
                />
              ) : (
                <div className="server-icon-placeholder">No Icon</div>
              )}
              <div>
                <div className="server-hero-title">{resolvedIp}</div>
                <div className="server-hero-subtitle">
                  {serverData?.version?.name_clean || "Unknown version"}
                </div>
              </div>
            </div>
            <p>Version: {serverData?.version?.name_clean || "Unknown"}</p>
            <p>Port: {serverData?.port ?? "N/A"}</p>
            <p>MOTD: {serverData?.motd?.clean || "N/A"}</p>
          </div>

          <div className="details-card">
            <h2>Players</h2>
            {playersList.length > 0 ? (
              <ul className="player-list">
                {playersList.map((player) => {
                  const avatarUrl = getAvatarUrl(player);
                  return (
                    <li
                      key={
                        player.id ||
                        player.uuid ||
                        player.name ||
                        player.name_clean
                      }
                      className="player-item"
                    >
                      {avatarUrl ? (
                        <img
                          className="player-avatar"
                          src={avatarUrl}
                          alt={player.name_clean || player.name || "Player"}
                        />
                      ) : (
                        <div className="player-avatar placeholder" />
                      )}
                      <span className="player-name">
                        {player.name_clean || player.name || "Unknown player"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p>No player list available.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ServerDetailsPage;
