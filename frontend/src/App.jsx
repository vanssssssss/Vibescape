import logo from "./assets/logo.png";
import SettingsPage from "./SettingsPage"; // here we are importing the settings page component which we will create later
import FeaturesPage from "./FeaturesPage";
import API_BASE_URL from "./config/api";// api import

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
import debounce from "lodash.debounce";

/* ---------- PURPLE MARKER ---------- */
const purpleMarker = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [15, 24],
  iconAnchor: [10, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const bigPurpleMarker = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [18, 28],
  iconAnchor: [10, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const smallPurpleMarker = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [12, 20],
  iconAnchor: [7, 22],
  popupAnchor: [1, -20],
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
      map.setView([userLocation.lat, userLocation.lon], 12);
    }
  }, [userLocation, map]);

  return null;
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const resetToken = params.get("token");
  const verifyToken =
    location.pathname === "/verify-email" ? params.get("token") : null;

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
  // const [popupStatus, setPopupStatus] = useState({}); // track per-place action state

  const [user, setUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  const fileInputRef = useRef(null);
  const [selectedPlace, setSelectedPlace] = useState(null);

  const [userLocation, setUserLocation] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [area, setArea] = useState("");
  const [activeAction, setActiveAction] = useState(null); // values: "manual" | "gps"
  const [suggestions, setSuggestions] = useState([]);

  const [confirmPassword, setConfirmPassword] = useState(""); // added for the usestate of confirm password in registration form
  const [error, setError] = useState(""); //set
  const [message, setMessage] = useState("");
  const [loadingAuth, setLoadingAuth] = useState(false);
  const verifyCalledRef = useRef(false);

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [placeState, setPlaceState] = useState({});

  const [loadingUser, setLoadingUser] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  const [addingPhoto, setAddingPhoto] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    if (!verifyToken) return;
    if (verifyCalledRef.current) return; // ← ADD
    verifyCalledRef.current = true; // ← ADD
    console.log(verifyToken);
    const verifyEmail = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/v1/auth/verify-email?token=${verifyToken}`,
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

  /* ---------- STAR RENDERER HELPER ---------- */
  const renderStars = (rating, isInteractive = false) => {
    return (
      <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            style={{
              fontSize: isInteractive ? "36px" : "18px",
              cursor: isInteractive ? "pointer" : "default",
              color:
                star <= (hoverRating || (isInteractive ? userRating : rating))
                  ? "#FBBF24"
                  : "#D1D5DB",
              transition: "0.1s",
            }}
            onClick={() => isInteractive && setUserRating(star)}
            onMouseEnter={() => isInteractive && setHoverRating(star)}
            onMouseLeave={() => isInteractive && setHoverRating(0)}
          >
            ★
          </span>
        ))}
        {!isInteractive && (
          <span
            style={{
              fontSize: "13px",
              fontWeight: "900",
              marginLeft: "5px",
              color: "#4B5563",
            }}
          >
            {rating || "0.0"}
          </span>
        )}
      </div>
    );
  };

  /* ---------- location resolver ---------- */
  useEffect(() => {
    const token = localStorage.getItem("token");
    //const guest = localStorage.getItem("guest"); // ✅ ADD

    if (token) {
      setIsAuthenticated(true);
      setIsGuest(false);
      fetchUser().finally(() => setLoadingUser(false));
      console.log(user);
    } else {
      setLoadingUser(false);
    }
  }, []);

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
      () => setActionMessage("Location permission denied"),
    );
  };
  const fetchUser = async () => {
    const token = localStorage.getItem("token");

    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // 🔥 ADD THIS BLOCK HERE
      if (!res.ok) {
        localStorage.removeItem("token");

        setIsAuthenticated(false); // 🔥 Adding this one tooo
        setUser(null);
        return;
      }

      const data = await res.json();

      setUser({
        id: data.user_id, // 🔥 IMPORTANT (missing earlier)
        email: data.email,
        nickname: data.nickname,
        profile_pic: data.profile_pic,
      });
    } catch (err) {
      console.log("Failed to fetch user");
    }
  };

  const handleAreaChange = (e) => {
    const value = e.target.value;
    setArea(value);
    setActiveAction("manual");

    debouncedFetch(value);
  };

  // ← ADD HERE
  useEffect(() => {
    if (!actionMessage) return;
    const timer = setTimeout(() => setActionMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [actionMessage]);

  const fetchSuggestions = async (query) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/geocode/autocomplete?q=${encodeURIComponent(query)}`,
      );

      const data = await res.json();

      setSuggestions(data);
    } catch {
      console.error("Autocomplete failed");
      setSuggestions([]);
    }
  };

  const debouncedFetch = useRef(
    debounce((q) => fetchSuggestions(q), 300),
  ).current;

  const handleSelectSuggestion = (place) => {
    setArea(place.label);
    setSuggestions([]);

    setUserLocation({
      lat: place.lat,
      lon: place.lon,
      source: "manual",
    });

    setShowLocationModal(false);
  };

  const handleManualLocation = async () => {
    if (!area.trim()) return;

    try {
      const res = await fetch();
      //our navigator backend api

      const data = await res.json();
      const result = data.results[0];

      if (!result) {
        setActionMessage("Location not found. Try another area.");
        return;
      }

      setUserLocation({
        lat: result.geometry.lat,
        lon: result.geometry.lng,
        source: "manual",
      });

      setShowLocationModal(false);
    } catch {
      setActionMessage("Location not found. Try another area.");
    }
  };

  useEffect(() => {
    return () => {
      debouncedFetch.cancel();
    };
  }, []);

  useEffect(() => {
    if (!userLocation) return;
    if (!query.trim()) return;

    handleSearchWithLocation(userLocation);
  }, [userLocation]);

  const handleGoHere = (place) => {
    const newLocation = {
      lat: place.latitude,
      lon: place.longitude,
      source: "place",
    };

    setUserLocation(newLocation);

    handleSearchWithLocation(newLocation);
  };

  /* ---------- SEARCH (UNCHANGED) ---------- */

  const handleSearchWithLocation = async (loc) => {
    if (!query.trim()) return;

    setLoading(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/search?vibe=${query}&lat=${loc.lat}&lon=${loc.lon}&radius=200000000`,
      );

      const data = await res.json();

      const results = (data.places || []).map((p) => ({
        ...p,
        latitude: p.latitude ?? p.lat,
        longitude: p.longitude ?? p.lng,
      }));

      setPlaces(results);

      if (results.length === 0) {
        setActionMessage("No recommended places found for this vibe nearby.");
      }
    } catch {
      setActionMessage("Search failed. Check connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      setActionMessage("Enter a vibe to search places.");
      return;
    }
    console.log(userLocation);
    let loc = userLocation;

    if (!loc) {
      loc = await resolveLocation();
      if (!loc) {
        setActionMessage("Location required to search nearby places.");
        return;
      }
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

    setAddingPhoto(true);

    try {
      const token = localStorage.getItem("token");

      const authRes = await fetch(
        `${API_BASE_URL}/api/v1/memories/imagekit-auth`,
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
      // console.log(imageUrl);

      const memRes = await fetch(`${API_BASE_URL}/api/v1/memories`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const memories = await memRes.json();

      let memory = memories.find((m) => m.place_id === selectedPlace.id);

      if (!memory) {
        const createRes = await fetch(`${API_BASE_URL}/api/v1/memories`, {
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
        `${API_BASE_URL}/api/v1/memories/${memory.memory_id}/images`,
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

      setActionMessage("Photo added to memory!");
    } catch (err) {
      console.error(err);
      setActionMessage("Image upload failed");
    } finally {
      setAddingPhoto(false);
    }
  };

  /*-----------handleAddNotes----------*/
  const handleAddNotes = (place) => {
    setSelectedPlace(place);
    setShowNoteModal(true);
  };

  const handleSaveNote = async () => {
    if (!noteText.trim()) return setShowNoteModal(false);
    setSavingNote(true);
    try {
      const token = localStorage.getItem("token");
      const memRes = await fetch(`${API_BASE_URL}/api/v1/memories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const memories = await memRes.json();
      let memory = memories.find((m) => m.place_id === selectedPlace.id);

      if (!memory) {
        const createRes = await fetch(`${API_BASE_URL}/api/v1/memories`, {
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

      await fetch(`${API_BASE_URL}/api/v1/memories/${memory.memory_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes: noteText }),
      });
      setActionMessage("Notes saved!");
      setShowNoteModal(false);
      setNoteText("");
    } catch (err) {
      setActionMessage("Failed to save notes");
    } finally {
      setSavingNote(false);
    }
  };

  /* ---------- RATING & VISITED HANDLERS ---------- */
  const handleMarkVisitedClick = async (p) => {
    if (placeState[p.id]?.status === "VISITED") return;

    const token = localStorage.getItem("token");

    await fetch(`${API_BASE_URL}/api/v1/saved-places/visited`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        place_id: p.id,
      }),
    });
    setActionMessage("Marked as visited.");
    setPlaceState((prev) => ({
      ...prev,
      [p.id]: {
        status: "VISITED",
        favorite: prev[p.id]?.favorite || false,
        rated: prev[p.id]?.rated || false,
      },
    }));

    setSelectedPlace(p);
    setShowRatingModal(true);
  };

  const submitRating = async () => {
    // 1. Update UI locally (Mock logic for average)
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/rating/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          place_id: Number(selectedPlace.id),
          rating: userRating,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setPlaceState((prev) => ({
          ...prev,
          [selectedPlace.id]: {
            ...prev[selectedPlace.id],
            rated: true,
          },
        }));

        setPlaces((prev) =>
          prev.map((p) =>
            p.id === selectedPlace.id
              ? {
                ...p,
                average_rating: data.average_rating,
                total_ratings: data.total_ratings,
              }
              : p,
          ),
        );
      }
    } catch (err) {
      console.error("Rating failed");
    }

    setActionMessage(`Vibe Rated: ${userRating} Stars!`);
    setShowRatingModal(false);
    setUserRating(0);
  };

  /* ---------- FAVOURITES HELPERS ---------- */
  const handleAddToVisit = async (p) => {
    if (placeState[p.id]?.status === "TO_VISIT") return;
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE_URL}/api/v1/saved-places`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        place_id: p.id,
      }),
    });

    if (res.ok) {
      setActionMessage("Added to your To Visit list.");
      setPlaceState((prev) => ({
        ...prev,
        [p.id]: {
          status: "TO_VISIT",
          favorite: false,
          rated: false,
        },
      }));
    }
  };

  const toggleFavorite = async (p) => {
    const token = localStorage.getItem("token");

    const res = await fetch(
      `${API_BASE_URL}/api/v1/saved-places/favorites`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          place_id: p.id,
        }),
      },
    );

    if (res.ok) {
      setActionMessage(
        placeState[p.id]?.favorite
          ? "Removed from favorites."
          : "Added to favorites.",
      );
      setPlaceState((prev) => ({
        ...prev,
        [p.id]: {
          ...prev[p.id],
          favorite: !prev[p.id]?.favorite,
        },
      }));
    }
  };

  /* ---------- AUTH HANDLERS ---------- */

  const handleLogin = async () => {
    console.log(API_BASE_URL);
    setError(""); // ✅ add here
    console.log(`${API_BASE_URL}/api/v1/auth/login`);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });


      const data = await res.json();

      //if (!res.ok) throw new Error(data.message);
      if (!res.ok) {
        if (
          data.message?.toLowerCase().includes("verify") ||
          data.message?.toLowerCase().includes("verified")
        ) {
          setAuthStep("unverified");
          return;
        }
        throw new Error(data.message);
      }

      /* localStorage.setItem("token", data.token);
       await fetchUser(); 
       setIsAuthenticated(true);
       setIsGuest(false);
       localStorage.removeItem("guest"); 
       navigate("/places"); */

      localStorage.setItem("token", data.token);

      //decode role from JWT
      const payload = JSON.parse(atob(data.token.split(".")[1]));
      const role = payload.role;

      await fetchUser();

      setIsAuthenticated(true);
      setIsGuest(false);
      localStorage.removeItem("guest");

      // ✅ role-based navigation
      if (role === "admin") {
        navigate("/admin");
      } else {
        navigate("/places");
      }

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
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
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

      console.log("REGISTER RESPONSE:", data);

      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }

      // ✅ SUCCESS
      setMessage(
        "Verification link sent! Please check your email before logging in.",
      );

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
      const res = await fetch(
        `${API_BASE_URL}/api/v1/auth/resend-verification`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );
      const data = await res.json();
      setMessage(data.msg || "Verification email sent!");
    } catch {
      setError("Failed to resend. Try again.");
    }
  };

  const handleForgotPassword = async () => {
    setError(""); // ✅ ADD THIS
    try {
      await fetch(`${API_BASE_URL}/api/v1/auth/forgot-password`, {
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
        `${API_BASE_URL}/api/v1/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            newPassword: password,
            confirmPassword: confirmPassword,
          }),
        },
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

  // function to check if user is admin based on JWT role
  const isAdmin = () => {
    const token = localStorage.getItem("token");
    if (!token) return false;

    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role === "admin";
  };

  /* ---------- AUTH GUARD ---------- */
  if (loadingUser) return null;
  if (!isAuthenticated && !user && !isGuest) {
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
                          className={
                            authMode === "login"
                              ? "auth-tab active"
                              : "auth-tab"
                          }
                          onClick={() => {
                            setAuthMode("login");
                            setEmail("");
                            setPassword("");
                          }}
                        >
                          Login
                        </button>

                        <button
                          className={
                            authMode === "register"
                              ? "auth-tab active"
                              : "auth-tab"
                          }
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
                            <p
                              style={{
                                color: "red",
                                fontSize: "14px",
                                marginBottom: "10px",
                              }}
                            >
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
                            <p
                              style={{
                                color: "red",
                                fontSize: "14px",
                                marginBottom: "10px",
                              }}
                            >
                              {error}
                            </p>
                          )}
                          {message && (
                            <p
                              style={{
                                color: "green",
                                fontSize: "14px",
                                marginBottom: "10px",
                              }}
                            >
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
                          setIsAuthenticated(false);
                          setIsGuest(true);
                          // localStorage.setItem("guest", "true"); // ✅ ADD THIS
                          navigate("/places");
                        }}
                      >
                        Guest Mode →
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
                        <p
                          style={{
                            color: "green",
                            fontSize: "14px",
                            marginBottom: "10px",
                          }}
                        >
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
                      <p
                        style={{
                          textAlign: "center",
                          fontSize: "14px",
                          color: "#6B7280",
                          marginBottom: "16px",
                        }}
                      >
                        Please verify your email before logging in.
                      </p>
                      <input
                        className="auth-input"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      {message && (
                        <p
                          style={{
                            color: "green",
                            fontSize: "14px",
                            marginBottom: "10px",
                          }}
                        >
                          {message}
                        </p>
                      )}
                      {error && (
                        <p
                          style={{
                            color: "red",
                            fontSize: "14px",
                            marginBottom: "10px",
                          }}
                        >
                          {error}
                        </p>
                      )}
                      <button
                        className="auth-btn"
                        onClick={handleResendVerification}
                      >
                        Resend Verification Email
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
                      <input
                        className="auth-input"
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      {message && (
                        <p
                          style={{
                            color: "green",
                            fontSize: "14px",
                            marginBottom: "10px",
                          }}
                        >
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

              <div className="autocomplete-wrapper">
                <input
                  className="vibe-input"
                  value={area}
                  onChange={handleAreaChange}
                  placeholder="Enter area (e.g. Vaishali Nagar)"
                />

                {suggestions.length > 0 && (
                  <div className="autocomplete-dropdown">
                    {suggestions.map((s, i) => (
                      <div
                        key={i}
                        className="autocomplete-item"
                        onClick={() => handleSelectSuggestion(s)}
                      >
                        {s.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="actions">
                <button
                  className="gps-btn"
                  onClick={() => {
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
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 21s7-7.5 7-12a7 7 0 10-14 0c0 4.5 7 12 7 12z"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="9" r="2.5" stroke="white" strokeWidth="2" />
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
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 10.5L12 3l9 7.5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M5 10v10h14V10"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9 20v-6h6v6"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div
          //sidebar new one added for the settings page with the profile image and the first letter of the nickname if the profile image is not available
          className={`sidebar-icon sidebar-bottom ${location.pathname === "/settings" ? "active purple" : ""
            }`}
          onClick={() => navigate("/settings")}
        >
          {user?.profile_pic ? (
            <img
              src={user.profile_pic}
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
                setIsGuest={setIsGuest}
              //fetchUser={fetchUser}// here i have added the fetchUser function as a prop to the settings page so that after updating the user details in the settings page we can fetch the updated user details and update the user state in the app component which will reflect in the sidebar with the updated profile picture and nickname without needing to refresh the page
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
                  {places.map((p, index) => {
                    const sameLocation =
                      userLocation &&
                      Math.abs(userLocation.lat - p.latitude) < 0.00005 &&
                      Math.abs(userLocation.lon - p.longitude) < 0.00005;

                    if (sameLocation) return null;

                    let iconToUse = purpleMarker;
                    let markerOpacity = 1;

                    if (index === 0) {
                      iconToUse = bigPurpleMarker;
                    } else if (index <= 4) {
                      iconToUse = bigPurpleMarker;
                    }
                    // else if (index <= 10) {
                    //   iconToUse = purpleMarker;
                    //   markerOpacity = 0.8;
                    // }
                    else {
                      iconToUse = purpleMarker;
                      markerOpacity = 0.75;
                    }

                    return (
                      <Marker
                        key={p.id}
                        position={[p.latitude, p.longitude]}
                        icon={iconToUse}
                        opacity={markerOpacity}
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
                        <Popup maxWidth={220}>
                          <div
                            style={{
                              minWidth: "165px",
                              padding: "8px 10px",
                              borderRadius: "14px",
                              background: "rgba(255, 255, 255, 0.70)",
                              backdropFilter: "blur(14px)",
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 800,
                                fontSize: "14px",
                                marginBottom: "2px",
                              }}
                            >
                              {p.name}
                            </div>

                            {/* STAR DISPLAY IN POPUP */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                marginBottom: "8px",
                              }}
                            >
                              {renderStars(p.average_rating || 0)}
                              <span
                                style={{ fontSize: "12px", color: "#6B7280" }}
                              >
                                ({p.total_ratings || 0})
                              </span>
                            </div>

                            <div
                              style={{
                                padding: "8px",
                                borderRadius: "10px",
                                background: "#ede9fe",
                                color: "#4c1d95",
                                fontWeight: 700,
                                textAlign: "center",
                                cursor: "pointer",
                                marginBottom: "10px",
                              }}
                              onClick={() => handleGoHere(p)}
                            >
                              Go Here
                            </div>

                            <details>
                              <summary
                                style={{
                                  cursor: "pointer",
                                  fontSize: "13px",
                                  fontWeight: 700,
                                  color: "#4c1d95",
                                  listStyle: "none",
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
                                }}
                              >
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
                                      padding: "6px",
                                      cursor: isGuest
                                        ? "not-allowed"
                                        : "pointer",
                                      opacity: isGuest ? 0.5 : 1,
                                    }}
                                    onClick={() => {
                                      if (isGuest) {
                                        setActionMessage(
                                          "Login required to save memories.",
                                        );
                                        return;
                                      }
                                      handleAddNotes(p);
                                    }}
                                  >
                                    📝 Add Notes
                                  </div>
                                  <div
                                    style={{
                                      padding: "6px",
                                      cursor:
                                        isGuest || addingPhoto
                                          ? "not-allowed"
                                          : "pointer",
                                      opacity: isGuest || addingPhoto ? 0.5 : 1,
                                    }}
                                    onClick={() => {
                                      if (isGuest) {
                                        setActionMessage(
                                          "Login required to upload photos.",
                                        );
                                        return;
                                      }
                                      if (addingPhoto) return;
                                      handleAddPhoto(p);
                                    }}
                                  >
                                    {addingPhoto
                                      ? "Adding..."
                                      : "📷 Add Photos"}
                                  </div>
                                </div>
                                <div
                                  style={{
                                    padding: "10px",
                                    fontWeight: 700,
                                    cursor:
                                      isGuest ||
                                        placeState[p.id]?.status === "TO_VISIT" ||
                                        placeState[p.id]?.status === "VISITED"
                                        ? "not-allowed"
                                        : "pointer",
                                    opacity:
                                      isGuest ||
                                        placeState[p.id]?.status === "TO_VISIT" ||
                                        placeState[p.id]?.status === "VISITED"
                                        ? 0.5
                                        : 1,
                                  }}
                                  onClick={() => {
                                    if (isGuest) {
                                      setActionMessage(
                                        "Login required to save places.",
                                      );
                                      return;
                                    }
                                    if (
                                      placeState[p.id]?.status === "TO_VISIT" ||
                                      placeState[p.id]?.status === "VISITED"
                                    )
                                      return;

                                    handleAddToVisit(p);
                                  }}
                                >
                                  {placeState[p.id]?.status === "VISITED"
                                    ? "⭐ Already Visited"
                                    : placeState[p.id]?.status === "TO_VISIT"
                                      ? "⭐ Added to To Visit"
                                      : "⭐ Add to To Visit"}
                                </div>
                                <div
                                  style={{
                                    padding: "10px",
                                    fontWeight: 700,
                                    cursor:
                                      isGuest ||
                                        placeState[p.id]?.status === "VISITED"
                                        ? "not-allowed"
                                        : "pointer",
                                    opacity:
                                      isGuest ||
                                        placeState[p.id]?.status === "VISITED"
                                        ? 0.5
                                        : 1,
                                  }}
                                  onClick={() => {
                                    if (isGuest) {
                                      setActionMessage(
                                        "Login required to mark places visited.",
                                      );
                                      return;
                                    }
                                    if (placeState[p.id]?.status === "VISITED")
                                      return;
                                    handleMarkVisitedClick(p);
                                  }}
                                >
                                  {placeState[p.id]?.status === "VISITED" ? (
                                    <div
                                      style={{
                                        display: "flex",
                                        gap: "8px",
                                        alignItems: "center",
                                      }}
                                    >
                                      <span>✅ Visited!</span>

                                      <span
                                        style={{
                                          cursor:
                                            isGuest || placeState[p.id]?.rated
                                              ? "not-allowed"
                                              : "pointer",
                                          opacity:
                                            isGuest || placeState[p.id]?.rated
                                              ? 0.5
                                              : 1,
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (
                                            isGuest ||
                                            placeState[p.id]?.rated
                                          )
                                            return;

                                          setSelectedPlace(p);
                                          setShowRatingModal(true);
                                        }}
                                      >
                                        ⭐
                                      </span>

                                      <span
                                        style={{
                                          cursor: isGuest
                                            ? "not-allowed"
                                            : "pointer",
                                          opacity: isGuest ? 0.5 : 1,
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (isGuest) return;
                                          toggleFavorite(p);
                                        }}
                                      >
                                        {placeState[p.id]?.favorite
                                          ? "❤️"
                                          : "🤍"}
                                      </span>
                                    </div>
                                  ) : (
                                    "✅ Mark as Visited"
                                  )}
                                </div>
                              </div>
                            </details>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
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
          // <Route path="/favorites" element={<Favourites user={user} />} />
          <Route path="/photos" element={<MemoriesPage user={user} />} />
          <Route path="/places" element={<FeaturesPage />} />


          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>

      {/* NOTE MODAL */}
      {showNoteModal && (
        <div className="note-modal-overlay">
          <div className="note-modal-card">
            <h3>Create a Memory</h3>
            <p>
              Capture your thoughts about <strong>{selectedPlace?.name}</strong>
            </p>
            <textarea
              className="note-textarea"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="How was the vibe here?..."
              autoFocus
            />
            <div className="modal-buttons">
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowNoteModal(false);
                  setNoteText("");
                }}
              >
                Cancel
              </button>
              <button
                className="save-btn"
                onClick={handleSaveNote}
                disabled={savingNote}
              >
                {savingNote ? "Adding..." : "Save Memory"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RATING MODAL (TRIGGERED BY VISITED) */}
      {showRatingModal && (
        <div className="note-modal-overlay">
          <div className="note-modal-card">
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>⭐</div>
            <h3>Rate your visit</h3>
            <p>
              How was the vibe at <strong>{selectedPlace?.name}</strong>?
            </p>

            <div
              style={{
                margin: "20px 0",
                display: "flex",
                justifyContent: "center",
              }}
            >
              {renderStars(0, true)}
            </div>

            <div className="modal-buttons">
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowRatingModal(false);
                  setUserRating(0);
                }}
              >
                Skip
              </button>
              <button
                className="save-btn"
                disabled={userRating === 0}
                style={{ opacity: userRating === 0 ? 0.5 : 1 }}
                onClick={submitRating}
              >
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}

      {actionMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "30px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#7C3AED",
            color: "white",
            padding: "12px 24px",
            borderRadius: "12px",
            fontWeight: "700",
            fontSize: "14px",
            zIndex: 9999,
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          }}
          onClick={() => setActionMessage("")}
        >
          {actionMessage}
        </div>
      )}
    </div>
  );
}
export default App;
