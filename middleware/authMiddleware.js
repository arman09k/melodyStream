const jwt = require("jsonwebtoken");
require("dotenv").config();

// 🟢 Middleware to verify token
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");

    req.user = decoded; // attach { id, email, role }
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// 🟡 Admin Only Access Middleware
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied: Admin only" });
  }
  next();
};

// 🟢 Helper function to generate token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || "secretkey", {
    expiresIn: "1d",
  });
};

module.exports = { authMiddleware, adminMiddleware, generateToken };
