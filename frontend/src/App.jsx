import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "./App.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);

  const [user, setUser] = useState(null);

  const [bubble, setBubble] = useState(null);
  const [bubblePos, setBubblePos] = useState({ top: 0, left: 0 });

  const [activePage, setActivePage] = useState("map"); // map | photos | favorites | places
  const [showProfile, setShowProfile] = useState(false);

  /* ---------------- SEARCH ---------------- */
  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:3000/api/v1/search?vibe=${query}&lat=26.9124&lon=75.7873&radius=2000`
      );
      const data = await res.json();
      setPlaces(data.places || []);
    } catch {
      alert("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => e.key === "Enter" && handleSearch();

  /* ---------------- USER BUBBLE ---------------- */
  const showUserBubble = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();

    setBubblePos({
      top: rect.top + rect.height + 8,
      left: rect.left + rect.width + 12
    });

    setBubble(
      user ? `${user.name} — ${user.email}` : "No user logged in"
    );

    setTimeout(() => setBubble(null), 1400);
  };

  /* ---------------- AUTH SCREEN ---------------- */
  if (!isAuthenticated) {
    return (
      <div className="auth-screen">
        <h1 className="auth-brand">VibeScape</h1>

        <div className="auth-wrapper">
          <div className="auth-card-glass">
            <h2 className="auth-title">
              {authMode === "login" ? "Welcome Back" : "Create Account"}
            </h2>

            <div className="auth-tabs">
              <button
                className={authMode === "login" ? "auth-tab active" : "auth-tab"}
                onClick={() => setAuthMode("login")}
              >
                Login
              </button>

              <button
                className={authMode === "register" ? "auth-tab active" : "auth-tab"}
                onClick={() => setAuthMode("register")}
              >
                Register
              </button>
            </div>

            {authMode === "login" && (
              <>
                <input className="auth-input" placeholder="Email" />
                <input className="auth-input" type="password" placeholder="Password" />

                <button
                  className="auth-btn"
                  onClick={() => {
                    setUser({ name: "Guest User", email: "guest@mail.com" });
                    setIsAuthenticated(true);
                  }}
                >
                  Login
                </button>
              </>
            )}

            {authMode === "register" && (
              <>
                <input className="auth-input" placeholder="Name" />
                <input className="auth-input" placeholder="Email" />
                <input className="auth-input" type="password" placeholder="Password" />

                <button
                  className="auth-btn"
                  onClick={() => {
                    setUser({ name: "New User", email: "user@mail.com" });
                    setIsAuthenticated(true);
                  }}
                >
                  Create Account
                </button>
              </>
            )}

            <button
              className="skip-link"
              onClick={() => {
                setUser(null);
                setIsAuthenticated(true);
              }}
            >
              Skip for now →
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- MAIN APP ---------------- */
  return (
    <div className="app-container">
      <div className="sidebar">

        {/* MAP */}
        <div className="sidebar-icon" onClick={() => setActivePage("map")}>
          <svg width="22" height="22" stroke="#fff" fill="none" strokeWidth="2">
            <path d="M3 5l6-2 6 2 6-2v14l-6 2-6-2-6 2z" />
          </svg>
        </div>

        {/* PHOTOS */}
        <div className="sidebar-icon" onClick={() => setActivePage("photos")}>
          <svg width="22" height="22" stroke="#fff" fill="none" strokeWidth="2">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>

        {/* FAVORITES */}
        <div className="sidebar-icon" onClick={() => setActivePage("favorites")}>
          <svg width="22" height="22" stroke="#fff" fill="none" strokeWidth="2">
            <path d="M12 20l-7-6a5 5 0 017-7 5 5 0 017 7z" />
          </svg>
        </div>

        {/* PIN */}
        <div className="sidebar-icon" onClick={() => setActivePage("places")}>
          <svg width="22" height="22" stroke="#fff" fill="none" strokeWidth="2">
            <path d="M12 21s6-5.5 6-10a6 6 0 10-12 0c0 4.5 6 10 6 10z" />
          </svg>
        </div>

        {/* USER */}
        <div
          className="sidebar-icon sidebar-bottom"
          onClick={(e) => {
            showUserBubble(e);
            setShowProfile(true);
          }}
        >
          <svg width="22" height="22" stroke="#fff" fill="none" strokeWidth="2">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c2-4 12-4 14 0" />
          </svg>
        </div>
      </div>

      {/* USER BUBBLE */}
      {bubble && (
        <div className="icon-tooltip" style={{ top: bubblePos.top, left: bubblePos.left }}>
          {bubble}
        </div>
      )}

      {/* PROFILE SIDE PANEL */}
      {showProfile && (
        <div className="profile-panel">
          <div className="profile-header">
            <h3>User Profile</h3>
            <button className="close-btn" onClick={() => setShowProfile(false)}>✕</button>
          </div>

          {user ? (
            <>
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>

              <button
                className="logout-btn"
                onClick={() => {
                  setUser(null);
                  setIsAuthenticated(false);
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <p>No user logged in</p>
          )}
        </div>
      )}

      <div className="main-content">
        <div className="header">
          <h1 className="logo">VibeScape</h1>
        </div>

        {/* PAGE ROUTING */}
        {activePage === "map" && (
          <div className="search-section">
            <div className="search-header">
              <h2>Discover Your Next Adventure</h2>
              <div className="location-badge">Jaipur, Rajasthan</div>
            </div>

            <div className="map-wrapper">
              <MapContainer center={[26.9124, 75.7873]} zoom={13}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                {places.map((p) => (
                  <Marker key={p.id} position={[p.latitude, p.longitude]}>
                    <Popup>{p.name}</Popup>
                  </Marker>
                ))}
              </MapContainer>

              <div className="search-overlay">
                <input
                  className="vibe-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKey}
                  placeholder="Describe your vibe… (cafes, hidden spots, art places)"
                />
                <button className="search-btn" onClick={handleSearch}>
                  {loading ? "…" : "🔍"}
                </button>
              </div>
            </div>
          </div>
        )}

        {activePage !== "map" && (
          <div className="blank-page">
            <h2>Coming Soon</h2>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
