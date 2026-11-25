import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/user.models.js";
import { sendRegistrationEmail, sendApprovalEmail, sendRejectionEmail, sendPasswordResetEmail } from "../utils/emailService.js";

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

const isProduction = process.env.NODE_ENV === "production";

// Helper: Set HttpOnly, Secure, SameSite session cookie
export const setSessionCookie = (res, token) => {
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  };
  res.cookie("token", token, cookieOptions);
  res.cookie("userToken", token, cookieOptions);
};

export const setAdminSessionCookie = (res, token) => {
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  };
  res.cookie("token", token, cookieOptions);
  res.cookie("adminToken", token, cookieOptions);
};

export const clearSessionCookie = (res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  };
  res.clearCookie("token", cookieOptions);
  res.clearCookie("userToken", cookieOptions);
  res.clearCookie("adminToken", cookieOptions);
};

export const logout = (req, res) => {
  clearSessionCookie(res);
  res.json({ success: true, message: "Logged out successfully" });
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

    // Current address is mandatory for member sign-up
    const addr = profile?.currentAddress || {};
    const currentAddress = {
      addressLine: String(addr.addressLine || "").trim(),
      city: String(addr.city || "").trim(),
      state: String(addr.state || "").trim(),
      country: String(addr.country || "").trim(),
      pinCode: String(addr.pinCode || "").trim(),
      countryCode: String(addr.countryCode || "").trim(),
      stateCode: String(addr.stateCode || "").trim(),
      postOffice: String(addr.postOffice || "").trim(),
    };
    // State may be empty only for countries that have no states/provinces
    const { city, country, pinCode } = currentAddress;
    if (![city, country, pinCode].every(Boolean))
      return res.status(400).json({ message: "Current address (city, country and PIN code) is required" });
    if (currentAddress.country === "India" && !/^\d{6}$/.test(currentAddress.pinCode))
      return res.status(400).json({ message: "Please enter a valid 6-digit PIN code" });

    // Validate professional details for user registration (step 2)
    if (role !== "admin") {
      const headline = String(profile?.headline || "").trim();
      const company = String(profile?.company || "").trim();
      const position = String(profile?.position || "").trim();
      if (!headline || !company || !position) {
        const missing = [];
        if (!headline) missing.push("Professional Headline");
        if (!company) missing.push("Company Name");
        if (!position) missing.push("Position");
        return res.status(400).json({ message: `Please provide: ${missing.join(", ")}` });
      }
    }

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "Email already in use" });

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const emailVerificationToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");
    const emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    const user = await User.create({
      isEmailVerified: false,
      emailVerificationToken,
      emailVerificationExpires,
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
        avatar: profile?.avatar || "",
        country: profile?.country || "",
        howGroupHelped: profile?.howGroupHelped || req.body?.howGroupHelped || "",
        contributionExpertise: profile?.contributionExpertise || req.body?.contributionExpertise || "",
        currentAddress
      },
      membershipStatus: membershipStatus || "pending"
    });

    try {
      await sendRegistrationEmail(email, name, verificationToken);
      console.log('✅ Registration email dispatched for:', email);
    } catch (emailError) {
      console.warn('⚠️ Registration email dispatch warning:', emailError.message);
    }

    const token = signToken(user);
    setSessionCookie(res, token);

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
    setAdminSessionCookie(res, token);

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

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      await new Promise(r => setTimeout(r, 200));
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 🔒 Account lockout check
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      return res.status(429).json({
        message: `Account is temporarily locked due to consecutive failed login attempts. Please try again after ${remainingMinutes} minute(s) or reset your password.`
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lockout
      }
      await user.save();

      if (user.failedLoginAttempts >= 5) {
        return res.status(429).json({
          message: "Account is temporarily locked due to consecutive failed login attempts. Please try again after 15 minutes or reset your password."
        });
      }

      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Reset counters on successful login
    if (user.failedLoginAttempts > 0 || user.lockUntil) {
      user.failedLoginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();
    }

    // ✅ Admin / Superadmin ko user login se block karo
    if (user.role === "admin" || user.role === "superadmin")
      return res.status(403).json({ message: "Admins must use the admin login portal" });

    if (user.membershipStatus === "inactive")
      return res.status(403).json({ message: "Your membership has been deactivated." });

    if (user.membershipStatus === "pending")
      return res.status(403).json({ message: "Your membership is pending admin approval." });

    const token = signToken(user);
    setSessionCookie(res, token);

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

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      await new Promise(r => setTimeout(r, 200));
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 🔒 Account lockout check
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      return res.status(429).json({
        message: `Account is temporarily locked due to consecutive failed login attempts. Please try again after ${remainingMinutes} minute(s) or reset your password.`
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await user.save();

      if (user.failedLoginAttempts >= 5) {
        return res.status(429).json({
          message: "Account is temporarily locked due to consecutive failed login attempts. Please try again after 15 minutes or reset your password."
        });
      }

      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Reset counters on successful login
    if (user.failedLoginAttempts > 0 || user.lockUntil) {
      user.failedLoginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();
    }

    // ✅ Role check — only admins and superadmins get through
    if (user.role !== "admin" && user.role !== "superadmin")
      return res.status(403).json({ message: "Access denied. Admins only." });

    const token = signToken(user);
    setAdminSessionCookie(res, token);

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

    if (!email) {
      return res.status(400).json({ success: false, message: "Email address is required" });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: "Please provide a valid email address" });
    }

    const escapedEmail = cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const user = await User.findOne({ email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') } });
    if (!user) {
      // Security fix (Anti-User Enumeration): Always return the same generic response
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, password reset instructions will be sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes

    await user.save({ validateBeforeSave: false });

    // Determine correct portal URL based on user role and request origin
    const isAdminRole = user.role === "admin" || user.role === "superadmin";
    const defaultAdminUrl = process.env.ADMIN_URL || "http://localhost:3001";
    const defaultUserUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const origin = req.headers.origin || (isAdminRole ? defaultAdminUrl : defaultUserUrl);
    const resetPath = isAdminRole ? "/admin/reset-password" : "/reset-password";
    const resetUrl = `${origin}${resetPath}?token=${resetToken}`;

    // Send password reset email with the raw single-use token in the link
    try {
      await sendPasswordResetEmail(user.email, user.name, resetUrl);
      console.log('✅ Password reset email dispatched for:', user.email);
    } catch (emailError) {
      console.warn('⚠️ Password reset email dispatch warning:', emailError.message);
    }

    // Security fix: Never expose resetToken, resetUrl, or any reset credentials in API response bodies
    res.status(200).json({
      success: true,
      message: "If an account exists with this email, password reset instructions will be sent.",
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------
// VERIFY RESET TOKEN (Validates link without exposing credentials)
// ---------------------------------------
export const verifyResetToken = async (req, res, next) => {
  try {
    const token = (req.params.token || req.body?.token || req.query?.token || "").trim();

    if (!token) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: "Reset token is missing or required",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: "Reset link is invalid, expired, or has already been used. Please request a new one.",
      });
    }

    res.status(200).json({
      success: true,
      valid: true,
      message: "Reset token is valid.",
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
    const token = (req.params.token || req.body.token || req.query.token || "").trim();
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: "Reset token is missing or required" });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters long" });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Reset link is invalid, expired, or has already been used. Please request a new one."
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    const jwtToken = signToken(user);

    res.status(200).json({
      success: true,
      message: "Password reset successful! You can now log in with your new password.",
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
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


// ---------------------------------------
// RESEND VERIFICATION EMAIL
// ---------------------------------------
export const resendVerificationEmail = async (req, res, next) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No registered account found with that email address" });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    // Generate fresh verification token (prevents replay/duplicate issues)
    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    await user.save({ validateBeforeSave: false });

    let result = null;
    try {
      result = await sendRegistrationEmail(user.email, user.name, verificationToken);
      console.log('✅ Verification email resent for:', user.email);
    } catch (emailError) {
      console.warn('⚠️ Verification email dispatch warning:', emailError.message);
    }

    res.status(200).json({
      message: "Verification email sent successfully. Please check your inbox.",
      previewUrl: result?.previewUrl || undefined,
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------
// VERIFY EMAIL
// ---------------------------------------
export const verifyEmail = async (req, res, next) => {
  try {
    const token = req.params.token || req.body.token || req.query.token;

    if (!token) {
      return res.status(400).json({ message: "Verification token is required" });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Verification token is invalid or has expired" });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save({ validateBeforeSave: false });

    console.log('✅ User email verified successfully:', user.email);

    res.status(200).json({
      message: "Email verified successfully! You can now access your account.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        membershipStatus: user.membershipStatus,
      },
    });
  } catch (err) {
    next(err);
  }
};
