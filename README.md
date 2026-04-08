# 🌍 VibeScape

## ✨ Introduction

**VibeScape** is an NLP-driven travel discovery platform designed to help users explore locations based on their personal "vibe". Instead of relying on rigid itineraries, VibeScape focuses on **personalized and intuitive travel discovery**.

It allows users to interact with locations through natural language, visualize places on an interactive map, and manage their travel experiences through a structured lifecycle.

---

## 🎯 Purpose

The purpose of this project is to define and implement the functional and technical requirements of **VibeScape**, a smart travel companion platform.

It provides:

* Token-based, email-verified authentication
* NLP-powered vibe-based place recommendations
* Travel memory and location management system

This serves as a complete system for both users and developers to interact with and extend.

---

## 🌐 Scope

VibeScape is a **web-based, location-aware travel platform** designed to enhance exploration through personalization rather than predefined travel plans.

---

## 🚀 Core Features

### 🔍 NLP Discovery

* Interpret user "vibe" inputs using Natural Language Processing
* Provide intelligent place recommendations

### 🗺️ Interactive Mapping

* Map-centric interface using GPS-based live location
* Manual search with autocomplete

### 📍 Place Engagement

* View ratings of locations
* Add personal notes
* Upload photos linked to map locations

### 🔄 Travel Lifecycle

Manage saved places through stages:

* To-Visit → Visited → Favorite

### 🧠 Memory Management

* Create, update, and delete **Memory Cards**
* Store travel experiences with photos and notes

### 👤 Account Customization

* Secure token-based authentication
* Profile management (username, profile picture)

---

## ❌ System Limitations

The system does **not** include:

* Offline map functionality
* Real-time traffic or transit updates
* Administrative dashboards for end-users

---

## 🏗️ Project Structure

```bash
project-root/
│
├── backend/        # Node.js + Express + TypeScript API
├── frontend/       # React + Vite client
└── README.md
```

---

## ⚙️ Prerequisites

* Node.js (>= 18)
* npm or yarn
* PostgreSQL
* Git

---

## 🔧 Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:

```env
PORT=5000
DATABASE_URL=your_postgresql_connection
JWT_SECRET=your_secret

EMAIL_USER=your_email
EMAIL_PASS=your_password

IMAGEKIT_PUBLIC_KEY=your_key
IMAGEKIT_PRIVATE_KEY=your_key
IMAGEKIT_URL_ENDPOINT=your_url
```

Run backend:

```bash
npm run dev
```

---

## 💻 Frontend Setup

```bash
cd frontend
npm install
```

Create `.env`:

```env
VITE_API_URL=http://localhost:5000
```

Run frontend:

```bash
npm run dev
```

---

## 🛠️ Tech Stack

### Frontend

* React (Vite)
* React Router
* Axios
* React Leaflet

### Backend

* Node.js
* Express
* TypeScript
* PostgreSQL
* JWT Authentication
* Multer
* Nodemailer

---

## 📌 Notes

* Ensure backend runs before frontend
* Keep `.env` files secure
* Update API URLs before deployment
