import { useEffect, useState } from "react";
import API_BASE_URL from "./config/api";

function AdminPage() {
  const token = localStorage.getItem("token");

  const [users, setUsers] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagName, setTagName] = useState("");
  const [description, setDescription] = useState("");

  const [activeTab, setActiveTab] = useState("users");
  const [message, setMessage] = useState("");

  const fetchUsers = async () => {
    const res = await fetch(`${API_BASE_URL}/api/v1/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setUsers(data);
  };

  const promote = async (id) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/admin/promote/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    setMessage(data.message || "User promoted");
    fetchUsers();
  };

  const demote = async (id) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/admin/demote/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    setMessage(data.message || "User demoted");
    fetchUsers();
  };

  const fetchTags = async () => {
    const res = await fetch(`${API_BASE_URL}/api/v1/admin/tags`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setTags(data);
  };

  const addTag = async () => {
    if (!tagName.trim()) return;

    const res = await fetch(`${API_BASE_URL}/api/v1/admin/tags`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        tag_name: tagName,
        description: description,
      }),
    });

    const data = await res.json();
    setMessage(data.message || "Tag added");

    setTagName("");
    setDescription("");
    fetchTags();
  };

  const deleteTag = async (id) => {
    const res = await fetch(`${API_BASE_URL}/api/v1/admin/tags/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    setMessage(data.message || "Tag deleted");

    fetchTags();
  };

  useEffect(() => {
    fetchUsers();
    fetchTags();
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  return (
    <div
      style={{
        padding: "30px",
        background: "#F9FAFB",
        minHeight: "100vh",
      }}
    >
      <h2
        style={{
          color: "#7C3AED",
          fontWeight: "900",
          fontSize: "28px",
        }}
      >
        Admin Dashboard
      </h2>

      {message && (
        <div
          style={{
            marginTop: "15px",
            background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
            color: "white",
            padding: "12px 18px",
            borderRadius: "12px",
            fontWeight: "600",
            width: "fit-content",
            boxShadow: "0 4px 15px rgba(124,58,237,0.3)",
          }}
        >
          {message}
        </div>
      )}

      {/* TABS */}
      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button
          onClick={() => setActiveTab("users")}
          style={{
            padding: "10px 18px",
            borderRadius: "999px",
            border: "none",
            background:
              activeTab === "users"
                ? "linear-gradient(135deg, #7C3AED, #A78BFA)"
                : "#E5E7EB",
            color: activeTab === "users" ? "white" : "#374151",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          Users
        </button>

        <button
          onClick={() => setActiveTab("tags")}
          style={{
            padding: "10px 18px",
            borderRadius: "999px",
            border: "none",
            background:
              activeTab === "tags"
                ? "linear-gradient(135deg, #7C3AED, #A78BFA)"
                : "#E5E7EB",
            color: activeTab === "tags" ? "white" : "#374151",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          Tags
        </button>
      </div>

      {/* USERS */}
      {activeTab === "users" && (
        <div style={{ marginTop: "20px" }}>
          {users.map((u) => (
            <div
              key={u.user_id}
              style={{
                background: "white",
                padding: "18px",
                marginBottom: "14px",
                borderRadius: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
              }}
            >
              <div>
                <div style={{ fontWeight: "700" }}>{u.name}</div>
                <div style={{ fontSize: "12px" }}>{u.email}</div>
                <div
                  style={{
                    color: u.role === "admin" ? "#7C3AED" : "#6B7280",
                    fontWeight: "700",
                  }}
                >
                  {u.role}
                </div>
              </div>

              {u.role === "admin" ? (
                <button
                  onClick={() => demote(u.user_id)}
                  style={{
                    background: "#FEE2E2",
                    color: "#DC2626",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: "999px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  Demote
                </button>
              ) : (
                <button
                  onClick={() => promote(u.user_id)}
                  style={{
                    background: "#EDE9FE",
                    color: "#7C3AED",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: "999px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  Promote
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAGS */}
      {activeTab === "tags" && (
        <div style={{ marginTop: "20px" }}>
          <div
            style={{
              background: "rgba(124,58,237,0.08)",
              padding: "18px",
              borderRadius: "16px",
              marginBottom: "20px",
            }}
          >
            <h3>Add Tag</h3>

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <input
                placeholder="Tag name"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                style={{
                  padding: "12px 16px",
                  borderRadius: "999px",
                  border: "none",
                  background: "#F3F4F6",
                  outline: "none",
                  boxShadow: "inset 0 2px 6px rgba(0,0,0,0.05)",
                }}
              />

              <input
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  padding: "12px 16px",
                  borderRadius: "999px",
                  border: "none",
                  background: "#F3F4F6",
                  outline: "none",
                  boxShadow: "inset 0 2px 6px rgba(0,0,0,0.05)",
                }}
              />

              <button
                onClick={addTag}
                style={{
                  padding: "10px 16px",
                  borderRadius: "999px",
                  border: "none",
                  background:
                    "linear-gradient(135deg, #7C3AED, #A78BFA)",
                  color: "white",
                  fontWeight: "700",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(124,58,237,0.3)",
                }}
              >
                Add
              </button>
            </div>
          </div>

          {tags.map((t) => (
            <div
              key={t.tag_id}
              style={{
                background: "white",
                padding: "14px",
                marginBottom: "12px",
                borderRadius: "14px",
                display: "flex",
                justifyContent: "space-between",
                boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
              }}
            >
              <div>
                <div style={{ fontWeight: "700" }}>{t.tag_name}</div>
                <div style={{ fontSize: "12px" }}>
                  {t.description || "No description"}
                </div>
              </div>

              <button
                onClick={() => deleteTag(t.tag_id)}
                style={{
                  background: "#FEE2E2",
                  color: "#DC2626",
                  border: "none",
                  padding: "8px 14px",
                  borderRadius: "999px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminPage;