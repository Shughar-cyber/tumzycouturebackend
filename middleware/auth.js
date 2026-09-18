import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import Admin from "../models/Admin.js";

// Protects admin-only routes using the JWT stored in an httpOnly cookie
export const protectAdmin = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.tcs_admin_token;

  if (!token) {
    res.status(401);
    throw new Error("Not authorized — please log in");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select("-password");

    if (!admin) {
      res.status(401);
      throw new Error("Not authorized — admin no longer exists");
    }

    req.admin = admin;
    next();
  } catch (err) {
    res.status(401);
    throw new Error("Not authorized — invalid or expired session");
  }
});
