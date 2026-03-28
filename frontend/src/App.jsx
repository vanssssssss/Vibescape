import logo from "./assets/logo.png";
import SettingsPage from "./SettingsPage";// here we are importing the settings page component which we will create later

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
  const verifyToken = location.pathname === "/verify-email" ? params.get("token") : null;

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

  const [user, setUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  const fileInputRef = useRef(null);
  const [selectedPlace, setSelectedPlace] = useState(null);

  const [userLocation, setUserLocation] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [area, setArea] = useState("");
  const [activeAction, setActiveAction] = useState(null);
  // values: "manual" | "gps"

  const [confirmPassword, setConfirmPassword] = useState("");// added for the usestate of confirm password in registration form
  const [error, setError] = useState(""); //set
  const [message, setMessage] = useState("");
  const [loadingAuth, setLoadingAuth] = useState(false);
  const verifyCalledRef = useRef(false);//

  useEffect(() => {
    if (!verifyToken) return;
    if (verifyCalledRef.current) return;  // ← ADD
    verifyCalledRef.current = true;        // ← ADD
    console.log(verifyToken);
    const verifyEmail = async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/api/v1/auth/verify-email?token=${verifyToken}`
        );
        const data = await res.json();
        console.log(data);
        if (!res.ok) throw new Error(data.message || "Verification failed");
        setMessage(data.message);
      } catch (err) {
        setError(err.message || "Verification failed");
      }
    };
    verifyEmail();
  }, [verifyToken]); // ← changed from resetToken to verifyToken
  useEffect(() => {
    if (location.pathname === "/verify-email") return;
    setEmail("");
    setPassword("");
    setError("");
    setMessage("");
  }, [authMode]); // ← remove location.pathname

  useEffect(() => {
    if (location.pathname === "/verify-email") return;
    setError("");
  }, [authStep]); // ← remove location.pathname

  /* ---------- location resolver ---------- */

  const resolveLocation = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setShowLocationModal(true);
        return resolve(null);
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            source: "gps",
          };

          setUserLocation(loc); // UI sync
          resolve(loc); // DATA return
        },
        () => {
          setShowLocationModal(true);
          resolve(null);
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

  const handleSearchWithLocation = async (loc) => {
    if (!query.trim()) return;

    setLoading(true);

    try {
      const res = await fetch(
        `http://localhost:3000/api/v1/search?vibe=${query}&lat=${loc.lat}&lon=${loc.lon}&radius=5000`,
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

  const handleSearch = async () => {
    if (!query.trim()) return;
    console.log(userLocation);
    let loc = userLocation;

    if (!loc) {
      loc = await resolveLocation();
      if (!loc) return;
    }

    console.log(userLocation);

    handleSearchWithLocation(loc);
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
    setError(""); // ✅ add here
    try {
      const res = await fetch("http://localhost:3000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      //if (!res.ok) throw new Error(data.message);
      if (!res.ok) {
        if (data.message?.toLowerCase().includes("verify") ||
          data.message?.toLowerCase().includes("verified")) {
          setAuthStep("unverified");
          return;
        }
        throw new Error(data.message);
      }

      //  for the settings page removed this setUser({ email, id: data.user_id });
      setUser({
        id: data.user_id,
        email: data.email || email,
        nickname: data.name || name,
        profile_image: null,
      });
      setIsAuthenticated(true);
      navigate("/");
    } catch (err) {
      setError(err.message || "Invalid email or password");
    }
  };

  const handleRegister = async () => {
    setError("");
    setMessage("");
    setLoadingAuth(true);

    if (!name || !email || !password || !confirmPassword) {
      setError("All fields are required");
      setLoadingAuth(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoadingAuth(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          confirmPassword,
        }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch { }

      // console.log("REGISTER RESPONSE:", data);

      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }

      // ✅ SUCCESS
      setMessage("Verification link sent! Please check your email before logging in.");

      // clear form
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      // move to login screen
      // setAuthMode("login");

    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleResendVerification = async () => {
    setMessage("");
    setError("");
    try {
      const res = await fetch("http://localhost:3000/api/v1/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setMessage(data.msg || "Verification email sent!");
    } catch {
      setError("Failed to resend. Try again.");
    }
  };

  const handleForgotPassword = async () => {
    setError(""); // ✅ ADD THIS
    try {
      await fetch("http://localhost:3000/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      setMessage("The reset link was sent.");
      //setAuthStep("auth");
    } catch {
      setMessage("Failed to send reset email");
    }
  };

  const handleResetPassword = async (token) => {
    setError(""); // ✅ ADD THIS
    try {
      const res = await fetch(
        "http://localhost:3000/api/v1/auth/reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            newPassword: password,
            confirmPassword: confirmPassword
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setMessage("Password reset successful. Please login.");

      setTimeout(() => {
        setAuthStep("auth");
        navigate("/");
      }, 3000); // 2 seconds delay
    } catch (err) {
      setMessage(err.message || "Password reset failed");
    }
  };

  /* ---------- AUTH GUARD ---------- */
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route
          path="/verify-email"
          element={
            <div className="auth-screen">
              <h1 className="auth-brand">VibeScape</h1>
              <div className="auth-wrapper">
                <div className="auth-card-glass">
                  <h2 className="auth-title">
                    {error
                      ? "❌ Verification Failed"
                      : message
                        ? "✅ Email Verified"
                        : "⏳ Verifying..."}
                  </h2>

                  <p style={{ textAlign: "center", fontWeight: "600" }}>
                    {error
                      ? error
                      : message
                        ? message
                        : "Verifying your email..."}
                  </p>

                  {message && (
                    <button
                      className="auth-btn"
                      style={{ marginTop: "15px" }}
                      onClick={() => navigate("/")}
                    >
                      Go to Login →
                    </button>
                  )}
                </div>
              </div>
            </div>
          }
        />
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
                          className={authMode === "login" ? "auth-tab active" : "auth-tab"}
                          onClick={() => {
                            setAuthMode("login");
                            setEmail("");
                            setPassword("");
                          }}
                        >
                          Login
                        </button>

                        <button
                          className={authMode === "register" ? "auth-tab active" : "auth-tab"}
                          onClick={() => {
                            setAuthMode("register");
                            setEmail("");
                            setPassword("");
                          }}
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
                          {error && (
                            <p style={{ color: "red", fontSize: "14px", marginBottom: "10px" }}>
                              {error}
                            </p>
                          )}
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
                            onChange={(e) => {
                              setName(e.target.value);
                              setError("");
                            }}
                          />
                          <input
                            className="auth-input"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              setError("");
                            }}
                          />
                          <input
                            className="auth-input"
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value);
                              setError("");
                            }}
                          />
                          <input // input field for confirm password in registration form
                            className="auth-input"
                            type="password"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => {
                              setConfirmPassword(e.target.value);
                              setError("");
                            }}
                          />
                          {error && (
                            <p style={{ color: "red", fontSize: "14px", marginBottom: "10px" }}>
                              {error}
                            </p>
                          )}
                          {message && (
                            <p style={{ color: "green", fontSize: "14px", marginBottom: "10px" }}>
                              {message}
                            </p>
                          )}


                          <button
                            className="auth-btn"
                            onClick={handleRegister}
                            disabled={loadingAuth}
                          >
                            {loadingAuth ? "Creating..." : "Create Account"}
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
                      {message && (
                        <p style={{ color: "green", fontSize: "14px", marginBottom: "10px" }}>
                          {message}
                        </p>
                      )}
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
                  {authStep === "unverified" && (
                    <>
                      <h2 className="auth-title">Email Not Verified</h2>
                      <p style={{
                        textAlign: "center", fontSize: "14px",
                        color: "#6B7280", marginBottom: "16px"
                      }}>
                        Please verify your email before logging in.
                      </p>
                      <input
                        className="auth-input"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      {message && (
                        <p style={{ color: "green", fontSize: "14px", marginBottom: "10px" }}>
                          {message}
                        </p>

                      )}
                      {error && (
                        <p style={{ color: "red", fontSize: "14px", marginBottom: "10px" }}>
                          {error}
                        </p>
                      )}
                      <button className="auth-btn" onClick={handleResendVerification}>
                        Resend Verification Email
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
                      <input
                        className="auth-input"
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      {message && (
                        <p style={{ color: "green", fontSize: "14px", marginBottom: "10px" }}>
                          {message}
                        </p>
                      )}
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
          className={`sidebar-icon ${location.pathname === "/" ? "active purple" : ""
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
          className={`sidebar-icon ${location.pathname === "/photos" ? "active purple" : ""
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
          className={`sidebar-icon ${location.pathname === "/favorites" ? "active purple" : ""
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
          className={`sidebar-icon ${location.pathname === "/places" ? "active purple" : ""
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
          //sidebar new one added for the settings page with the profile image and the first letter of the nickname if the profile image is not available
          className={`sidebar-icon sidebar-bottom ${location.pathname === "/settings" ? "active purple" : ""
            }`}
          onClick={() => navigate("/settings")}
        >
          {user?.profile_image ? (
            <img
              src={user.profile_image}
              alt="profile"
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "#7C3AED",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "12px",
                fontWeight: "700",
              }}
            >
              {user?.nickname?.[0]?.toUpperCase() || "U"}
            </div>
          )}
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

          {/* here removed the old ui page and made changes to the settings page  added the new route below*/}
          <Routes>
            <Route
              path="/settings"
              element={
                <SettingsPage
                  user={user}
                  setUser={setUser}
                  navigate={navigate}
                />
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
