import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

function ServerDetailsPage() {
  const { ip } = useParams();
  const [serverData, setServerData] = useState(null);
  const [queryData, setQueryData] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    const loadServer = async () => {
      setStatus("loading");
      try {
        const [statusResponse, queryResponse] = await Promise.all([
          fetch(`https://api.mcstatus.io/v2/status/java/${ip}`),
          fetch(`https://api.mcstatus.io/v2/query/java/${ip}`),
        ]);

        const data = await statusResponse.json();
        const query = await queryResponse.json();
        if (!cancelled) {
          setServerData(data);
          setQueryData(query);
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

  const whitelistStatus = useMemo(() => {
    const whitelistValue =
      serverData?.whitelist ??
      serverData?.whitelisted ??
      serverData?.server?.whitelist ??
      serverData?.server?.whitelisted ??
      serverData?.server?.is_whitelisted ??
      serverData?.server?.isWhitelisted ??
      serverData?.players?.whitelist ??
      queryData?.whitelist ??
      queryData?.whitelisted ??
      queryData?.server?.whitelist ??
      queryData?.server?.whitelisted ??
      queryData?.server?.is_whitelisted ??
      queryData?.server?.isWhitelisted ??
      queryData?.players?.whitelist;

    if (whitelistValue === true) {
      return "Enabled";
    }
    if (whitelistValue === false) {
      return "Disabled";
    }
    return "Unknown";
  }, [serverData, queryData]);

  const playersList =
    queryData?.players?.list ||
    queryData?.players?.sample ||
    serverData?.players?.list ||
    serverData?.players?.sample ||
    [];

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
          <span>Server IP: {ip}</span>
          <span>Status: {serverData?.online ? "Online" : "Offline"}</span>
          <span>Whitelist: {whitelistStatus}</span>
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
            <p>Version: {serverData?.version?.name_clean || "Unknown"}</p>
            <p>Port: {serverData?.port ?? "N/A"}</p>
            <p>MOTD: {serverData?.motd?.clean || "N/A"}</p>
          </div>

          <div className="details-card">
            <h2>Players</h2>
            {playersList.length > 0 ? (
              <ul className="player-list">
                {playersList.map((player) => (
                  <li key={player.id || player.name || player.name_clean}>
                    {player.name_clean || player.name || "Unknown player"}
                  </li>
                ))}
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
