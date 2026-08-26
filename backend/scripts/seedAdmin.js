/**
 * One-time bootstrap script to promote an already-registered user to
 * the "admin" role. There's no API endpoint for this deliberately —
 * self-service admin promotion over HTTP would be a privilege
 * escalation risk. Run this from the server/deploy environment instead:
 *
 *   node scripts/seedAdmin.js user@example.com
 *
 * The person must have already registered a normal account through the
 * app before running this.
 */
import "dotenv/config";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import mongoose from "mongoose";

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("Usage: node scripts/seedAdmin.js <email>");
    process.exit(1);
  }

  await connectDB();

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user) {
    console.error(
      `No user found with email "${email}". They need to register a normal account first.`
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  if (user.role === "admin") {
    console.log(`${user.email} is already an admin.`);
  } else {
    user.role = "admin";
    await user.save();
    console.log(`✔ ${user.email} is now an admin.`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to promote user:", err.message);
  process.exit(1);
});
