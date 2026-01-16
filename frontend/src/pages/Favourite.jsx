import { useState } from "react";
import "./Favourite.css";

const initialPlaces = [
  {
    id: 1,
    name: "Hawa Mahal",
    city: "Jaipur",
    visited: false,
    addedOn: "2026-01-10"
  },
  {
    id: 2,
    name: "India Gate",
    city: "Delhi",
    visited: false,
    addedOn: "2026-01-10"
  },
  {
    id: 3,
    name: "Amber Fort",
    city: "Jaipur",
    visited: true,
    addedOn: "2026-01-10"
  }
];

export default function Favourites() {
  const [places, setPlaces] = useState(initialPlaces);
  const [filter, setFilter] = useState("all");

  const toggleVisited = (id) => {
    setPlaces((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, visited: !p.visited } : p
      )
    );
  };

  const filteredPlaces = places.filter((p) => {
    if (filter === "visited") return p.visited;
    if (filter === "tovisit") return !p.visited;
    return true;
  });

  return (
    <div className="favourites-page">
      {/* ✅ MEMORIES-LIKE WHITE BOX */}
      <div className="favourites-wrapper">
        <h2 className="fav-title">Saved Places</h2>
        <p className="fav-subtitle">Places you saved to visit later</p>

        {/* FILTERS */}
        <div className="fav-filters">
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={filter === "tovisit" ? "active" : ""}
            onClick={() => setFilter("tovisit")}
          >
            To Visit
          </button>
          <button
            className={filter === "visited" ? "active" : ""}
            onClick={() => setFilter("visited")}
          >
            Visited
          </button>
        </div>

        {/* LIST */}
        <div className="fav-list">
          {filteredPlaces.length === 0 && (
            <p className="empty-text">No places here yet ✨</p>
          )}

          {filteredPlaces.map((place) => (
            <div
              key={place.id}
              className={`fav-card ${place.visited ? "visited" : ""}`}
            >
              <div className="fav-left">
                <h3>{place.name}</h3>
                <span className="fav-city">{place.city}</span>
                <span className="fav-date">{place.addedOn}</span>
              </div>

              <button
                className="visit-btn"
                onClick={() => toggleVisited(place.id)}
              >
                {place.visited ? "Visited ✓" : "Mark as Visited"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
