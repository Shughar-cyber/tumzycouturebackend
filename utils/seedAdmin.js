// Run with: npm run seed:admin
// Creates (or updates) a single admin account from ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD env vars.
import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "../config/db.js";
import Admin from "../models/Admin.js";
import mongoose from "mongoose";

const run = async () => {
  await connectDB();

  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;

  if (!email || !password) {
    console.error("Set ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD in .env first.");
    process.exit(1);
  }

  let admin = await Admin.findOne({ email });

  if (admin) {
    admin.password = password;
    await admin.save();
    console.log(`Updated password for existing admin: ${email}`);
  } else {
    admin = await Admin.create({ name: "TCS Admin", email, password });
    console.log(`Created admin: ${email}`);
  }

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
