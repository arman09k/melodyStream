const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
    role: {
        type: String,
        enum: ['user', 'admin'], // Enforce valid roles
        default: 'user' // Default to a standard user
    },

  avatar: 
  { 
    type: String ,
    default: "/uploads/avatars/default-avatar.png"
  },

  playlists: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "playlist",
    },
  ],

  favorites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Song",
    },
  ],

  recentlyPlayed: [
    {
      song: { type: mongoose.Schema.Types.ObjectId, ref: "Song" },
      playedAt: { type: Date, default: Date.now },
    },
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});



userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // Only hash if password is new/changed

  try {
    const salt = await bcrypt.genSalt(10); // Generate salt
    this.password = await bcrypt.hash(this.password, salt); // Hash password
    next();
  } catch (err) {
    next(err);
  }
});


userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
