import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/user.models.js";

// ---------------------------------------
// Generate JWT Token
// ---------------------------------------
const signToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

// ---------------------------------------
// REGISTER USER
// ---------------------------------------
export const register = async (req, res, next) => {
  try {
    const { 
      name, 
      email, 
      password,
      role, 
      profile,
      category,
      membershipStatus
    } = req.body;

    // 1️⃣ Validate required fields
    if (!name || !email || !password)
      return res.status(400).json({ message: "Name, Email & Password required" });

    // 2️⃣ Check if user already exists
    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "Email already in use" });

    // 3️⃣ Create user with full profile data
    const user = await User.create({
      name,
      email,
      password,
      role: role || "user",

      profile: {
        headline: profile?.headline || "",
        bio: profile?.bio || "",
        phone: profile?.phone || "",
        location: profile?.location || "",
          category: profile?.category || "Other",
          company: profile?.company || "",        // ✅ REQUIRED
        position: profile?.position || "",      // ✅ REQUIRED
        yearsOfExperience: profile?.yearsOfExperience || "",
        skills: profile?.skills || [],
        education: profile?.education || [],
        experience: profile?.experience || [],
        avatar: profile?.avatar || ""
      },

      membershipStatus: membershipStatus || "pending"
    });

    // 4️⃣ Generate JWT token
    const token = signToken(user);

    res.status(201).json({
      message: "Registration successful",
      token,
      user,
    });

  } catch (err) {
    next(err);
  }
};


// ---------------------------------------
// LOGIN USER
// ---------------------------------------
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Missing credentials" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken(user);

    res.json({
      message: "Login successful",
      token,
      user,
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------
// FORGOT PASSWORD
// ---------------------------------------
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email)
      return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "No user found with that email" });

    // Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Save encrypted token in DB
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 min

    await user.save({ validateBeforeSave: false });

    // Send token in response (You can integrate email service later)
    res.json({
      message: "Password reset token generated",
      resetToken, // send to frontend
      expiresIn: "10 minutes",
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------
// RESET PASSWORD
// ---------------------------------------
export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password)
      return res.status(400).json({ message: "Password is required" });

    // encrypt token
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user)
      return res
        .status(400)
        .json({ message: "Token invalid or expired" });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    const jwtToken = signToken(user);

    res.json({
      message: "Password reset successful",
      token: jwtToken,
      user,
    });
  } catch (err) {
    next(err);
  }
};
