import { useState } from "react";

const mockPlaces = [
  { id: 1, name: "Hawa Mahal", city: "Jaipur", visited: false },
  { id: 2, name: "Taj Mahal", city: "Agra", visited: true },
  { id: 3, name: "India Gate", city: "Delhi", visited: false },
];

export default function Favorites() {
  const [places, setPlaces] = useState(mockPlaces);
  const [showVisited, setShowVisited] = useState(false);

  const toggleVisited = (id) => {
    setPlaces((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, visited: !p.visited } : p
      )
    );
  };

  const filteredPlaces = places.filter(
    (p) => p.visited === showVisited
  );

  return (
    <div style={{ padding: "20px" }}>
      <h2>Saved Places</h2>
      <p>Places you saved to visit later</p>

      {/* Tabs */}
      <div style={{ margin: "16px 0" }}>
        <button
          onClick={() => setShowVisited(false)}
          style={{
            marginRight: "10px",
            fontWeight: !showVisited ? "bold" : "normal",
          }}
        >
          To Visit
        </button>

        <button
          onClick={() => setShowVisited(true)}
          style={{
            fontWeight: showVisited ? "bold" : "normal",
          }}
        >
          Visited
        </button>
      </div>

      {/* List */}
      {filteredPlaces.length === 0 ? (
        <p>No places here yet.</p>
      ) : (
        <ul>
          {filteredPlaces.map((place) => (
            <li
              key={place.id}
              style={{
                marginBottom: "12px",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "8px",
              }}
            >
              <strong>{place.name}</strong> — {place.city}

              <button
                onClick={() => toggleVisited(place.id)}
                style={{ marginLeft: "12px" }}
              >
                {place.visited ? "Mark as To Visit" : "Mark as Visited"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
