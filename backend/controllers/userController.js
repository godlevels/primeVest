import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"; 
import User from "../models/User.js";

// Register User
// controllers/authController.js
import User from "../models/User.js";

// 📌 Register User
export const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // 🛑 Check missing fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 🛑 Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("❌ Registration failed: Email already in use ->", email);
      return res.status(400).json({ message: "Email already registered" });
    }

    // ✅ Create user instance
    const user = new User({ firstName, lastName, email, password });

    // Save to DB
    await user.save();

    console.log("✅ User successfully registered:", {
      id: user._id,
      email: user.email,
      passwordPreview: user.password.substring(0, 15) + "...", // hashed preview
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("❌ Registration error:", error.message);
    res.status(500).json({ message: "Server error during registration" });
  }
};


// Login User
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt with:", email, password); // 👈 log inputs

    const user = await User.findOne({ email });
    if (!user) {
      console.log("❌ No user found with email:", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("❌ Password mismatch for:", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  } 
};
