import { useState } from "react";
import "./MemoriesPage.css";

/* ---------- MOCK MEMORIES DATA ---------- */
const memories = [
  {
    id: 1,
    place: "Taj Mahal",
    city: "Agra",
    date: "Dec 15, 2025",
    image:
      "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80",
    caption:
      "Witnessing the breathtaking beauty of this architectural marvel at sunrise."
  },
  {
    id: 2,
    place: "Hawa Mahal",
    city: "Jaipur",
    date: "Dec 11, 2025",
    image:
      "https://images.unsplash.com/photo-1707793044127-bf3b560353e2?auto=format&fit=crop&w=800&q=80",
    caption:
      "The Palace of Winds with its iconic pink honeycomb architecture."
  },
  {
    id: 3,
    place: "India Gate",
    city: "Delhi",
    date: "Dec 5, 2025",
    image:
      "https://images.unsplash.com/photo-1688781298681-ae1f2d470b31?auto=format&fit=crop&w=800&q=80",
    caption:
      "A peaceful evening walk around this iconic war memorial."
  }
];

/* ---------- COMPONENT ---------- */
export default function MemoriesPage() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="memories-page">
      <h2 className="memories-title">Your Travel Memories</h2>

      <div className="memories-grid">
        {memories.map((memory) => (
          <div
            key={memory.id}
            className="memory-card"
            onClick={() => setSelected(memory)}
          >
            <img src={memory.image} alt={memory.place} />
            <div className="memory-info">
              <h3>{memory.place}</h3>
              <p className="memory-city">{memory.city}</p>
              <p className="memory-date">{memory.date}</p>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {selected && (
        <div className="memory-modal" onClick={() => setSelected(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={selected.image} alt={selected.place} />
            <h3>{selected.place}</h3>
            <p className="modal-city">{selected.city}</p>
            <p className="modal-caption">{selected.caption}</p>
            <button onClick={() => setSelected(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
