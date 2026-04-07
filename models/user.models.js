import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/* ===============================
   CATEGORY ENUM
================================ */
const categories = [
  "Software Engineering",
  "Civil Engineering",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Electronics Engineering",
  "Electronics and Telecommunications",
  "Instrumentation Engineering",
  "Chemical Engineering",
  "Computer Engineering",
  "Automobile Engineering",
  "Aeronautical Engineering",
  "Aerospace Engineering",
  "Petrochemical Engineering",
  "Polymer Engineering",
  "Agricultural Engineering",
  "Biomedical Engineering",
  "Industrial Engineering",
  "Production Engineering",
  "Mining Engineering",
  "Metallurgical Engineering",
  "Environmental Engineering",
  "Marine Engineering",
  "Textile Engineering",
  "Architecture",
  "Other",
];

/* ===============================
   SUB SCHEMAS
================================ */
const EducationSchema = new mongoose.Schema(
  {
    institution: { type: String, default: "" },
    degree: { type: String, default: "" },
    from: { type: String, default: "" },   // ✅ String rakha — "YYYY/MM" format
    to: { type: String, default: "" },
  },
  { _id: false }
);

const ExperienceSchema = new mongoose.Schema(
  {
    company: { type: String, default: "" },
    position: { type: String, default: "" },
    from: { type: String, default: "" },   // ✅ String rakha — "YYYY/MM" or "Present"
    to: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const ReferenceSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    contact: { type: String, default: "" },
    relation: { type: String, default: "" },
  },
  { _id: false }
);

/* ===============================
   USER SCHEMA
================================ */
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // ✅ Mixed type — admin aur user dono ka alag profile support karta hai
    profile: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    memberId: {
      type: String,
      unique: true,
      sparse: true,   // ✅ null/undefined allow karta hai (admins ke liye)
    },

    membershipStatus: {
      type: String,
      enum: ["pending", "active", "approved", "rejected"],
      default: "pending",
    },

    // Password reset fields
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    // Notification Preferences
    notificationPreferences: {
      email: { type: Boolean, default: true },
      jobUpdates: { type: Boolean, default: true },
      eventReminders: { type: Boolean, default: true },
      newsletter: { type: Boolean, default: true },
      communityActivity: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

/* ===============================
   PRE-SAVE HOOK
================================ */
UserSchema.pre("save", async function () {
  // 1️⃣ Hash password
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // 2️⃣ Admin setup — no memberId, auto approved
  if (this.isNew && this.role === "admin") {
    this.membershipStatus = "approved";
    this.memberId = undefined;
    return; // ✅ Baaki kuch nahi karna admin ke liye
  }

  // 3️⃣ User ke liye unique memberId generate karo
  if (this.isNew && this.role === "user" && !this.memberId) {
    let isUnique = false;
    let nextNumber = 1;
    let memberId;

    // ✅ Highest existing memberId dhundho
    const lastUser = await this.constructor.findOne(
      { memberId: { $exists: true, $ne: null }, role: "user" },
      { memberId: 1 },
      { sort: { memberId: -1 } }
    );

    if (lastUser?.memberId) {
      const lastNum = parseInt(lastUser.memberId.replace("KEA-", ""), 10);
      if (!isNaN(lastNum)) nextNumber = lastNum + 1;
    }

    // ✅ Loop — jab tak unique ID na mile
    while (!isUnique) {
      memberId = `KEA-${String(nextNumber).padStart(3, "0")}`;
      const existing = await this.constructor.findOne({ memberId });
      if (!existing) {
        isUnique = true;
      } else {
        nextNumber++;
      }
    }

    this.memberId = memberId;
  }
});

/* ===============================
   METHODS
================================ */
UserSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.isAdmin = function () {
  return this.role === "admin";
};

// ✅ toJSON — sensitive fields response mein kabhi nahi aayenge
UserSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    return ret;
  },
});

export default mongoose.model("User", UserSchema);