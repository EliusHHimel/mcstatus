import { OnlineServersList } from "./OnlineServersPage";

function HomePage() {
  return (
    <div className="page">
      <h1 className="page-title">
        <img
          width="100"
          height="100"
          src="https://img.icons8.com/plasticine/100/minecraft-grass-cube--v2.png"
          alt="minecraft-grass-cube--v2"
        />
        Minecraft Server Status
      </h1>
      <OnlineServersList showTitle={false} />
    </div>
  );
}

export default HomePage;
