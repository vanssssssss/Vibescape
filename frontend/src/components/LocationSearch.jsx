import React, { useState } from "react";
import { geocodeLocation } from "../services/locationService";

const LocationSearch = ({ onLocationSelect }) => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!input) return;

    setLoading(true);
    try {
      const data = await geocodeLocation(input);

      const location = {
        lat: parseFloat(data.lat),
        lng: parseFloat(data.lng),
        name: data.displayName
      };

      console.log("Selected Location:", location);

      onLocationSelect(location);

      // Save to localStorage
      localStorage.setItem("user_location", JSON.stringify(location));

    } catch (error) {
      alert("Location not found");
    }
    setLoading(false);
  };

  return (
    <div className="p-4">
      <input
        type="text"
        placeholder="Enter location (e.g. Ajmer, Delhi)"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="border p-2 rounded w-64"
      />

      <button
        onClick={handleSearch}
        className="ml-2 bg-blue-500 text-white px-4 py-2 rounded"
      >
        {loading ? "Searching..." : "Search"}
      </button>
    </div>
  );
};

export default LocationSearch;