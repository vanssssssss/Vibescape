import { useState, useRef } from "react";
import "./SettingsPage.css";

export default function SettingsPage({ user, setUser, navigate }) {
  const [isEditing, setIsEditing] = useState(false);

  // 🔥 use username consistently
  const [username, setUsername] = useState(user?.username || "");
  const [email] = useState(user?.email || "");
  const [profilePic, setProfilePic] = useState(user?.profile_image || null);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);

  /* ---------------- IMAGE UPLOAD ---------------- */
  const handleProfileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setProfilePic(localUrl);

    try {
      const authRes = await fetch(
        "http://localhost:3000/api/v1/memories/imagekit-auth"
      );
      const authData = await authRes.json();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", file.name);
      formData.append("token", authData.token);
      formData.append("expire", authData.expire);
      formData.append("signature", authData.signature);
      formData.append("publicKey", "public_qUoQau8hBOj4JWLVStDXyCgbNIY=");
      formData.append("folder", "/profiles");

      const uploadRes = await fetch(
        "https://upload.imagekit.io/api/v1/files/upload",
        { method: "POST", body: formData }
      );

      const data = await uploadRes.json();
      setProfilePic(data.url);
    } catch {
      console.log("Upload failed");
    }
  };

  /* ---------------- SAVE PROFILE ---------------- */
  const handleSave = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      await fetch("http://localhost:3000/api/v1/users/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: username,
          profile_image: profilePic,
        }),
      });
    } catch {}

    // 🔥 FIXED: update correct field
    setUser((prev) => ({
      ...prev,
      username: username,
      profile_image: profilePic,
    }));

    setIsEditing(false);
    setLoading(false);
  };

  /* ---------------- LOGOUT ---------------- */
  const handleLogout = async () => {
    if (!window.confirm("Are you sure you want to logout?")) return;

    const token = localStorage.getItem("token");

    try {
      await fetch("http://localhost:3000/api/v1/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}

    localStorage.removeItem("token");
    window.location.reload();
  };

  /* ---------------- DELETE ACCOUNT ---------------- */
  const handleDeleteAccount = async () => {
    if (!window.confirm("Delete your account permanently?")) return;

    const token = localStorage.getItem("token");

    try {
      await fetch("http://localhost:3000/api/v1/users", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}

    localStorage.removeItem("token");
    window.location.reload();
  };

  return (
    <div className="settings-wrapper">
      <div className="settings-container">

        {/* HEADER */}
        <div className="settings-header">
          <h2 className="page-title">Account Settings</h2>

          <button
            className="close-btn"
            onClick={() => navigate("/")}
          >
            ✕
          </button>
        </div>

        {/* PROFILE */}
        <div className="section">
          <div className="profile-card">

            {/* AVATAR */}
            <div
              className="avatar"
              onClick={() => fileInputRef.current.click()}
            >
              {profilePic ? (
                <img src={profilePic} alt="profile" />
              ) : (
                (user?.username || "U")[0].toUpperCase()
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              hidden
              onChange={handleProfileUpload}
            />

            {/* INFO */}
            <div className="profile-info">
              {isEditing ? (
                <input
                  className="input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              ) : (
                <h3>{user?.username || "Your Name"}</h3>
              )}
              <p>{email}</p>
            </div>

            {/* BUTTON */}
            <button
              className="secondary-btn"
              onClick={isEditing ? handleSave : () => setIsEditing(true)}
            >
              {loading ? "Saving..." : isEditing ? "Save" : "Edit"}
            </button>

          </div>
        </div>

        {/* GRID */}
        <div className="settings-grid">

          {/* ACCOUNT */}
          <div className="settings-block">
            <h4>Account</h4>

            <div className="settings-list">
              <div
                className="settings-item"
                onClick={() => setIsEditing(true)}
              >
                <span>Edit Profile</span>
              </div>

              <div
                className="settings-item"
                onClick={() => navigate("/", { state: { reset: true } })}
              >
                <span>Change Password</span>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="settings-block">
            <h4>Actions</h4>

            <div className="settings-list">
              <div
                className="settings-item logout-item"
                onClick={handleLogout}
              >
                <span>Logout</span>
              </div>
            </div>

            <div className="settings-list danger">
              <div
                className="settings-item"
                onClick={handleDeleteAccount}
              >
                <span>Delete Account</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}