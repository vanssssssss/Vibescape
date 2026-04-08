# 🌍 VibeScape

## ✨ Introduction

**VibeScape** is a full-stack web application designed to help users explore, share, and experience locations based on their *vibes*. Whether it's a peaceful getaway, a lively hangout spot, or a hidden gem, VibeScape allows users to discover places, interact with content, and contribute their own experiences.

The platform combines an interactive map interface with modern web technologies to deliver a seamless and engaging user experience.

---

## 🚀 Features

* 🔐 User Authentication (JWT-based login/signup)
* 📍 Location-based exploration with maps
* 📝 Create and manage posts/places
* 📷 Image upload support
* 📧 Email notifications
* ⚡ Fast and responsive UI
* 🛡️ Secure backend with validation & rate limiting

---

## 🏗️ Project Structure

```
project-root/
│
├── backend/        # Node.js + Express + TypeScript API
├── frontend/       # React + Vite client
└── README.md
```

---

## ⚙️ Prerequisites

Make sure you have:

* Node.js (>= 18)
* npm or yarn
* PostgreSQL
* Git

---

## 🔧 Backend Setup

### 1. Navigate to backend

```bash
cd backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

Create a `.env` file in the backend folder:

```env
PORT=5000
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret

EMAIL_USER=your_email
EMAIL_PASS=your_email_password

IMAGEKIT_PUBLIC_KEY=your_key
IMAGEKIT_PRIVATE_KEY=your_key
IMAGEKIT_URL_ENDPOINT=your_url
```

### 4. Run backend (development)

```bash
npm run dev
```

### 5. Build backend

```bash
npm run build
```

### 6. Start backend

```bash
npm start
```

---

## 💻 Frontend Setup

### 1. Navigate to frontend

```bash
cd frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000
```

### 4. Run frontend

```bash
npm run dev
```

### 5. Build frontend

```bash
npm run build
```

### 6. Preview build

```bash
npm run preview
```

---

## 🧪 Scripts

### Backend

* `npm run dev` → Run in development mode
* `npm run build` → Compile TypeScript
* `npm start` → Start production server

### Frontend

* `npm run dev` → Start development server
* `npm run build` → Production build
* `npm run preview` → Preview production build

---

## 🛠️ Tech Stack

### Frontend

* React
* Vite
* React Router
* Axios
* React Leaflet (Maps)

### Backend

* Node.js
* Express
* TypeScript
* PostgreSQL
* JWT Authentication
* Multer (File Uploads)
* Nodemailer (Emails)

---

## 🌐 Deployment

### Backend

```bash
npm run build
npm start
```

### Frontend

```bash
npm run build
```

Deploy the `dist/` folder using:

* Vercel
* Netlify
* Render

---

## 📌 Notes

* Ensure backend is running before frontend
* Keep `.env` files private
* Update API URL in frontend before deployment

---

## 👨‍💻 Author

Your Name

---

## 📜 License

ISC License
