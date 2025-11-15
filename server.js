const express = require('express')
require('dotenv').config()
const app = express()
const port = process.env.PORT
const db = require('./config/db')
const authRoutes = require('./routes/authRoutes')
const songRoutes = require('./routes/songRoutes')
const favouriteRoutes = require('./routes/favouriteRoutes')
const playlistRoutes = require('./routes/playlistRoutes')
const adminRoutes = require('./routes/adminRoutes')
const cors = require('cors')
app.use(express.json()); // parses JSON data
app.use(express.urlencoded({ extended: true })); // parses form data
app.use(cors());
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/', authRoutes)
app.use('/', songRoutes)
app.use('/',favouriteRoutes)
app.use('/',playlistRoutes)
app.use('/',adminRoutes)

app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`)
})