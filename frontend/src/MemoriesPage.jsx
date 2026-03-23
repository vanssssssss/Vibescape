import { useState, useEffect } from "react";
import "./MemoriesPage.css";


export default function MemoriesPage() {
  const [selected, setSelected] = useState(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [memories, setMemories] = useState([]);

  const fetchMemories = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        "http://localhost:3000/api/v1/memories",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      const parsed = data.map((m) => ({
        ...m,
        images: Array.isArray(m.photos)
          ? m.photos
          : m.photos
          ? JSON.parse(m.photos)
          : [],
      }));

      setMemories(parsed);

    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
  fetchMemories();
  }, []);

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
            key={m.memory_id}
            className="memory-card"
            onClick={() => {
              setSelected({
                ...m,
                images: m.images || []
              });
              setImageIndex(0);
            }}
          >
            <img
              src={m.images?.[0] || "https://via.placeholder.com/300"}
              alt={m.title}
            />

            <div className="memory-info">
              <h3>{m.title || "Memory"}</h3>
              <p className="date">
                {new Date(m.created_at).toLocaleDateString()}
              </p>
              <p className="preview-text">{m.notes}</p>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="memory-modal" onClick={() => setSelected(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-images">
              <img
                src={selected.images?.[imageIndex] || "https://via.placeholder.com/400"}
                alt={selected.title}
              />

              <div className="image-controls">
                {selected.images?.map((_, i) => (
                  <button
                    key={i}
                    className={i === imageIndex ? "active" : ""}
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageIndex(i);
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="modal-text">
              <h3>{selected.title}</h3>
              <p className="modal-date">{selected.date}</p>
              <p className="modal-desc">{selected.notes}</p>
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

