import logo from "./assets/logo.png";

import { useState, useRef, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Tooltip,
} from "react-leaflet";
import L from "leaflet";
import "./App.css";

import Favourites from "./Favourites";
import MemoriesPage from "./MemoriesPage";
import { createPortal } from "react-dom";

/* ---------- PURPLE MARKER ---------- */
const purpleMarker = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [18, 28],
  iconAnchor: [10, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const userMarker = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [18, 28],
  iconAnchor: [10, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function RecenterMap({ userLocation }) {
  const map = useMap();

  useEffect(() => {
    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lon], 13);
    }
  }, [userLocation, map]);

  return null;
}

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
  const [popupStatus, setPopupStatus] = useState({}); // track per-place action state

  const [user, setUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  const fileInputRef = useRef(null);
  const [selectedPlace, setSelectedPlace] = useState(null);

  const [userLocation, setUserLocation] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [area, setArea] = useState("");
  const [activeAction, setActiveAction] = useState(null);
  // values: "manual" | "gps"

  /* ---------- location resolver ---------- */

  const resolveLocation = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setShowLocationModal(true);
        return resolve(false);
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            source: "gps",
          });
          resolve(true);
        },
        () => {
          setShowLocationModal(true);
          resolve(false);
        },
      );
    });
  };

  const tryGPS = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          source: "gps",
        });
        setShowLocationModal(false);
      },
      () => alert("Location permission denied"),
    );
  };

  const handleManualLocation = async () => {
    if (!area.trim()) return;

    try {
      const res = await fetch();
      //our navigator backend api

      const data = await res.json();
      const result = data.results[0];

      if (!result) {
        alert("Invalid area");
        return;
      }

      setUserLocation({
        lat: result.geometry.lat,
        lon: result.geometry.lng,
        source: "manual",
      });

      setShowLocationModal(false);
    } catch {
      alert("Failed to get location");
    }
  };

  const handleGoHere = (place) => {
    const newLocation = {
      lat: place.latitude,
      lon: place.longitude,
      source: "place",
    };

    setUserLocation(newLocation);

    // trigger search again
    setTimeout(() => {
      handleSearch();
    }, 0);
  };

  /* ---------- SEARCH (UNCHANGED) ---------- */
  const handleSearch = async () => {
    if (!query.trim()) return;
    console.log(userLocation);
    if (!userLocation) {
      const success = await resolveLocation();
      if (!success) return; // wait for manual input
    }

    console.log(userLocation);

    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:3000/api/v1/search?vibe=${query}&lat=${userLocation.lat}&lon=${userLocation.lon}&radius=500000000`,
      );
      const data = await res.json();
      setPlaces(
        (data.places || []).map((p) => ({
          ...p,
          latitude: p.latitude ?? p.lat,
          longitude: p.longitude ?? p.lng,
        })),
      );
    } catch {
      alert("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => e.key === "Enter" && handleSearch();

  /*----------handleAddPhoto------------*/
  const handleAddPhoto = (place) => {
    setSelectedPlace(place);
    fileInputRef.current.click();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const token = localStorage.getItem("token");

      const authRes = await fetch(
        "http://localhost:3000/api/v1/memories/imagekit-auth",
      );
      const authData = await authRes.json();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", file.name);
      formData.append("token", authData.token);
      formData.append("expire", authData.expire);
      formData.append("signature", authData.signature);
      formData.append("publicKey", "public_qUoQau8hBOj4JWLVStDXyCgbNIY=");

      const uploadRes = await fetch(
        "https://upload.imagekit.io/api/v1/files/upload",
        {
          method: "POST",
          body: formData,
        },
      );

      const uploadData = await uploadRes.json();
      const imageUrl = uploadData.url;

      const memRes = await fetch("http://localhost:3000/api/v1/memories", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const memories = await memRes.json();

      let memory = memories.find((m) => m.place_id === selectedPlace.id);

      if (!memory) {
        const createRes = await fetch("http://localhost:3000/api/v1/memories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            place_id: selectedPlace.id,
            title: selectedPlace.name,
          }),
        });

        memory = await createRes.json();
      }

      await fetch(
        `http://localhost:3000/api/v1/memories/${memory.memory_id}/images`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            image_url: imageUrl,
          }),
        },
      );

      alert("Photo added to memory!");
    } catch (err) {
      console.error(err);
      alert("Image upload failed");
    }
  };

  /*-----------handleAddNotes----------*/
  const handleAddNotes = async (place) => {
    const note = prompt("Write your memory notes:");

    if (!note) return;

    try {
      const token = localStorage.getItem("token");

      const memRes = await fetch("http://localhost:3000/api/v1/memories", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const memories = await memRes.json();

      let memory = memories.find((m) => m.place_id === place.id);

      if (!memory) {
        const createRes = await fetch("http://localhost:3000/api/v1/memories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            place_id: place.id,
            title: place.name,
          }),
        });

        memory = await createRes.json();
      }

      await fetch(`http://localhost:3000/api/v1/memories/${memory.memory_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          notes: note,
        }),
      });

      alert("Notes saved!");
    } catch (err) {
      console.error(err);
      alert("Failed to save notes");
    }
  };
  /* ---------- FAVOURITES HELPERS ---------- */
  const handleAddToFavourites = async (p) => {
    if (!user?.id) return alert("Please log in to save places.");
    setPopupStatus((prev) => ({ ...prev, [p.id]: "saving" }));
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/api/v1/favorites/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
      const token = localStorage.getItem("token");
      const res = await fetch(
        "http://localhost:3000/api/v1/favorites/visited",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_id: user.id,
            place_id: String(p.id),
            place_name: p.name,
            city: "Jaipur",
          }),
        },
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
      localStorage.setItem("token", data.token);

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
      localStorage.setItem("token", data.token);

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
          body: JSON.stringify({
            token,
            newPassword: password,
          }),
        },
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
  /* ---------- MAIN APP (UNCHANGED) ---------- */
  return (
    <div className="app-container">
      {showLocationModal &&
        createPortal(
          <div className="location-modal-backdrop">
            <div
              className="location-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="location-modal-header">
                <h3>Set your location</h3>
                <button
                  className="closee-btn"
                  onClick={() => setShowLocationModal(false)}
                >
                  ×
                </button>
              </div>

              <input
                className="vibe-input"
                value={area}
                onChange={(e) => {
                  setArea(e.target.value);
                  setActiveAction("manual");
                }}
                placeholder="Enter area (e.g. Vaishali Nagar)"
              />

              <div className="actions">
                <button
                  className={activeAction === "manual" ? "active" : ""}
                  onClick={() => {
                    setActiveAction("manual");
                    handleManualLocation();
                  }}
                  disabled={!area.trim()} // important
                >
                  Set Location
                </button>

                <button
                  className={activeAction === "gps" ? "active" : ""}
                  onClick={() => {
                    setActiveAction("gps");
                    setArea("");
                    tryGPS();
                  }}
                >
                  Use GPS
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={handleFileUpload}
      />
      {/* SIDEBAR */}
      <div className="sidebar">
        <div
          className={`sidebar-icon ${
            location.pathname === "/" ? "active purple" : ""
          }`}
          onClick={() => navigate("/")}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 5l6-2 6 2 6-2v14l-6 2-6-2-6 2z"
              stroke="white"
              strokeWidth="2"
            />
          </svg>
        </div>

        <div
          className={`sidebar-icon ${
            location.pathname === "/photos" ? "active purple" : ""
          }`}
          onClick={() => navigate("/photos")}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect
              x="3"
              y="5"
              width="18"
              height="14"
              rx="2"
              stroke="white"
              strokeWidth="2"
            />
            <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="2" />
          </svg>
        </div>

        <div
          className={`sidebar-icon ${
            location.pathname === "/favorites" ? "active purple" : ""
          }`}
          onClick={() => navigate("/favorites")}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 20l-7-6a5 5 0 017-7 5 5 0 017 7z"
              stroke="white"
              strokeWidth="2"
            />
          </svg>
        </div>

        <div
          className={`sidebar-icon ${
            location.pathname === "/places" ? "active purple" : ""
          }`}
          onClick={() => navigate("/places")}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 21s6-5.5 6-10a6 6 0 10-12 0c0 4.5 6 10 6 10z"
              stroke="white"
              strokeWidth="2"
            />
          </svg>
        </div>

        <div
          className={`sidebar-icon sidebar-bottom ${
            showProfile ? "active purple" : ""
          }`}
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
            background: "#E5E7EB" /* same as vibe input */,
            display: "flex",
            alignItems: "center",
            padding: "0 6px",
            //boxShadow: "0 10px 24px rgba(0,0,0,0.10)",
            marginBottom: "12px",
            marginTop: "-10px", // ✅ shifted slightly upwards
          }}
        >
          <div style={{ marginRight: "2px" }}>
            <svg
              width="58"
              height="58"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Globe Outer */}
              <circle cx="32" cy="32" r="18" fill="#7C3AED" opacity="0.95" />

              {/* Globe Highlight */}
              <circle cx="26" cy="26" r="12" fill="white" opacity="0.12" />

              {/* Latitude Line */}
              <path
                d="M14 32H50"
                stroke="white"
                strokeWidth="2.6"
                strokeLinecap="round"
                opacity="0.85"
              />

              {/* Longitude Curves */}
              <path
                d="M32 14C26 20 26 44 32 50"
                stroke="white"
                strokeWidth="2.4"
                strokeLinecap="round"
                opacity="0.7"
              />
              <path
                d="M32 14C38 20 38 44 32 50"
                stroke="white"
                strokeWidth="2.4"
                strokeLinecap="round"
                opacity="0.7"
              />

              {/* Top Curve */}
              <path
                d="M20 22C24 25 40 25 44 22"
                stroke="white"
                strokeWidth="2.4"
                strokeLinecap="round"
                opacity="0.6"
              />

              {/* Bottom Curve */}
              <path
                d="M20 42C24 39 40 39 44 42"
                stroke="white"
                strokeWidth="2.4"
                strokeLinecap="round"
                opacity="0.6"
              />
            </svg>
          </div>

          {/* App Name */}
          <span
            style={{
              fontSize: "28px",
              fontWeight: "900",
              color: "#111827",
              letterSpacing: "-0.5px",
            }}
          >
            VibeScape
          </span>
        </div>

        <Routes>
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
                    <h2
                      style={{
                        fontSize: "26px",
                        fontWeight: "900",
                        color: "#111827",
                        margin: 0,
                      }}
                    >
                      Account Settings
                    </h2>
                    <p
                      style={{
                        margin: "6px 0 0",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#6B7280",
                      }}
                    >
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
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0px)";
                    }}
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
                  }}
                >
                  {/* SECTION HEADER */}
                  <div style={{ marginBottom: "14px" }}>
                    <h3
                      style={{
                        fontSize: "16px",
                        fontWeight: "900",
                        color: "#111827",
                        margin: 0,
                      }}
                    >
                      Basic Info
                    </h3>
                    <p
                      style={{
                        margin: "6px 0 0",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#6B7280",
                      }}
                    >
                      Update your personal information
                    </p>
                  </div>

                  {/* INFO ROWS */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    {/* User Logged In */}
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
                      <span
                        style={{
                          fontWeight: "900",
                          color: "#111827",
                          fontSize: "15px",
                        }}
                      >
                        User logged in
                      </span>
                      <span
                        style={{
                          fontWeight: "700",
                          color: "#6B7280",
                          fontSize: "14px",
                        }}
                      >
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
                      <span
                        style={{
                          fontWeight: "900",
                          color: "#111827",
                          fontSize: "15px",
                        }}
                      >
                        Email
                      </span>
                      <span
                        style={{
                          fontWeight: "700",
                          color: "#6B7280",
                          fontSize: "14px",
                        }}
                      >
                        {user?.email || ""}
                      </span>
                    </div>

                    {/* Nickname */}
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
                      <span style={{ fontWeight: "900", color: "#111827" }}>
                        Nickname
                      </span>

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
                          e.currentTarget.style.border =
                            "1px solid rgba(124,58,237,0.65)";
                          e.currentTarget.style.boxShadow =
                            "0 0 0 4px rgba(124,58,237,0.15)";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.border =
                            "1px solid rgba(0,0,0,0.10)";
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
                      margin: "18px auto 0", // ✅ center
                      display: "block", // ✅ center
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
              </div>
            }
          />

          <Route
            path="/"
            element={
              <div className="search-section">
                <MapContainer
                  center={
                    userLocation
                      ? [userLocation.lat, userLocation.lon]
                      : [26.9124, 75.7873]
                  }
                  zoom={9}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <RecenterMap userLocation={userLocation} />
                  {userLocation && (
                    <Marker
                      position={[userLocation.lat, userLocation.lon]}
                      icon={userMarker}
                    >
                      <Tooltip
                        direction="auto"
                        offset={[0, -20]}
                        opacity={0.7}
                        permanent={false}
                        className="user-tooltip"
                      >
                        You are here
                      </Tooltip>
                    </Marker>
                  )}
                  {places.map((p) => (
                    <Marker
                      key={p.id}
                      position={[p.latitude, p.longitude]}
                      icon={purpleMarker}
                    >
                      <Tooltip
                        direction="auto"
                        offset={[0, -20]}
                        opacity={0.7}
                        permanent={false}
                        className="place-tooltip"
                      >
                        <div className="place-tooltip-content">
                          <div className="place-name">{p.name}</div>
                        </div>
                      </Tooltip>
                      <Popup
                        autoPan={true}
                        keepInView={true}
                        maxWidth={220}
                        closeButton={true}
                      >
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
                          {/* PLACE NAME */}
                          <div
                            style={{
                              fontWeight: 800,
                              fontSize: "14px",
                              marginBottom: "6px",
                              color: "#1f1f1f",
                            }}
                          >
                            {p.name}
                          </div>

                          {/* OPTIONS DROPDOWN */}
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

                            <div
                              style={{
                                marginTop: "10px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "6px",
                                fontSize: "13px",
                              }}
                            >
                              {/* ADD TO MEMORIES */}
                              <div
                                style={{
                                  padding: "8px 10px",
                                  borderRadius: "12px",
                                  background: "rgba(255,255,255,0.55)",
                                  border: "1px solid rgba(0,0,0,0.06)",
                                }}
                              >
                                <div
                                  style={{
                                    fontWeight: 800,
                                    marginBottom: "6px",
                                  }}
                                >
                                  Add to Memories
                                </div>

                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "5px",
                                  }}
                                >
                                  <div
                                    style={{
                                      padding: "6px 8px",
                                      borderRadius: "10px",
                                      cursor: "pointer",
                                      transition: "0.2s",
                                    }}
                                    onClick={() => handleAddNotes(p)}
                                    onMouseEnter={(e) =>
                                      (e.currentTarget.style.background =
                                        "rgba(124,58,237,0.12)")
                                    }
                                    onMouseLeave={(e) =>
                                      (e.currentTarget.style.background =
                                        "transparent")
                                    }
                                  >
                                    📝 Add Notes
                                  </div>

                                  <div
                                    style={{
                                      padding: "6px 8px",
                                      borderRadius: "10px",
                                      cursor: "pointer",
                                      transition: "0.2s",
                                    }}
                                    onClick={() => handleAddPhoto(p)}
                                    onMouseEnter={(e) =>
                                      (e.currentTarget.style.background =
                                        "rgba(124,58,237,0.12)")
                                    }
                                    onMouseLeave={(e) =>
                                      (e.currentTarget.style.background =
                                        "transparent")
                                    }
                                  >
                                    📷 Add Photos
                                  </div>
                                </div>
                              </div>

                              {/* ADD TO FAVOURITES */}
                              <div
                                style={{
                                  padding: "10px",
                                  borderRadius: "12px",
                                  cursor: "pointer",
                                  fontWeight: 700,
                                  background:
                                    popupStatus[p.id] === "saved" ||
                                    popupStatus[p.id] === "already_saved"
                                      ? "rgba(124,58,237,0.15)"
                                      : "rgba(255,255,255,0.55)",
                                  border: "1px solid rgba(0,0,0,0.06)",
                                  transition: "0.2s",
                                }}
                                onClick={() => handleAddToFavourites(p)}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform =
                                    "translateY(-1px)";
                                  e.currentTarget.style.boxShadow =
                                    "0 10px 22px rgba(0,0,0,0.10)";
                                  e.currentTarget.style.background =
                                    "rgba(124,58,237,0.10)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform =
                                    "translateY(0px)";
                                  e.currentTarget.style.boxShadow = "none";
                                  e.currentTarget.style.background =
                                    popupStatus[p.id] === "saved" ||
                                    popupStatus[p.id] === "already_saved"
                                      ? "rgba(124,58,237,0.15)"
                                      : "rgba(255,255,255,0.55)";
                                }}
                              >
                                {popupStatus[p.id] === "saving" && "⭐ Saving…"}
                                {popupStatus[p.id] === "saved" &&
                                  "⭐ Saved to To Visit!"}
                                {popupStatus[p.id] === "already_saved" &&
                                  "⭐ Already saved"}
                                {!popupStatus[p.id] && "⭐ Add to Favourites"}
                              </div>

                              {/* MARK AS VISITED */}
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
                                  e.currentTarget.style.transform =
                                    "translateY(-1px)";
                                  e.currentTarget.style.boxShadow =
                                    "0 10px 22px rgba(0,0,0,0.10)";
                                  e.currentTarget.style.background =
                                    "rgba(16,185,129,0.12)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform =
                                    "translateY(0px)";
                                  e.currentTarget.style.boxShadow = "none";
                                  e.currentTarget.style.background =
                                    popupStatus[p.id] === "visited"
                                      ? "rgba(16,185,129,0.15)"
                                      : "rgba(255,255,255,0.55)";
                                }}
                              >
                                {popupStatus[p.id] === "marking" &&
                                  "✅ Saving…"}
                                {popupStatus[p.id] === "visited" &&
                                  "✅ Marked as Visited!"}
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
