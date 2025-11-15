# 🎵 MelodyStream

A full-stack music streaming web application built using **Node.js**,
**Express**, **MongoDB**, and a clean modern frontend.\
Users can create playlists, like songs, explore tracks, and enjoy a
smooth music-playing experience.

## 🚀 Features

### 🔐 Authentication

-   User signup and login\
-   Token-based authentication (JWT)\
-   Google OAuth integration (optional)

### 🎶 Music Features

-   Upload songs with metadata\
-   Stream music directly in the browser\
-   Like/unlike songs\
-   Create and manage playlists\
-   Explore and search songs\
-   Mark favourites

### 🛠 Backend

-   Node.js\
-   Express.js\
-   MongoDB with Mongoose\
-   Multer for file uploads\
-   JWT-based auth\
-   Modular route structure

### 💻 Frontend

-   Clean light-theme UI\
-   Fully responsive\
-   Modern animations\
-   Real-time music controls\
-   Pages: Auth, Explorer, Liked Songs, Playlist, Player

## 📁 Project Structure

    melodyStream/
    │── config/
    │── controllers/
    │── middleware/
    │── models/
    │── routes/
    │── public/
    │   ├── css/
    │   ├── js/
    │   ├── images/
    │── uploads/
    │── server.js
    │── .env
    │── package.json
    │── README.md

## 🔧 Installation & Setup

### 1️⃣ Clone the repository

``` bash
git clone https://github.com/arman09k/melodyStream.git
cd melodyStream
```

### 2️⃣ Install dependencies

``` bash
npm install
```

### 3️⃣ Create `.env` file

    PORT=3000
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_secret
    GOOGLE_CLIENT_ID=your_id
    GOOGLE_CLIENT_SECRET=your_secret

### 4️⃣ Run the server

``` bash
nodemon server.js
```

Server will run on:

    http://localhost:3000

## 📡 API Routes (Quick Overview)

### **Auth Routes**

    POST /api/auth/signup
    POST /api/auth/login
    GET  /api/auth/google

### **Songs**

    POST /api/songs/upload
    GET  /api/songs
    GET  /api/songs/search?query=

### **Playlist**

    POST /api/playlist/create
    POST /api/playlist/add
    GET  /api/playlist/user

### **Favourites**

    POST /api/favourites/like
    GET  /api/favourites

## 🤝 Contributing

Pull requests are welcome!\
For major changes, please open an issue first to discuss what you'd like
to modify.

## 📜 License

This project is licensed under the **MIT License** --- feel free to use
and modify.

## 💙 Author

**Arman Sharma (arman09k)**\
GitHub: https://github.com/arman09k
