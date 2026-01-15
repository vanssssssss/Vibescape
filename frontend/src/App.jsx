import { useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "./App.css";

/* ---------- PURPLE MARKER ---------- */
const purpleMarker = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authStep, setAuthStep] = useState("auth");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);

  const [user, setUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  /* ---------- SEARCH (UNCHANGED) ---------- */
  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:3000/api/v1/search?vibe=${query}&lat=26.9124&lon=75.7873&radius=2000`
      );
      const data = await res.json();
      setPlaces(
        (data.places || []).map((p) => ({
          ...p,
          latitude: p.latitude ?? p.lat,
          longitude: p.longitude ?? p.lng,
        }))
      );
    } catch {
      alert("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => e.key === "Enter" && handleSearch();

  /* ---------- AUTH HANDLERS ---------- */

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setUser({ email, id: data.user_id });
      setIsAuthenticated(true);
      navigate("/");
    } catch (err) {
      alert(err.message || "Login failed");
    }
  };

  const handleRegister = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setUser({ email: data.email, id: data.user_id });
      setIsAuthenticated(true);
      navigate("/");
    } catch (err) {
      alert(err.message || "Registration failed");
    }
  };

  const handleForgotPassword = async () => {
    try {
      await fetch("http://localhost:3000/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      alert("If the email exists, a reset link was sent.");
      setAuthStep("auth");
    } catch {
      alert("Failed to send reset email");
    }
  };

  /* ---------- AUTH GUARD ---------- */
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route
          path="*"
          element={
            <div className="auth-screen">
              <h1 className="auth-brand">VibeScape</h1>

              <div className="auth-wrapper">
                <div className="auth-card-glass">
                  {authStep === "auth" && (
                    <>
                      <h2 className="auth-title">
                        {authMode === "login"
                          ? "Welcome Back"
                          : "Create Account"}
                      </h2>

                      <div className="auth-tabs">
                        <button
                          className={
                            authMode === "login"
                              ? "auth-tab active"
                              : "auth-tab"
                          }
                          onClick={() => setAuthMode("login")}
                        >
                          Login
                        </button>
                        <button
                          className={
                            authMode === "register"
                              ? "auth-tab active"
                              : "auth-tab"
                          }
                          onClick={() => setAuthMode("register")}
                        >
                          Register
                        </button>
                      </div>

                      {authMode === "login" && (
                        <>
                          <input
                            className="auth-input"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                          <input
                            className="auth-input"
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />

                          <button className="auth-btn" onClick={handleLogin}>
                            Login
                          </button>

                          <p
                            className="auth-link"
                            onClick={() => setAuthStep("forgot")}
                          >
                            Forgot password?
                          </p>
                        </>
                      )}

                      {authMode === "register" && (
                        <>
                          <input
                            className="auth-input"
                            placeholder="Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                          />
                          <input
                            className="auth-input"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                          <input
                            className="auth-input"
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />

                          <button
                            className="auth-btn"
                            onClick={handleRegister}
                          >
                            Create Account
                          </button>
                        </>
                      )}

                      {/* ✅ SKIP FOR NOW (UNCHANGED) */}
                      <button
                        className="skip-link"
                        onClick={() => {
                          setUser(null);
                          setIsAuthenticated(true);
                          navigate("/");
                        }}
                      >
                        Skip for now →
                      </button>
                    </>
                  )}

                  {authStep === "forgot" && (
                    <>
                      <h2 className="auth-title">Reset Password</h2>
                      <input
                        className="auth-input"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <button
                        className="auth-btn"
                        onClick={handleForgotPassword}
                      >
                        Send Reset Link
                      </button>
                      <p
                        className="auth-link"
                        onClick={() => setAuthStep("auth")}
                      >
                        Back to login
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          }
        />
      </Routes>
    );
  }

  /* ---------- MAIN APP (UNCHANGED) ---------- */
   return (
    <div className="app-container">
      {/* SIDEBAR */}
      <div className="sidebar">
        <div
          className={`sidebar-icon ${
            location.pathname === "/" ? "active purple" : ""
          }`}
          onClick={() => navigate("/")}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M3 5l6-2 6 2 6-2v14l-6 2-6-2-6 2z" stroke="white" strokeWidth="2"/>
          </svg>
        </div>

        <div
          className={`sidebar-icon ${
            location.pathname === "/photos" ? "active purple" : ""
          }`}
          onClick={() => navigate("/photos")}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="white" strokeWidth="2"/>
            <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="2"/>
          </svg>
        </div>

        <div
          className={`sidebar-icon ${
            location.pathname === "/favorites" ? "active purple" : ""
          }`}
          onClick={() => navigate("/favorites")}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 20l-7-6a5 5 0 017-7 5 5 0 017 7z" stroke="white" strokeWidth="2"/>
          </svg>
        </div>

        <div
          className={`sidebar-icon ${
            location.pathname === "/places" ? "active purple" : ""
          }`}
          onClick={() => navigate("/places")}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 21s6-5.5 6-10a6 6 0 10-12 0c0 4.5 6 10 6 10z" stroke="white" strokeWidth="2"/>
          </svg>
        </div>

        <div
          className={`sidebar-icon sidebar-bottom ${
            showProfile ? "active purple" : ""
          }`}
          onClick={() => setShowProfile(!showProfile)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="white" strokeWidth="2"/>
            <path d="M4 20c2-4 12-4 14 0" stroke="white" strokeWidth="2"/>
          </svg>
        </div>
      </div>

      {/* PROFILE PANEL */}
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
        <h1 className="logo">VibeScape</h1>

        <Routes>
          <Route
            path="/"
            element={
              <div className="search-section">
                <MapContainer center={[26.9124, 75.7873]} zoom={13}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {places.map((p) => (
                    <Marker
                      key={p.id}
                      position={[p.latitude, p.longitude]}
                      icon={purpleMarker}
                    >
                      <Popup>{p.name}</Popup>
                    </Marker>
                  ))}
                </MapContainer>

                <div className="search-overlay">
                  <input
                    className="vibe-input"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKey}   
                    placeholder="Describe your vibe…"
                  />
                  <button className="search-btn" onClick={handleSearch}>
                    {loading ? "…" : "🔍"}
                  </button>
                </div>
              </div>
            }
          />

          <Route path="/photos" element={<div className="blank-page" />} />
          <Route path="/favorites" element={<div className="blank-page" />} />
          <Route path="/places" element={<Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;