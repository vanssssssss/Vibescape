import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "./App.css";

function App() {
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);

  // 👉 Login modal state
  const [showLogin, setShowLogin] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        vibe: query,
        lat: 26.9124,
        lon: 75.7873,
        radius: 2000,
      });

      const res = await fetch(
        `http://localhost:3000/api/v1/search?${params}`
      );

      const data = await res.json();
      setPlaces(data.places);
    } catch (err) {
      alert("Search failed");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
        </div>

        <div className="sidebar-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>

        <div className="sidebar-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </div>

        <div className="sidebar-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>

        {/* 👤 Bottom profile icon — opens login */}
        <div
          className="sidebar-icon sidebar-bottom"
          onClick={() => setShowLogin(true)}
          style={{ cursor: "pointer" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="header">
          <h1 className="logo">VibeScape</h1>
        </div>

        <div className="search-section">
          <div className="search-header">
            <h2>Discover Your Next Adventure</h2>
            <div className="location-badge">Jaipur, Rajasthan</div>
          </div>

          <div className="map-wrapper">
            <MapContainer
              center={[26.9124, 75.7873]}
              zoom={13}
              style={{ height: "100%", width: "100%", borderRadius: "12px" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />

              {places.map((place) => (
                <Marker key={place.id} position={[place.latitude, place.longitude]}>
                  <Popup>
                    <div className="popup-content">
                      <strong>{place.name}</strong>
                      <br />
                      {place.tags?.join(", ")}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            <div className="map-controls">
              <button className="control-btn">+</button>
              <button className="control-btn">−</button>
            </div>

            <div className="search-overlay">
              <input
                type="text"
                placeholder="Describe your vibe... (e.g., cozy cafes, adventure spots)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="vibe-input"
              />
              <button
                onClick={handleSearch}
                className="search-btn"
                disabled={loading}
              >
                {loading ? (
                  <span className="loading-spinner"></span>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {places.length > 0 && (
            <div className="results-info">
              Found {places.length} place{places.length !== 1 ? "s" : ""} matching your vibe
            </div>
          )}
        </div>
      </div>

      {/* 🔐 Login Modal */}
      {showLogin && (
        <div className="login-overlay">
          <div className="login-card">
            <h2 className="login-title">Welcome Back</h2>
            <p className="login-sub">Sign in to continue</p>

            <input type="email" placeholder="Email" className="login-input" />
            <input type="password" placeholder="Password" className="login-input" />

            <button className="login-btn">Login</button>

            <button className="login-close" onClick={() => setShowLogin(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
