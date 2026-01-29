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
  "Chemical Engineering",
  "Computer Engineering",
  "Architecture",
  "Other",
];

/* ===============================
   SUB SCHEMAS
================================ */
const EducationSchema = new mongoose.Schema(
  {
    institution: String,
    degree: String,
    from: Date,
    to: Date,
  },
  { _id: false }
);

const ExperienceSchema = new mongoose.Schema(
  {
    company: String,
    position: String,
    from: Date,
    to: Date,
    description: String,
  },
  { _id: false }
);

/* ===============================
   PROFILE SCHEMA (UPDATED)
================================ */
const ProfileSchema = new mongoose.Schema(
  {
    headline: String,
    bio: String,
    phone: String,
    location: String,

    category: {
      type: String,
      enum: categories,      // ✅ category added
      default: "Other",
    },

    skills: [String],
    education: [EducationSchema],
    experience: [ExperienceSchema],

    position: {
      type: String,
      required: true,
    },

    company: {
      type: String,
      required: true,
    },

    yearsOfExperience: String,

    socialLinks: {
      linkedin: String,
      twitter: String,
      facebook: String,
      instagram: String,
      website: String,
    },

    avatar: String,
  },
  { _id: false }
);

/* ===============================
   USER SCHEMA
================================ */
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },

  profile: ProfileSchema,

  memberId: {
    type: String,
    unique: true,
    sparse: true,
  },

  membershipStatus: {
    type: String,
    enum: ["pending", "active", "rejected"],
    default: "pending",
  },

  createdAt: { type: Date, default: Date.now },
});

/* ===============================
   PRE-SAVE HOOK
================================ */
UserSchema.pre("save", async function () {
  // Hash password
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // Generate Member ID
  if (this.isNew && !this.memberId) {
    const lastUser = await this.constructor.findOne(
      { memberId: { $exists: true } },
      {},
      { sort: { createdAt: -1 } }
    );

    let nextNumber = 1;
    if (lastUser?.memberId) {
      const lastNum = parseInt(lastUser.memberId.replace("KEA-", ""));
      nextNumber = lastNum + 1;
    }

    this.memberId = `KEA-${String(nextNumber).padStart(3, "0")}`;
  }
});

/* ===============================
   METHODS
================================ */
UserSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", UserSchema);
