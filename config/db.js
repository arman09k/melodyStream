const mongoose = require('mongoose')
require('dotenv').config()
const mongoURL = process.env.mongo_url


mongoose.connect(mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;

console.log("connecting to mongoDB")

db.on('connected' , ()=>{
    console.log("connected to Database✅")
})

db.on('disconnected',()=>{
    console.log("disconnected to Database")
})

db.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
});

module.exports = db;
