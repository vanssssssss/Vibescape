import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

function App() {
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState([]);

  const handleSearch = async () => {
    try {
      const params = new URLSearchParams({
        vibe: query,          // MUST be 'vibe'
        lat: 26.9124,
        lon: 75.7873,
        radius: 2000,
      });

      const res = await fetch(
        `http://localhost:3000/api/v1/search?${params}`
      );

      const data = await res.json();

      // IMPORTANT: backend returns `places`
      setPlaces(data.places);
    } catch (err) {
      alert("Search failed");
      console.error(err);
    }
};


  return (
    <>
      <h2>VibeScape Discovery</h2>

      <input
        type="text"
        placeholder="Describe your vibe..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ width: "300px", marginRight: "10px" }}
      />

      <button onClick={handleSearch}>Search</button>

      <MapContainer
        center={[26.9124, 75.7873]}
        zoom={13}
        style={{ height: "500px", width: "100%", marginTop: "10px" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {places.map((place) => (
  <Marker
    key={place.id}
    position={[place.latitude, place.longitude]}
  >
    <Popup>
      <strong>{place.name}</strong>
      <br />
      {place.tags?.join(", ")}
    </Popup>
  </Marker>
))}

      </MapContainer>
    </>
  );
}

export default App;
