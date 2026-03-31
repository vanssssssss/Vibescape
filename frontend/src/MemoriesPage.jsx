import { useState, useEffect } from "react";
import "./MemoriesPage.css";


export default function MemoriesPage({ user }) {
  const [selected, setSelected] = useState(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [memories, setMemories] = useState([]);
  const [editingNote, setEditingNote] = useState(false);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

if (!user?.id) {
  return (
    <div className="memories-page">
      <div className="memories-wrapper">

        <div className="memories-header">
          <h2>Your Travel Memories</h2>
        </div>

        <p className="empty-text">
          Please login to save memories
        </p>

      </div>
    </div>
  );
}

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
      setActionMessage("Failed to load memories");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMemory = async (memoryId) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:3000/api/v1/memories/${memoryId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        setActionMessage("Failed to delete memory");
        return;
      }

      // remove from state
      setMemories((prev) =>
        prev.filter((m) => m.memory_id !== memoryId)
      );

      const data = await res.json();
      setActionMessage(data.message || "Memory deleted");

      setSelected(null);
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  return (
    <div className="memories-page">
      <div className="memories-wrapper">
        <div className="memories-header">
          <h2>Your Travel Memories</h2>

          <div className="filter-box">
            <label>Sort by city</label>
            <select>
              <option>Jaipur</option>
            </select>
          </div>
        </div>

        {loading && (
          <div className="empty-state-card">
            Loading memories...
          </div>
        )}

        {!loading && memories.length === 0 && (
          <div className="empty-state-card">
            No memories saved yet ✨
          </div>
        )}

        {memories.length > 0 && (
          <div className="memories-grid">

            {!loading && memories.map((m) => (
              <div
                key={m.memory_id}
                className="memory-card"
                onClick={() => {
                  setSelected({
                    ...m,
                    images: m.images || []
                  });

                  setImageIndex(0);
                  setNoteText(m.notes || "");
                  setEditingNote(false);
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
        )}

        {selected && (
          <div className="memory-modal" onClick={() => setSelected(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{selected.title}</h3>

                <div className="modal-actions">

                  <button
                    className="delete-memory-btn"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    🗑
                  </button>

                  <button
                    className="close-btn"
                    onClick={() => setSelected(null)}
                  >
                    ×
                  </button>

                </div>
              </div>
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

                <p className="modal-date">
                  {new Date(selected.created_at).toLocaleDateString()}
                </p>

                {editingNote ? (
                  <>
                    <textarea
                      className="note-editor"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                    />

                    <div className="note-actions">
                      <button
                        onClick={async () => {
                          const token = localStorage.getItem("token");

                          await fetch(
                            `http://localhost:3000/api/v1/memories/${selected.memory_id}`,
                            {
                              method: "PATCH",
                              headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`,
                              },
                              body: JSON.stringify({ notes: noteText }),
                            }
                          );

                          setSelected({ ...selected, notes: noteText });
                          setEditingNote(false);
                          setActionMessage("Memory note updated");
                        }}
                      >
                        Save
                      </button>

                      <button onClick={() => setEditingNote(false)}>
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="modal-desc">
                      {selected.notes || "No notes added yet."}
                    </p>

                    <button
                      className="add-note-btn"
                      onClick={() => setEditingNote(true)}
                    >
                      ✏️
                    </button>
                  </>
                )}

              </div>
            </div>
          </div>
        )}
      </div>
      {showDeleteConfirm && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-box">
            <p>Delete this memory?</p>

            <div className="delete-confirm-actions">
              <button
                className="delete-btn"
                onClick={() => handleDeleteMemory(selected.memory_id)}
              >
                Delete
              </button>

              <button
                className="cancel-btn"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
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
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
          }}
          onClick={() => setActionMessage("")}
        >
          {actionMessage}
        </div>
      )}
    </div>
  );
}

