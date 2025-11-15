const express = require("express");
const router = express.Router();
const Song = require("../model/song");
const fs = require("fs");
const path = require("path");
const upload = require("../upload");
const { authMiddleware } = require("../middleware/authMiddleware");
router.get("/songs", async (req, res) => {
  try {
    const songs = await Song.find();
    console.log("all songs fetched");

    res.status(200).json({
      message: "all songs fetched Successfully",
      count: songs.length,
      songs,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/songs/search", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Please provide a search query" });
    }
    const songs = await Song.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { artist: { $regex: query, $options: "i" } },
        { album: { $regex: query, $options: "i" } },
      ],
    });

    if (songs.length === 0) {
      return res
        .status(404)
        .json({ message: "No songs found matching your query" });
    }
    res.status(200).json({
      message: "Songs fetched successfully",
      count: songs.length,
      songs,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/songs/:id", async (req, res) => {
  try {
    const songId = req.params.id;
     const song = await Song.findById(songId);
    if (!songId || !song.length == 24) {
      return res.status(400).json({ message: "Invalid song ID format" });
    }
   
    if (!song) {
      return res.status(404).json({ message: "Song not found" });
    }
    res.status(200).json({ message: "song fetched Successfully", song });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
});



router.get("/songs/stream/:id",authMiddleware, async (req, res) => {
  try {
    const songId = req.params.id;
    const song = await Song.findById(songId);

    if (!song) {
      return res.status(404).json({ message: "Song not found" });
    }

    // Extract file name from audioUrl
    const filename = song.audioUrl.split("/").pop();
    const filePath = path.join(__dirname, "../uploads/songs", filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Audio file not found" });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      const chunkSize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });

      const head = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": "audio/mpeg",
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        "Content-Length": fileSize,
        "Content-Type": "audio/mpeg",
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error("Stream error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});



module.exports = router;