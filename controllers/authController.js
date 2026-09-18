import asyncHandler from "express-async-handler";
import Admin from "../models/Admin.js";
import { generateTokenAndSetCookie } from "../utils/generateToken.js";

// @route POST /api/admin/login
export const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const admin = await Admin.findOne({ email: email.toLowerCase() });

  if (!admin || !(await admin.comparePassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  generateTokenAndSetCookie(res, admin._id);

  res.json({
    success: true,
    admin: { id: admin._id, name: admin.name, email: admin.email },
  });
});

// @route POST /api/admin/logout
export const logoutAdmin = asyncHandler(async (req, res) => {
  res.cookie("tcs_admin_token", "", { httpOnly: true, expires: new Date(0) });
  res.json({ success: true, message: "Logged out" });
});

// @route GET /api/admin/me
export const getAdminProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, admin: req.admin });
});
