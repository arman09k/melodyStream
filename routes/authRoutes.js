const express = require('express')
const router = express.Router()
const User = require('../model/user')
const bcrypt = require('bcrypt')
const jwt  = require('jsonwebtoken')
const { authMiddleware, generateToken } = require("../middleware/authMiddleware");
const upload = require('../upload')


router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Please provide username, email, and password" });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Username already exists, try a new one" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    // Assuming your User model has 'role' defaulted to 'user'. 
    // If not, you should add 'role: "user"' here.
    const newUser = new User({ username, email, password }); 

    await newUser.save();

    res.status(201).json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
});


 
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🟢 Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 🟢 Use your model's method
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role }, 
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/profile',authMiddleware,async (req,res)=>{
  try {
    // This fetches the full user object minus the password, including the 'role'
    const user = await User.findById(req.user.id).select("-password");
 
    if(!user){
     return res.status(404).json({message : "user not found"})
    }
 
    res.status(200).json({ 
     message : "User Profile fetched successfully",
     user,
    });
    
  } catch (error) {
     console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
router.put(
  "/profile/update",
  authMiddleware,
  upload.single("avatar"),
  async (req, res) => {
    try {
      const { username, email } = req.body;
      const updateData = {};

      // Get current user to delete old avatar if needed
      const existingUser = await User.findById(req.user.id);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update simple fields
      if (username) updateData.username = username;
      if (email) updateData.email = email;

      // Handle avatar update
      if (req.file) {
        // Path for the new avatar
        const newAvatarPath = `/uploads/avatars/${req.file.filename}`;
        updateData.avatar = newAvatarPath;

        // Delete old avatar if exists and is not default
        if (
          existingUser.avatar &&
          existingUser.avatar !== "/uploads/defaults/default-avatar.png"
        ) {
          const oldAvatarFullPath = path.join(
            __dirname,
            "..",
            existingUser.avatar
          );

          // Delete file safely
          fs.unlink(oldAvatarFullPath, (err) => {
            if (err) {
              console.log("Could not delete old avatar:", err.message);
            } else {
              console.log("Old avatar deleted:", oldAvatarFullPath);
            }
          });
        }
      }

      // Save updated user
      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { $set: updateData },
        { new: true }
      ).select("-password");

      res.json({
        message: "Profile updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Update error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

module.exports = router;