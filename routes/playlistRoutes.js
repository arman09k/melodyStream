const express = require('express');
const router = express.Router();
const Playlist = require("../model/playlist");

const User = require('../model/user');
const { authMiddleware, generateToken } = require("../middleware/authMiddleware");

router.post("/songs/playlist/create", authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;

    const playlist = await Playlist.create({
      name,
      description,
      createdBy: req.user.id   // correct field
    });

    return res.status(201).json({ message: "Playlist created", playlist });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/:playlistId/add/:songId", authMiddleware,async (req, res) => {
  try {
    const { playlistId, songId } = req.params;

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) return res.status(404).json({ message: "Playlist not found" });

   
    if (playlist.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (playlist.songs.includes(songId)) {
      return res.status(400).json({ message: "Song already in playlist" });
    }

    playlist.songs.push(songId);
    await playlist.save();

    res.json({ message: "Song added to playlist" });

  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Internal server error" });
  }
});

// 🟢 UPDATED ROUTE: Fetch all playlists
router.get("/playlists", authMiddleware, async (req, res) => {
  try {
    // Fetch ALL playlists and populate the creator's username/role.
    // This allows everyone to see Admin and User-created playlists.
    const data = await Playlist.find().populate('createdBy', 'username role');

    return res.status(200).json({ data });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});


router.post("/:playlistId/remove/:songId", authMiddleware, async (req, res) => {
  try {
    const { playlistId, songId } = req.params;

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) return res.status(404).json({ message: "Playlist not found" });

    // Only the playlist creator can remove songs
    if (playlist.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (!playlist.songs.includes(songId)) {
      return res.status(400).json({ message: "Song not in playlist" });
    }
    
    // Remove the songId from the songs array
    playlist.songs.pull(songId);
    await playlist.save();

    res.json({ message: "Song removed from playlist" });

  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Internal server error" });
  }
});


router.delete("/:playlistId", authMiddleware, async (req, res) => {
  try {
    const playlistId = req.params.playlistId;

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) return res.status(404).json({ message: "Playlist not found" });

    // Only the playlist creator can delete the playlist
    if (playlist.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await Playlist.findByIdAndDelete(playlistId);

    await User.findByIdAndUpdate(req.user.id, {
      $pull: { playlists: playlistId }
    });

    res.json({ message: "Playlist deleted successfully" });

  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Internal server error" });
  }
});
router.get("/:id", async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id)
      .populate('songs', 'title artist album _id')
      .populate('createdBy', 'username');

    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    res.status(200).json({ message: "Playlist fetched successfully", playlist });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;