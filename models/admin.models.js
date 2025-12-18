// File: src/models/Admin.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const AdminSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Provide a valid email"],
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },

    organization: {
      type: String,
      trim: true,
      default: "",
    },

    role: {
      type: String,
      enum: ["super-admin", "admin", "moderator", "content-manager"],
      default: "admin",
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
    },

    isActive: {
      type: Boolean,
      default: false,
    },

    resetPasswordToken: String,
    resetPasswordExpires: Date,

    lastLogin: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// -------------------------------
// ✅ Hash password before save
// -------------------------------
AdminSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// -------------------------------
// ✅ Compare password (login)
// -------------------------------
AdminSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// -------------------------------
// ✅ Create password reset token
// -------------------------------
AdminSchema.methods.generateResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 min

  return resetToken;
};

// -------------------------------
// ✅ Hide sensitive fields
// -------------------------------
AdminSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
};

export default mongoose.model("Admin", AdminSchema);
