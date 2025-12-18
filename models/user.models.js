import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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

const ProfileSchema = new mongoose.Schema(
  {
    headline: String,
    bio: String,
    phone: String,
    location: String,
    skills: [String],
    education: [EducationSchema],
    experience: [ExperienceSchema],
    position: String, // ✅ REQUIRED
    socialLinks: {
      linkedin: String,
      twitter: String,
      facebook: String,
      instagram: String,
      website: String,
    },
    company: String, // ✅ REQUIRED
    yearsOfExperience: String, // ✅ REQUIRED
    avatar: String,
  },
  { _id: false }
);

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

/*  
===========================================================
  SINGLE PRE-SAVE HOOK  (Correct)
===========================================================
*/
UserSchema.pre("save", async function () {
  // 1️⃣ Hash password
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // 2️⃣ Generate Member ID for new users
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

// Compare password
UserSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", UserSchema);
