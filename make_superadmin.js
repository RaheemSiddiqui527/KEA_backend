import mongoose from 'mongoose';
import User from './models/user.models.js';

const uri = "mongodb://kea_admin:nexcore_alliance@72.62.241.150:27038/admin?authSource=admin";

async function run() {
  try {
    await mongoose.connect(uri);
    const email = "support@kokaniengineers.org";
    let user = await User.findOne({ email });
    
    if (user) {
      user.role = 'superadmin';
      user.membershipStatus = 'approved';
      user.password = "AdminPass123!";
      await user.save();
      console.log(`Successfully updated existing user ${email} to superadmin.`);
    } else {
      user = new User({
        name: "Support Team",
        email,
        password: "AdminPass123!",
        role: 'superadmin',
        membershipStatus: 'approved',
        memberId: 'KEA-SADM-' + Date.now(), // Generate a unique ID to avoid index collision
        profile: {
          phone: "0000000000"
        }
      });
      await user.save();
      console.log(`Successfully created new superadmin for ${email} with password: AdminPass123!`);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
