import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import localServers from "../servers.json";

const MAX_CONCURRENCY = 10;
const DEFAULT_PAGE_SIZE = 24;

export function OnlineServersList({
  showTitle = true,
  title = "Online Servers",
}) {
  const [serverList, setServerList] = useState([]);
  const [listSource, setListSource] = useState("loading");
  const [scanning, setScanning] = useState(false);
  const [checkedCount, setCheckedCount] = useState(0);
  const [onlineServers, setOnlineServers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [versionTerm, setVersionTerm] = useState("");
  const [motdTerm, setMotdTerm] = useState("");
  const [minPlayers, setMinPlayers] = useState(0);
  const [maxPlayers, setMaxPlayers] = useState(0);
  const [hideEmpty, setHideEmpty] = useState(false);
  const [sortBy, setSortBy] = useState("players-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const cancelRef = useRef(false);
  const autoScanRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const loadList = async () => {
      setListSource("loading");
      try {
        const response = await fetch(`${process.env.PUBLIC_URL}/result.json`);
        if (!response.ok) {
          throw new Error("result.json not found in public folder");
        }
        const data = await response.json();
        if (!cancelled) {
          setServerList(Array.isArray(data) ? data : []);
          setListSource("result.json");
        }
      } catch (error) {
        if (!cancelled) {
          setServerList(Array.isArray(localServers) ? localServers : []);
          setListSource("servers.json");
        }
      }
    };

    loadList();
    return () => {
      cancelled = true;
    };
  }, []);

  const ipList = useMemo(() => {
    return serverList.map((item) => item?.ip).filter(Boolean);
  }, [serverList]);

  const totalToCheck = ipList.length;

  const startScan = useCallback(
    async (resetResults = true) => {
      if (scanning || totalToCheck === 0) {
        return;
      }

      cancelRef.current = false;
      setScanning(true);
      setCheckedCount(0);
      if (resetResults) {
        setOnlineServers([]);
      }

      const targets = ipList;
      let index = 0;

      const worker = async () => {
        while (index < targets.length && !cancelRef.current) {
          const ip = targets[index];
          index += 1;
          try {
            const response = await fetch(
              `https://api.mcstatus.io/v2/status/java/${ip}`,
            );
            const data = await response.json();
            if (data?.online) {
              const resolvedIp = data?.ip_address || data?.ip || ip;
              const normalized = { ...data, ip_address: resolvedIp };
              setOnlineServers((prev) => {
                const existingIndex = prev.findIndex(
                  (item) =>
                    (item?.ip_address || item?.ip || item?.host) === resolvedIp,
                );
                if (existingIndex === -1) {
                  return [...prev, normalized];
                }
                const updated = [...prev];
                updated[existingIndex] = normalized;
                return updated;
              });
            }
          } catch (error) {
            // Ignore failed requests and continue.
          } finally {
            setCheckedCount((prev) => prev + 1);
          }
        }
      };

      const workers = Array.from(
        { length: Math.min(MAX_CONCURRENCY, targets.length) },
        () => worker(),
      );
      await Promise.all(workers);

      if (!cancelRef.current) {
        setScanning(false);
      }
    },
    [ipList, scanning, totalToCheck],
  );

  const stopScan = () => {
    cancelRef.current = true;
    setScanning(false);
  };

  useEffect(() => {
    if (!autoScanRef.current && ipList.length > 0) {
      autoScanRef.current = true;
      startScan(true);
    }
  }, [ipList, startScan]);

  const progressPercent =
    totalToCheck > 0 ? Math.round((checkedCount / totalToCheck) * 100) : 0;

  const getServerIcon = (server) =>
    server?.icon ||
    server?.favicon ||
    server?.server?.icon ||
    server?.server?.favicon ||
    null;

  const filteredServers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const normalizedVersion = versionTerm.trim().toLowerCase();
    const normalizedMotd = motdTerm.trim().toLowerCase();

    const filtered = onlineServers.filter((server) => {
      const ip = (server?.ip_address || server?.ip || "").toString();
      const version = server?.version?.name_clean || "";
      const motd = server?.motd?.clean || "";
      const playersOnline = server?.players?.online ?? 0;

      if (normalizedSearch && !ip.toLowerCase().includes(normalizedSearch)) {
        return false;
      }

      if (
        normalizedVersion &&
        !version.toLowerCase().includes(normalizedVersion)
      ) {
        return false;
      }

      if (normalizedMotd && !motd.toLowerCase().includes(normalizedMotd)) {
        return false;
      }

      if (hideEmpty && playersOnline === 0) {
        return false;
      }

      if (minPlayers > 0 && playersOnline < minPlayers) {
        return false;
      }

      if (maxPlayers > 0 && playersOnline > maxPlayers) {
        return false;
      }

      return true;
    });

    switch (sortBy) {
      case "players-asc":
        filtered.sort(
          (a, b) => (a?.players?.online || 0) - (b?.players?.online || 0),
        );
        break;
      case "ip-asc":
        filtered.sort((a, b) =>
          (a?.ip_address || a?.ip || "").localeCompare(
            b?.ip_address || b?.ip || "",
          ),
        );
        break;
      case "ip-desc":
        filtered.sort((a, b) =>
          (b?.ip_address || b?.ip || "").localeCompare(
            a?.ip_address || a?.ip || "",
          ),
        );
        break;
      case "players-desc":
      default:
        filtered.sort(
          (a, b) => (b?.players?.online || 0) - (a?.players?.online || 0),
        );
        break;
    }

    return filtered;
  }, [
    hideEmpty,
    maxPlayers,
    minPlayers,
    motdTerm,
    onlineServers,
    searchTerm,
    sortBy,
    versionTerm,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredServers.length / pageSize));
  const pagedServers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredServers.slice(startIndex, startIndex + pageSize);
  }, [currentPage, filteredServers, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    hideEmpty,
    maxPlayers,
    minPlayers,
    motdTerm,
    searchTerm,
    sortBy,
    versionTerm,
    pageSize,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <>
      {showTitle && <h1 className="page-title">{title}</h1>}

      <div className="panel">
        <div className="panel-row">
          <button
            className="panel-button"
            onClick={() => startScan(true)}
            disabled={scanning || totalToCheck === 0}
          >
            {scanning
              ? "Scanning..."
              : onlineServers.length > 0
                ? "Rescan"
                : "Start scan"}
          </button>
          <button
            className="panel-button secondary"
            onClick={stopScan}
            disabled={!scanning}
          >
            Stop
          </button>
        </div>

        <div className="panel-meta">
          <span>Source: {listSource}</span>
          <span>Total IPs: {ipList.length}</span>
          <span>
            Checked: {checkedCount}/{totalToCheck}
          </span>
          <span>Progress: {progressPercent}%</span>
          <span>Online found: {onlineServers.length}</span>
        </div>
      </div>

      <div className="panel">
        <div className="panel-row">
          <label className="panel-label" htmlFor="search">
            Search IP
          </label>
          <input
            id="search"
            className="panel-input"
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="e.g. 192.168"
          />
          <label className="panel-label" htmlFor="version">
            Version
          </label>
          <input
            id="version"
            className="panel-input"
            type="text"
            value={versionTerm}
            onChange={(event) => setVersionTerm(event.target.value)}
            placeholder="1.20.4"
          />
          <label className="panel-label" htmlFor="motd">
            MOTD
          </label>
          <input
            id="motd"
            className="panel-input"
            type="text"
            value={motdTerm}
            onChange={(event) => setMotdTerm(event.target.value)}
            placeholder="Survival"
          />
        </div>

        <div className="panel-row">
          <label className="panel-label" htmlFor="minPlayers">
            Min players
          </label>
          <input
            id="minPlayers"
            className="panel-input"
            type="number"
            min="0"
            value={minPlayers}
            onChange={(event) => setMinPlayers(Number(event.target.value) || 0)}
          />
          <label className="panel-label" htmlFor="maxPlayers">
            Max players
          </label>
          <input
            id="maxPlayers"
            className="panel-input"
            type="number"
            min="0"
            value={maxPlayers}
            onChange={(event) => setMaxPlayers(Number(event.target.value) || 0)}
          />
          <label className="panel-label" htmlFor="sortBy">
            Sort
          </label>
          <select
            id="sortBy"
            className="panel-input"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            <option value="players-desc">Players (high → low)</option>
            <option value="players-asc">Players (low → high)</option>
            <option value="ip-asc">IP (A → Z)</option>
            <option value="ip-desc">IP (Z → A)</option>
          </select>
          <label className="panel-checkbox">
            <input
              type="checkbox"
              checked={hideEmpty}
              onChange={(event) => setHideEmpty(event.target.checked)}
            />
            Hide empty
          </label>
        </div>

        <div className="panel-meta">
          <span>Matches: {filteredServers.length}</span>
        </div>
      </div>

      <div className="pagination">
        <button
          className="panel-button secondary"
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
        >
          First
        </button>
        <button
          className="panel-button secondary"
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="panel-button secondary"
          onClick={() =>
            setCurrentPage((prev) => Math.min(totalPages, prev + 1))
          }
          disabled={currentPage >= totalPages}
        >
          Next
        </button>
        <button
          className="panel-button secondary"
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage >= totalPages}
        >
          Last
        </button>
        <label className="panel-label" htmlFor="pageSize">
          Page size
        </label>
        <select
          id="pageSize"
          className="panel-input"
          value={pageSize}
          onChange={(event) => setPageSize(Number(event.target.value) || 24)}
        >
          <option value={12}>12</option>
          <option value={24}>24</option>
          <option value={48}>48</option>
          <option value={96}>96</option>
        </select>
      </div>

      <div className="server-grid">
        {filteredServers.length === 0 && (
          <div className="empty-state">
            {scanning
              ? "Scanning IPs. Online servers will appear here as they are found."
              : "No online servers found yet. Start a scan to populate the list."}
          </div>
        )}

        {pagedServers.map((server) => {
          const serverIp =
            server?.ip_address || server?.ip || server?.host || "Unknown IP";
          const serverIcon = getServerIcon(server);
          return (
            <div
              className="server-card"
              key={`${serverIp}-${server?.port || ""}`}
            >
              <div className="server-card-header">
                {serverIcon ? (
                  <img
                    className="server-icon"
                    src={serverIcon}
                    alt={`${serverIp} icon`}
                  />
                ) : (
                  <div className="server-icon placeholder" />
                )}
                <div className="server-card-title">{serverIp}</div>
              </div>
              <div className="server-card-row">
                Status: <span className="online">Online</span>
              </div>
              <div className="server-card-row">
                Players: {server?.players?.online ?? 0}/
                {server?.players?.max ?? 0}
              </div>
              <div className="server-card-row">
                Version: {server?.version?.name_clean || "Unknown"}
              </div>
              <div className="server-card-row">
                MOTD: {server?.motd?.clean || "N/A"}
              </div>
              {serverIp !== "Unknown IP" && (
                <Link
                  className="panel-button link-button"
                  to={`/server/${serverIp}`}
                >
                  View details
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function OnlineServersPage() {
  return (
    <div className="page">
      <OnlineServersList showTitle title="Online Servers" />
    </div>
  );
}

export default OnlineServersPage;
