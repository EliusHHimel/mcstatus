import "./App.css";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import OnlineServersPage from "./pages/OnlineServersPage";
import ServerDetailsPage from "./pages/ServerDetailsPage";

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <nav className="app-nav">
          <Link className="nav-link" to="/">
            Home
          </Link>
          <Link className="nav-link" to="/online">
            Online Servers
          </Link>
        </nav>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/online" element={<OnlineServersPage />} />
          <Route path="/server/:ip" element={<ServerDetailsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
