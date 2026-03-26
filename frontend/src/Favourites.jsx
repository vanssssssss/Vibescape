import { useState, useEffect } from "react";
import "./Favourite.css";

const API = "http://localhost:3000/api/v1/favorites";

export default function Favourites({ user }) {
  const [places, setPlaces] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  /* ---------- FETCH FAVOURITES ---------- */
  const fetchFavourites = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API}/${user.id}`);
      const data = await res.json();
      setPlaces(data.favorites || []);
    } catch (err) {
      console.error("Failed to fetch favourites", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavourites();
  }, [user?.id]);

  /* ---------- MARK AS VISITED ---------- */
  const handleMarkVisited = async (place) => {
    if (!user?.id) return alert("Please log in to update favourites.");
    setActionLoading(place.place_id);
    try {
      const res = await fetch(`${API}/visited`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          place_id: place.place_id,
          place_name: place.place_name,
          city: place.city || "",
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setPlaces((prev) =>
        prev.map((p) =>
          p.place_id === place.place_id ? { ...p, status: "VISITED" } : p
        )
      );
    } catch {
      alert("Could not update. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  /* ---------- REMOVE FROM FAVOURITES ---------- */
  const handleRemove = async (place) => {
    if (!user?.id) return;
    setActionLoading(place.place_id);
    try {
      const res = await fetch(`${API}/remove`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, place_id: place.place_id }),
      });
      if (!res.ok) throw new Error("Failed to remove");
      setPlaces((prev) => prev.filter((p) => p.place_id !== place.place_id));
    } catch {
      alert("Could not remove. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  /* ---------- FILTER ---------- */
  const filteredPlaces = places.filter((p) => {
    if (filter === "visited") return p.status === "VISITED";
    if (filter === "tovisit") return p.status === "TO_VISIT";
    return true;
  });

  if (!user?.id) {
    return (
      <div className="favourites-page">
        <div className="favourites-wrapper">
          <h2 className="fav-title">Saved Places</h2>
          <p className="empty-text">Please log in to see your saved places </p>
        </div>
      </div>
    );
  }

  return (
    <div className="favourites-page">
      <div className="favourites-wrapper">
        <h2 className="fav-title">Saved Places</h2>

        <div className="fav-filters">
          <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All</button>
          <button className={filter === "tovisit" ? "active" : ""} onClick={() => setFilter("tovisit")}>To Visit</button>
          <button className={filter === "visited" ? "active" : ""} onClick={() => setFilter("visited")}>Visited</button>
        </div>

        <div className="fav-list">
          {loading && <p className="empty-text">Loading…</p>}

          {!loading && filteredPlaces.length === 0 && (
            <p className="empty-text">No places here yet ✨</p>
          )}

          {!loading && filteredPlaces.map((place) => (
            <div key={place.id} className={`fav-card ${place.status === "VISITED" ? "visited" : ""}`}>
              <div className="fav-left">
                <h3>{place.place_name}</h3>
                <span className="fav-city">{place.city}</span>
                <span className="fav-date">{new Date(place.created_at).toLocaleDateString()}</span>
              </div>

              <div className="fav-actions">
                {place.status === "TO_VISIT" ? (
                  <button
                    className="visit-btn"
                    disabled={actionLoading === place.place_id}
                    onClick={() => handleMarkVisited(place)}
                  >
                    {actionLoading === place.place_id ? "Saving…" : "Mark as Visited"}
                  </button>
                ) : (
                  <button className="visit-btn visited-btn" disabled>
                    Visited ✓
                  </button>
                )}
                <button
                  className="remove-btn"
                  disabled={actionLoading === place.place_id}
                  onClick={() => handleRemove(place)}
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
