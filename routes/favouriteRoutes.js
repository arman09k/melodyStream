const express = require("express");
const router = express.Router();
const User = require("../model/user");
const { authMiddleware } = require("../middleware/authMiddleware");


router.post("/songs/:id/favourite",authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const songId = req.params.id;

    if (user.favorites.includes(songId)) {
      return res.status(400).json({ message: "Already in favorites" });
    }

    user.favorites.push(songId);
    await user.save();
     res.json({ message: "Song added to favorites" });
  } catch (error) {
    console.log(error)
     res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post('/songs/:id/unfavourite',authMiddleware,async(req,res)=>{
    try{
      const user = await User.findById(req.user.id);
      const songId = req.params.id;

      user.favorites = user.favorites.filter(
        (id) => id.toString() !==songId
      );

      await user.save();

    res.json({ message: "Song removed from favorites" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
})

module.exports = router;