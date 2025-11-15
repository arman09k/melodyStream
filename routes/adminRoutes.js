const express = require('express');
const router = express.Router();
const User = require('../model/user');
const Song = require('../model/song');
const upload = require('../upload'); 
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// Route 1: Secured Song Upload 
router.post('/admin/songs/upload', authMiddleware, adminMiddleware, upload.single("song"), async (req, res) => {
    try {
        const { title, artist, album, duration } = req.body;
        
        // 1. Basic validation
        if (!title || !artist || !album || !duration || !req.file) {
            return res.status(400).json({ message: "Please provide all required fields and a song file" });
        }

        // 2. Construct audio URL (adjust path as needed)
        const audioUrl = `/uploads/songs/${req.file.filename}`;

        // 3. Create new Song document
        const newSong = new Song({
            title,
            artist,
            album,
            duration: parseInt(duration),
            audioUrl // Store the path/URL
        });
        await newSong.save();

        res.status(201).json({ message: "Song uploaded successfully", song: newSong });
    } catch (error) {
        console.error("Song Upload Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Route 2: Get All Users (Example Admin Feature)
router.get('/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json({ users });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch users' });
    }
});

module.exports = router;