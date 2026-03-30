import { useState, useRef, useEffect } from "react";
import "./SettingsPage.css";

export default function SettingsPage({ user, setUser, navigate,setIsGuest }) {
    const [isEditing, setIsEditing] = useState(false);
    const [showPasswordUI, setShowPasswordUI] = useState(false);

    const [nickname, setNickname] = useState("");
    const email = user?.email || "";

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [previewImage, setPreviewImage] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const fileInputRef = useRef(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [photoMessage, setPhotoMessage] = useState("");
    const [photoError, setPhotoError] = useState("");
    /* ---------------- SYNC USER ---------------- */
    useEffect(() => {
        if (user?.nickname) {
            setNickname(user.nickname);
        }
    }, [user]);

    /* ---------------- IMAGE SELECT ---------------- */
    const handleSelectImage = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSelectedFile(file);
        setPreviewImage(URL.createObjectURL(file));
    };

    /* ---------------- IMAGE UPLOAD ---------------- */
    const handleUploadPhoto = async () => {
        if (!selectedFile) return;

        try {
            const token = localStorage.getItem("token");

            if (!token) {
                alert("Please login again");
                return;
            }
            console.log("Uploading with token:", token);
            const authRes = await fetch(
                "http://localhost:3000/api/v1/memories/imagekit-auth"
            );
            const authData = await authRes.json();

            const formData = new FormData();
            formData.append("file", selectedFile);
            formData.append("fileName", selectedFile.name);
            formData.append("token", authData.token);
            formData.append("expire", authData.expire);
            formData.append("signature", authData.signature);
            formData.append("publicKey", "public_qUoQau8hBOj4JWLVStDXyCgbNIY=");

            const uploadRes = await fetch(
                "https://upload.imagekit.io/api/v1/files/upload",
                { method: "POST", body: formData }
            );

            const uploadData = await uploadRes.json();

            const res = await fetch(
                "http://localhost:3000/api/v1/users/me/profile-pic",
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ profile_pic: uploadData.url }),
                }
            );

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.message || "Photo update failed");
            }

            setUser((prev) => ({
                ...prev,
                profile_pic: result.profile_pic + "?t=" + Date.now(),
            }));
            //await fetchUser(); //
            setError("");
            setPhotoMessage("Profile photo updated successfully");
            setPhotoError("");
            setTimeout(() => setPhotoMessage(""), 3000);
            setPreviewImage(null);
            setSelectedFile(null);

        } catch (err) {
            setPhotoMessage("");
            setPhotoError(err.message || "Upload failed");
            setTimeout(() => setPhotoError(""), 6000);
        }
    };

    /* ---------------- UPDATE NAME ---------------- */
    const handleSaveName = async () => {
        try {
            const token = localStorage.getItem("token");

            const res = await fetch(
                "http://localhost:3000/api/v1/users/me/name",
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ nickname }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to update name");
            }

            // ✅ update state
            setUser((prev) => ({
                ...prev,
                nickname: data.nickname,
            }));

            setIsEditing(false);

        } catch (err) {
            alert(err.message);
        }
    };

    /* ---------------- CHANGE PASSWORD ---------------- */
    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            setMessage("");
            setError("All fields required");
            setTimeout(() => setError(""), 3000);
        }

        if (newPassword !== confirmPassword) {
            setMessage("");
            setError("Passwords do not match");
            setTimeout(() => setError(""), 3000);
        }

        try {
            const token = localStorage.getItem("token");

            const res = await fetch(
                "http://localhost:3000/api/v1/auth/change-password",
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        oldPassword,
                        newPassword,
                        confirmPassword,
                    }),
                }
            );

            const data = await res.json();
            if (!res.ok) {
                setError(data.message);
                setTimeout(() => setError(""), 3000);
                return;
            }

            setMessage("Password updated successfully");
            setTimeout(() => {
                setMessage("");
                setShowPasswordModal(false); // ✅ close AFTER success
            }, 2000);

        } catch (err) {
            alert(err.message);
        }
    };

    /* ---------------- LOGOUT ---------------- */
    const handleLogout = async () => {
        const token = localStorage.getItem("token");

        try {
            await fetch("http://localhost:3000/api/v1/auth/logout", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch { }

        localStorage.removeItem("token");
        window.location.reload();
    };

    /* ---------------- DELETE ---------------- */
    const handleDeleteAccount = async () => {
        // if (!window.confirm("Delete account permanently?")) return;

        const token = localStorage.getItem("token");

        try {
            await fetch("http://localhost:3000/api/v1/users/me", {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch { }

        localStorage.removeItem("token");
        window.location.reload();
    };

    if (!user) {
        return (
            <div className="guest-wrapper">
                <div className="guest-box">

                    <h2>You are not logged in.</h2>

                    <div className="guest-actions">
                        <button
                            className="action-btn"
                            //onClick={() => navigate("/login")} // it is not navigating to the login page
                            onClick={() => {
                                //sessionStorage.removeItem("guest"); // ✅ REMOVE guest mode
                                setIsGuest(false);
                                navigate("/", {
                                    state: { from: window.location.pathname }
                                });
                            }}
                        >
                            Login
                        </button>

                        <button
                            className="secondary-btn"
                            onClick={() => navigate("/")}
                        >
                            Go Back
                        </button>
                    </div>

                </div>
            </div>
        );
    }

    return (
        <div className="settings-wrapper">
            <div className="settings-container">

                {/* HEADER */}
                <div className="settings-header">
                    <h2 className="page-title">Account Settings</h2>
                    <button className="closee-btn" onClick={() => navigate("/")}>×</button>
                </div>

                {/* PROFILE CARD */}
                <div className="section">

                    {photoMessage && <div className="success-msg">{photoMessage}</div>}
                    {photoError && <div className="error-msg">{photoError}</div>}
                    <div className="profile-card">

                        <div className="avatar-wrapper">
                            <div className="avatar">
                                {previewImage ? (
                                    <img src={previewImage} />
                                ) : user?.profile_pic ? (
                                    <img src={user.profile_pic} />
                                ) : (
                                    (nickname || "U")[0].toUpperCase()
                                )}
                            </div>

                            <div
                                className="camera-icon"
                                onClick={() => fileInputRef.current.click()}
                            >
                                📷
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                hidden
                                onChange={(e) => {
                                    handleSelectImage(e);
                                    e.target.value = null; // 🔥 IMPORTANT FIX
                                }}
                            />
                        </div>

                        <div className="profile-info">
                            {isEditing ? (
                                <>
                                    <input
                                        className="input"
                                        value={nickname}
                                        onChange={(e) => setNickname(e.target.value)}
                                    />

                                    <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                                        <button className="secondary-btn" onClick={handleSaveName}>
                                            Save
                                        </button>
                                        <button
                                            className="secondary-btn"
                                            onClick={() => setIsEditing(false)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <h3>{user?.nickname || "Your Name"}</h3>
                            )}

                            <p>{email}</p>
                        </div>

                        {!isEditing && (
                            <button
                                className="secondary-btn"
                                onClick={() => {
                                    setNickname(user?.nickname || "");
                                    setIsEditing(true);
                                }}
                            >
                                Edit
                            </button>
                        )}
                    </div>

                    {/* SAVE PHOTO BUTTON */}
                    {previewImage && (
                        <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
                            <button className="primary-btn" onClick={handleUploadPhoto}>
                                Save Photo
                            </button>
                            <button
                                className="secondary-btn"
                                onClick={() => {
                                    setPreviewImage(null);
                                    setSelectedFile(null);
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>

                {/* PASSWORD */}
                {/* PASSWORD MODAL */}
                {showPasswordModal && (
                    <div className="modal-backdrop">
                        <div className="modal-box">

                            <h3>Change Password</h3>
                            {message && <div className="modal-msg success">{message}</div>}
                            {error && <div className="modal-msg error">{error}</div>}

                            <div className="modal-inputs">
                                <input
                                    className="vibe-input"
                                    type="password"
                                    placeholder="Old Password"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                />

                                <input
                                    className="vibe-input"
                                    type="password"
                                    placeholder="New Password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />

                                <input
                                    className="vibe-input"
                                    type="password"
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>

                            <div className="modal-actions">
                                <button
                                    className="action-btn"
                                    onClick={handleChangePassword}
                                >
                                    Update
                                </button>

                                <button
                                    className="action-btn"
                                    onClick={() => setShowPasswordModal(false)}
                                >
                                    Cancel
                                </button>
                            </div>

                        </div>
                    </div>
                )}
                {/* SETTINGS GRID */}
                <div className="settings-grid">
                    <div className="settings-block">
                        <h4>Account</h4>

                        <div className="settings-list">
                            <div
                                className="settings-item"
                                onClick={() => {
                                    setNickname(user?.nickname || "");
                                    setIsEditing(true);
                                }}
                            >
                                <span>Edit Name</span>
                            </div>

                            <div
                                className="settings-item"
                                onClick={() => {
                                    setMessage("");
                                    setError("");
                                    setOldPassword("");
                                    setNewPassword("");
                                    setConfirmPassword("");
                                    setShowPasswordModal(true);
                                }}
                            >
                                <span>Change Password</span>
                            </div>
                        </div>
                    </div>

                    <div className="settings-block">
                        <h4>Actions</h4>

                        <div className="settings-list">
                            <div className="settings-item logout-item" onClick={handleLogout}>
                                <span>Logout</span>
                            </div>
                        </div>

                        <div className="settings-list danger">
                            <div className="settings-item" onClick={() => setShowDeleteModal(true)}>
                                <span>Delete Account</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
            {/* DELETE MODAL */}
            {showDeleteModal && (
                <div className="modal-backdrop">
                    <div className="modal-box">

                        <h3>Delete Account?</h3>
                        <p>This action is permanent and cannot be undone.</p>

                        <div className="modal-actions">
                            <button
                                className="secondary-btn"
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    handleDeleteAccount();
                                }}
                            >
                                Yes, Delete
                            </button>

                            <button
                                className="danger-btn"
                                onClick={() => setShowDeleteModal(false)}
                            >
                                Cancel
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>


    );
}