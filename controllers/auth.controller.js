import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/user.models.js";
import { sendRegistrationEmail, sendApprovalEmail, sendRejectionEmail } from "../utils/emailService.js";

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
// REGISTER USER (with email notification)
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

    if (!name || !email || !password)
      return res.status(400).json({ message: "Name, Email & Password required" });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "Email already in use" });

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
        company: profile?.company || "",
        position: profile?.position || "",
        yearsOfExperience: profile?.yearsOfExperience || "",
        skills: profile?.skills || [],
        education: profile?.education || [],
        experience: profile?.experience || [],
        references: profile?.references || [],
        avatar: profile?.avatar || ""
      },
      membershipStatus: membershipStatus || "pending"
    });

    try {
      await sendRegistrationEmail(email, name);
      console.log('✅ Registration email sent to:', email);
    } catch (emailError) {
      console.error('❌ Failed to send registration email:', emailError);
    }

    const token = signToken(user);

    res.status(201).json({
      message: "Registration successful. Check your email for confirmation.",
      token,
      user,
    });

  } catch (err) {
    next(err);
  }
};

// ---------------------------------------
// ADMIN REGISTER
// ✅ Pehla admin: ADMIN_SECRET_KEY se protected
// ✅ Baad ke admins: existing admin ka JWT chahiye (route pe isAdmin middleware)
// ---------------------------------------
export const adminRegister = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      secretKey,    // pehle admin ke liye
      profile
    } = req.body;

    // 1️⃣ Required fields
    if (!name || !email || !password)
      return res.status(400).json({ message: "Name, Email & Password required" });

    // 2️⃣ Agar request already admin JWT se aayi hai (req.user set hai by middleware)
    //    toh secret key check skip karo
    //    Agar req.user nahi hai (pehla admin case) toh secret key validate karo
    if (!req.user) {
      const validSecret = process.env.ADMIN_SECRET_KEY;
      if (!secretKey || secretKey !== validSecret) {
        return res.status(403).json({ message: "Invalid or missing admin secret key" });
      }
    }

    // 3️⃣ Check duplicate
    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "Email already in use" });

    // 4️⃣ Create admin user — role always 'admin', membershipStatus 'approved'
    const user = await User.create({
      name,
      email,
      password,
      role: "admin",
      profile: {
        headline: profile?.headline || "",
        bio: profile?.bio || "",
        phone: profile?.phone || "",
        location: profile?.location || "",
        category: profile?.category || "Other",
        company: profile?.company || "",
        position: profile?.position || "",
        yearsOfExperience: profile?.yearsOfExperience || "",
        skills: profile?.skills || [],
        education: profile?.education || [],
        experience: profile?.experience || [],
        references: profile?.references || [],
        avatar: profile?.avatar || ""
      },
      membershipStatus: "approved"   // admin ko approval nahi chahiye
    });

    try {
      await sendRegistrationEmail(email, name);
      console.log('✅ Admin registration email sent to:', email);
    } catch (emailError) {
      console.error('❌ Failed to send admin registration email:', emailError);
    }

    const token = signToken(user);

    res.status(201).json({
      message: "Admin registered successfully.",
      token,
      user,
    });

  } catch (err) {
    next(err);
  }
};

// ---------------------------------------
// LOGIN USER (regular users only)
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

    // ✅ Admin ko user login se block karo
    if (user.role === "admin")
      return res.status(403).json({ message: "Admins must use the admin login portal" });

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
// ADMIN LOGIN
// ✅ Sirf role === 'admin' allow hoga
// ---------------------------------------
export const adminLogin = async (req, res, next) => {
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

    // ✅ Role check — only admins get through
    if (user.role !== "admin")
      return res.status(403).json({ message: "Access denied. Admins only." });

    const token = signToken(user);

    res.json({
      message: "Admin login successful",
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

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 min

    await user.save({ validateBeforeSave: false });

    res.json({
      message: "Password reset token generated",
      resetToken,
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

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Token invalid or expired" });

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

// ---------------------------------------
// APPROVE USER (admin only)
// ---------------------------------------
export const approveUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { membershipStatus: "approved" },
      { new: true }
    );

    if (!user)
      return res.status(404).json({ message: "User not found" });

    try {
      await sendApprovalEmail(user.email, user.name);
      console.log('✅ Approval email sent to:', user.email);
    } catch (emailError) {
      console.error('❌ Failed to send approval email:', emailError);
    }

    res.status(200).json({
      message: "User approved successfully. Approval email sent.",
      user,
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------
// REJECT USER (admin only)
// ---------------------------------------
export const rejectUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { membershipStatus: "rejected" },
      { new: true }
    );

    if (!user)
      return res.status(404).json({ message: "User not found" });

    try {
      await sendRejectionEmail(user.email, user.name, reason);
      console.log('✅ Rejection email sent to:', user.email);
    } catch (emailError) {
      console.error('❌ Failed to send rejection email:', emailError);
    }

    res.status(200).json({
      message: "User membership rejected. Notification email sent.",
      user,
    });
  } catch (err) {
    next(err);
  }
};