import { useState } from "react";
import "./MemoriesPage.css";

const memories = [
  {
    id: 1,
    place: "Hawa Mahal",
    city: "Jaipur",
    date: "Dec 11, 2025",
    images: [
      "https://images.unsplash.com/photo-1707793044127-bf3b560353e2",
      "https://images.unsplash.com/photo-1602339752474-f77aa7d1b9fd",
    ],
    description:
      "Hawa Mahal, also known as the Palace of Winds, is famous for its 953 small windows designed to allow royal women to observe street life while remaining unseen.",
  },
  {
    id: 2,
    place: "Amber Fort",
    city: "Jaipur",
    date: "Dec 12, 2025",
    images: [
      "https://images.unsplash.com/photo-1592385692039-e8ff4c6b7a66",
      "https://images.unsplash.com/photo-1622200403409-5c98b37d4c3a",
    ],
    description:
      "Amber Fort is a majestic hilltop fort known for its artistic Hindu-style architecture and the stunning Sheesh Mahal (Mirror Palace).",
  },
  {
    id: 3,
    place: "City Palace",
    city: "Jaipur",
    date: "Dec 10, 2025",
    images: [
      "https://images.unsplash.com/photo-1673807095836-0904031b4f43",
      "https://images.unsplash.com/photo-1599661046827-dacff0a6a86b",
    ],
    description:
      "City Palace is a blend of Mughal and Rajput architecture and continues to serve as the residence of the Jaipur royal family.",
  },
];

export default function MemoriesPage() {
  const [selected, setSelected] = useState(null);
  const [imageIndex, setImageIndex] = useState(0);

  return (
    <div className="memories-page">
      <div className="memories-header">
        <h2>Your Travel Memories</h2>

        <div className="filter-box">
          <label>Sort by city</label>
          <select>
            <option>Jaipur</option>
          </select>
        </div>
      </div>

      <div className="memories-grid">
        {memories.map((m) => (
          <div
            key={m.id}
            className="memory-card"
            onClick={() => {
              setSelected(m);
              setImageIndex(0);
            }}
          >
            <img src={m.images[0]} alt={m.place} />

            <div className="memory-info">
              <h3>{m.place}</h3>
              <p className="date">{m.date}</p>
              <p className="preview-text">{m.description}</p>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="memory-modal" onClick={() => setSelected(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-images">
              <img src={selected.images[imageIndex]} alt={selected.place} />

              <div className="image-controls">
                {selected.images.map((_, i) => (
                  <button
                    key={i}
                    className={i === imageIndex ? "active" : ""}
                    onClick={() => setImageIndex(i)}
                  />
                ))}
              </div>
            </div>

            <div className="modal-text">
              <h3>{selected.place}</h3>
              <p className="modal-date">{selected.date}</p>
              <p className="modal-desc">{selected.description}</p>
            </div>

            <button className="close-btn" onClick={() => setSelected(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
