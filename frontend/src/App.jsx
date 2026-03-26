import logo from "./assets/logo.png";

import { useState, useCallback } from "react";
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

import Favourites from "./Favourites";
import MemoriesPage from "./MemoriesPage";
import MapPanHandler from "./MapPanHandler";

// ── NEW: proximity notifications ────────────────────────────────
import { useProximityWatch } from "./hooks/useProximityWatch";

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

  const params = new URLSearchParams(location.search);
  const resetToken = params.get("token");

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authStep, setAuthStep] = useState("auth");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");

  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popupStatus, setPopupStatus] = useState({});
  const [currentBBox, setCurrentBBox] = useState(null);

  const [user, setUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  // ── NEW: notification state ──────────────────────────────────
  const [notifsEnabled, setNotifsEnabled] = useState(true);
  const [nearbyAlert, setNearbyAlert] = useState(null);

  // ── NEW: proximity hook — fires when user is near a saved place
  useProximityWatch({
    enabled: notifsEnabled,
    radius: 500,
    onNearbyPlace: (place) => setNearbyAlert(place),
  });

  /* ---------- MAP PAN HANDLER ---------- */
  const handleBBoxChange = useCallback((bbox) => {
    setCurrentBBox(bbox);
  }, []);

  /* ---------- VIBE SEARCH ---------- */
  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/v1/search/map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bbox: currentBBox ?? {
            south: 26.85,
            west: 75.75,
            north: 26.97,
            east: 75.9,
          },
          vibe: query,
        }),
      });
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

  /* ---------- FAVOURITES HELPERS ---------- */
  const handleAddToFavourites = async (p) => {
    if (!user?.id) return alert("Please log in to save places.");
    setPopupStatus((prev) => ({ ...prev, [p.id]: "saving" }));
    try {
      const res = await fetch("http://localhost:3000/api/v1/favorites/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          place_id: String(p.id),
          place_name: p.name,
          city: "Jaipur",
        }),
      });
      if (res.status === 409) {
        setPopupStatus((prev) => ({ ...prev, [p.id]: "already_saved" }));
      } else if (res.ok) {
        setPopupStatus((prev) => ({ ...prev, [p.id]: "saved" }));
      } else {
        throw new Error();
      }
    } catch {
      setPopupStatus((prev) => ({ ...prev, [p.id]: "error" }));
    }
  };

  const handleMarkVisited = async (p) => {
    if (!user?.id) return alert("Please log in to save places.");
    setPopupStatus((prev) => ({ ...prev, [p.id]: "marking" }));
    try {
      const res = await fetch(
        "http://localhost:3000/api/v1/favorites/visited",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            place_id: String(p.id),
            place_name: p.name,
            city: "Jaipur",
          }),
        }
      );
      if (res.ok) {
        setPopupStatus((prev) => ({ ...prev, [p.id]: "visited" }));
      } else {
        throw new Error();
      }
    } catch {
      setPopupStatus((prev) => ({ ...prev, [p.id]: "error" }));
    }
  };

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

  const handleResetPassword = async (token) => {
    try {
      const res = await fetch(
        "http://localhost:3000/api/v1/auth/reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, newPassword: password }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert("Password reset successful. Please login.");
      setAuthStep("auth");
      navigate("/");
    } catch (err) {
      alert(err.message || "Password reset failed");
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
                  {authStep === "auth" && !resetToken && (
                    <>
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
                          <p className="auth-link" onClick={() => setAuthStep("forgot")}>
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
                          <button className="auth-btn" onClick={handleRegister}>
                            Create Account
                          </button>
                        </>
                      )}

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
                      <button className="auth-btn" onClick={handleForgotPassword}>
                        Send Reset Link
                      </button>
                      <p className="auth-link" onClick={() => setAuthStep("auth")}>
                        Back to login
                      </p>
                    </>
                  )}

                  {resetToken && (
                    <>
                      <h2 className="auth-title">Set New Password</h2>
                      <input
                        className="auth-input"
                        type="password"
                        placeholder="New password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        className="auth-btn"
                        onClick={() => handleResetPassword(resetToken)}
                      >
                        Reset Password
                      </button>
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

  /* ---------- MAIN APP ---------- */
  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <div className="sidebar">
        <div
          className={`sidebar-icon ${location.pathname === "/" ? "active purple" : ""}`}
          onClick={() => navigate("/")}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M3 5l6-2 6 2 6-2v14l-6 2-6-2-6 2z" stroke="white" strokeWidth="2" />
          </svg>
        </div>

        <div
          className={`sidebar-icon ${location.pathname === "/photos" ? "active purple" : ""}`}
          onClick={() => navigate("/photos")}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="white" strokeWidth="2" />
            <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="2" />
          </svg>
        </div>

        <div
          className={`sidebar-icon ${location.pathname === "/favorites" ? "active purple" : ""}`}
          onClick={() => navigate("/favorites")}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 20l-7-6a5 5 0 017-7 5 5 0 017 7z" stroke="white" strokeWidth="2" />
          </svg>
        </div>

        <div
          className={`sidebar-icon ${location.pathname === "/places" ? "active purple" : ""}`}
          onClick={() => navigate("/places")}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 21s6-5.5 6-10a6 6 0 10-12 0c0 4.5 6 10 6 10z" stroke="white" strokeWidth="2" />
          </svg>
        </div>

        <div
          className={`sidebar-icon sidebar-bottom ${showProfile ? "active purple" : ""}`}
          onClick={() => navigate("/settings")}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="white" strokeWidth="2" />
            <path d="M4 20c2-4 12-4 14 0" stroke="white" strokeWidth="2" />
          </svg>
        </div>
      </div>

      <div className="main-content">
        {/* TOP BROWSER-LIKE RIBBON */}
        <div
          style={{
            height: "44px",
            width: "100%",
            background: "#E5E7EB",
            display: "flex",
            alignItems: "center",
            padding: "0 6px",
            marginBottom: "12px",
            marginTop: "-10px",
          }}
        >
          <div style={{ marginRight: "2px" }}>
            <svg width="58" height="58" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="32" cy="32" r="18" fill="#7C3AED" opacity="0.95" />
              <circle cx="26" cy="26" r="12" fill="white" opacity="0.12" />
              <path d="M14 32H50" stroke="white" strokeWidth="2.6" strokeLinecap="round" opacity="0.85" />
              <path d="M32 14C26 20 26 44 32 50" stroke="white" strokeWidth="2.4" strokeLinecap="round" opacity="0.7" />
              <path d="M32 14C38 20 38 44 32 50" stroke="white" strokeWidth="2.4" strokeLinecap="round" opacity="0.7" />
              <path d="M20 22C24 25 40 25 44 22" stroke="white" strokeWidth="2.4" strokeLinecap="round" opacity="0.6" />
              <path d="M20 42C24 39 40 39 44 42" stroke="white" strokeWidth="2.4" strokeLinecap="round" opacity="0.6" />
            </svg>
          </div>
          <span style={{ fontSize: "28px", fontWeight: "900", color: "#111827", letterSpacing: "-0.5px" }}>
            VibeScape
          </span>
        </div>

        <Routes>
          {/* ── SETTINGS ROUTE ── */}
          <Route
            path="/settings"
            element={
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  padding: "26px",
                  borderRadius: "22px",
                  background: "rgba(255,255,255,0.75)",
                  backdropFilter: "blur(18px)",
                  WebkitBackdropFilter: "blur(18px)",
                  boxShadow: "0 22px 60px rgba(0,0,0,0.16)",
                  border: "1px solid rgba(0,0,0,0.06)",
                }}
              >
                {/* HEADER */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "22px",
                  }}
                >
                  <div>
                    <h2 style={{ fontSize: "26px", fontWeight: "900", color: "#111827", margin: 0 }}>
                      Account Settings
                    </h2>
                    <p style={{ margin: "6px 0 0", fontSize: "14px", fontWeight: "600", color: "#6B7280" }}>
                      Manage your account information and preferences
                    </p>
                  </div>

                  <button
                    onClick={() => navigate("/")}
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "14px",
                      border: "1px solid rgba(0,0,0,0.08)",
                      background: "rgba(255,255,255,0.85)",
                      cursor: "pointer",
                      fontSize: "18px",
                      fontWeight: "900",
                      color: "#111827",
                      boxShadow: "0 10px 24px rgba(0,0,0,0.08)",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0px)"; }}
                  >
                    ✕
                  </button>
                </div>

                {/* BASIC INFO CARD */}
                <div
                  style={{
                    padding: "18px",
                    borderRadius: "22px",
                    background: "rgba(243,244,246,0.65)",
                    border: "1px solid rgba(0,0,0,0.06)",
                    boxShadow: "0 14px 32px rgba(0,0,0,0.10)",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ marginBottom: "14px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "900", color: "#111827", margin: 0 }}>
                      Basic Info
                    </h3>
                    <p style={{ margin: "6px 0 0", fontSize: "13px", fontWeight: "600", color: "#6B7280" }}>
                      Update your personal information
                    </p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div
                      style={{
                        padding: "14px 16px",
                        borderRadius: "18px",
                        background: "rgba(255,255,255,0.85)",
                        border: "1px solid rgba(0,0,0,0.06)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <span style={{ fontWeight: "900", color: "#111827", fontSize: "15px" }}>
                        User logged in
                      </span>
                      <span style={{ fontWeight: "700", color: "#6B7280", fontSize: "14px" }}>
                        {user?.email || ""}
                      </span>
                    </div>

                    <div
                      style={{
                        padding: "14px 16px",
                        borderRadius: "18px",
                        background: "rgba(255,255,255,0.85)",
                        border: "1px solid rgba(0,0,0,0.06)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <span style={{ fontWeight: "900", color: "#111827", fontSize: "15px" }}>Email</span>
                      <span style={{ fontWeight: "700", color: "#6B7280", fontSize: "14px" }}>
                        {user?.email || ""}
                      </span>
                    </div>

                    <div
                      style={{
                        padding: "14px 16px",
                        borderRadius: "18px",
                        background: "rgba(255,255,255,0.85)",
                        border: "1px solid rgba(0,0,0,0.06)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "14px",
                      }}
                    >
                      <span style={{ fontWeight: "900", color: "#111827" }}>Nickname</span>
                      <input
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="Add nickname"
                        style={{
                          flex: 1,
                          maxWidth: "280px",
                          padding: "10px 12px",
                          borderRadius: "14px",
                          border: "1px solid rgba(0,0,0,0.10)",
                          outline: "none",
                          fontSize: "14px",
                          fontWeight: "700",
                          background: "white",
                          color: "#111827",
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.border = "1px solid rgba(124,58,237,0.65)";
                          e.currentTarget.style.boxShadow = "0 0 0 4px rgba(124,58,237,0.15)";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.border = "1px solid rgba(0,0,0,0.10)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setUser(null);
                      setIsAuthenticated(false);
                      navigate("/");
                    }}
                    style={{
                      margin: "18px auto 0",
                      display: "block",
                      width: "220px",
                      padding: "14px",
                      borderRadius: "18px",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: "900",
                      fontSize: "15px",
                      background: "#7C3AED",
                      color: "white",
                      boxShadow: "0 18px 40px rgba(124,58,237,0.30)",
                      transition: "0.2s",
                    }}
                  >
                    Logout
                  </button>
                </div>

                {/* ── NEW: NOTIFICATIONS CARD ─────────────────────────────── */}
                <div
                  style={{
                    padding: "18px",
                    borderRadius: "22px",
                    background: "rgba(243,244,246,0.65)",
                    border: "1px solid rgba(0,0,0,0.06)",
                    boxShadow: "0 14px 32px rgba(0,0,0,0.10)",
                  }}
                >
                  <div style={{ marginBottom: "14px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "900", color: "#111827", margin: 0 }}>
                      Notifications
                    </h3>
                    <p style={{ margin: "6px 0 0", fontSize: "13px", fontWeight: "600", color: "#6B7280" }}>
                      Alert me when I'm near a recommended place
                    </p>
                  </div>

                  <div
                    style={{
                      padding: "14px 16px",
                      borderRadius: "18px",
                      background: "rgba(255,255,255,0.85)",
                      border: "1px solid rgba(0,0,0,0.06)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontWeight: "900", color: "#111827", fontSize: "15px" }}>
                      Location Notifications
                    </span>
                    <input
                      type="checkbox"
                      checked={notifsEnabled}
                      onChange={(e) => setNotifsEnabled(e.target.checked)}
                      style={{
                        width: "20px",
                        height: "20px",
                        accentColor: "#7C3AED",
                        cursor: "pointer",
                      }}
                    />
                  </div>
                </div>
                {/* ── END NOTIFICATIONS CARD ─────────────────────────────── */}
              </div>
            }
          />

          {/* ── HOME / MAP ROUTE ── */}
          <Route
            path="/"
            element={
              <div className="search-section">
                <MapContainer center={[26.9124, 75.7873]} zoom={13}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapPanHandler onBBoxChange={handleBBoxChange} />
                  {places.map((p) => (
                    <Marker key={p.id} position={[p.latitude, p.longitude]} icon={purpleMarker}>
                      <Popup autoPan={true} keepInView={true} maxWidth={220} closeButton={true}>
                        <div
                          style={{
                            minWidth: "165px",
                            padding: "8px 10px",
                            borderRadius: "14px",
                            background: "rgba(255, 255, 255, 0.70)",
                            backdropFilter: "blur(14px)",
                            WebkitBackdropFilter: "blur(14px)",
                            border: "1px solid rgba(255, 255, 255, 0.6)",
                            boxShadow: "0 18px 45px rgba(0,0,0,0.18)",
                            color: "#111",
                            fontFamily: "Roboto, sans-serif",
                          }}
                        >
                          <div style={{ fontWeight: 800, fontSize: "14px", marginBottom: "6px", color: "#1f1f1f" }}>
                            {p.name}
                          </div>

                          <details>
                            <summary
                              style={{
                                cursor: "pointer",
                                fontSize: "13px",
                                fontWeight: 700,
                                color: "#4c1d95",
                                listStyle: "none",
                                userSelect: "none",
                              }}
                            >
                              ▼ Options
                            </summary>

                            <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
                              <div
                                style={{
                                  padding: "8px 10px",
                                  borderRadius: "12px",
                                  background: "rgba(255,255,255,0.55)",
                                  border: "1px solid rgba(0,0,0,0.06)",
                                }}
                              >
                                <div style={{ fontWeight: 800, marginBottom: "6px" }}>Add to Memories</div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                                  <div
                                    style={{ padding: "6px 8px", borderRadius: "10px", cursor: "pointer", transition: "0.2s" }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(124,58,237,0.12)")}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                  >
                                    📝 Add Notes
                                  </div>
                                  <div
                                    style={{ padding: "6px 8px", borderRadius: "10px", cursor: "pointer", transition: "0.2s" }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(124,58,237,0.12)")}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                  >
                                    📷 Add Photos
                                  </div>
                                </div>
                              </div>

                              <div
                                style={{
                                  padding: "10px",
                                  borderRadius: "12px",
                                  cursor: "pointer",
                                  fontWeight: 700,
                                  background:
                                    popupStatus[p.id] === "saved" || popupStatus[p.id] === "already_saved"
                                      ? "rgba(124,58,237,0.15)"
                                      : "rgba(255,255,255,0.55)",
                                  border: "1px solid rgba(0,0,0,0.06)",
                                  transition: "0.2s",
                                }}
                                onClick={() => handleAddToFavourites(p)}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = "translateY(-1px)";
                                  e.currentTarget.style.boxShadow = "0 10px 22px rgba(0,0,0,0.10)";
                                  e.currentTarget.style.background = "rgba(124,58,237,0.10)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = "translateY(0px)";
                                  e.currentTarget.style.boxShadow = "none";
                                  e.currentTarget.style.background =
                                    popupStatus[p.id] === "saved" || popupStatus[p.id] === "already_saved"
                                      ? "rgba(124,58,237,0.15)"
                                      : "rgba(255,255,255,0.55)";
                                }}
                              >
                                {popupStatus[p.id] === "saving" && "⭐ Saving…"}
                                {popupStatus[p.id] === "saved" && "⭐ Saved to To Visit!"}
                                {popupStatus[p.id] === "already_saved" && "⭐ Already saved"}
                                {!popupStatus[p.id] && "⭐ Add to Favourites"}
                              </div>

                              <div
                                style={{
                                  padding: "10px",
                                  borderRadius: "12px",
                                  cursor: "pointer",
                                  fontWeight: 700,
                                  background:
                                    popupStatus[p.id] === "visited"
                                      ? "rgba(16,185,129,0.15)"
                                      : "rgba(255,255,255,0.55)",
                                  border: "1px solid rgba(0,0,0,0.06)",
                                  transition: "0.2s",
                                }}
                                onClick={() => handleMarkVisited(p)}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = "translateY(-1px)";
                                  e.currentTarget.style.boxShadow = "0 10px 22px rgba(0,0,0,0.10)";
                                  e.currentTarget.style.background = "rgba(16,185,129,0.12)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = "translateY(0px)";
                                  e.currentTarget.style.boxShadow = "none";
                                  e.currentTarget.style.background =
                                    popupStatus[p.id] === "visited"
                                      ? "rgba(16,185,129,0.15)"
                                      : "rgba(255,255,255,0.55)";
                                }}
                              >
                                {popupStatus[p.id] === "marking" && "✅ Saving…"}
                                {popupStatus[p.id] === "visited" && "✅ Marked as Visited!"}
                                {(!popupStatus[p.id] ||
                                  popupStatus[p.id] === "saved" ||
                                  popupStatus[p.id] === "already_saved") &&
                                  "✅ Mark as Visited"}
                              </div>
                            </div>
                          </details>
                        </div>
                      </Popup>
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

                {/* ── NEW: NEARBY ALERT TOAST ──────────────────────────────
                    Appears at the bottom-centre of the map when the user
                    walks within 500 m of a recommended place.
                    Tap the × to dismiss it.
                ─────────────────────────────────────────────────────────── */}
                {nearbyAlert && (
                  <div
                    style={{
                      position: "fixed",
                      bottom: 24,
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "#7C3AED",
                      color: "white",
                      padding: "14px 20px",
                      borderRadius: 14,
                      boxShadow: "0 8px 32px rgba(124,58,237,0.45)",
                      fontWeight: 700,
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      zIndex: 9999,
                      maxWidth: "320px",
                    }}
                  >
                    <span>📍 You're near {nearbyAlert.place_name}!</span>
                    <button
                      onClick={() => setNearbyAlert(null)}
                      style={{
                        background: "rgba(255,255,255,0.2)",
                        border: "none",
                        color: "white",
                        borderRadius: "8px",
                        padding: "4px 8px",
                        cursor: "pointer",
                        fontWeight: 900,
                        fontSize: "13px",
                        flexShrink: 0,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
                {/* ── END NEARBY ALERT TOAST ─────────────────────────────── */}
              </div>
            }
          />

          <Route path="/favorites" element={<Favourites user={user} />} />
          <Route path="/photos" element={<MemoriesPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
