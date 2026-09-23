import express from "express";
import { loginAdmin, logoutAdmin, getAdminProfile } from "../controllers/authController.js";
import { protectAdmin } from "../middleware/auth.js";
import {
  createDesign,
  updateDesign,
  deleteDesign,
} from "../controllers/designController.js";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";
import {
  getRequests,
  getRequestById,
  updateRequestStatus,
  getDashboardStats,
  deleteRequest,
} from "../controllers/requestController.js";
import { uploadDesignImages } from "../config/cloudinary.js";

const router = express.Router();

// Auth
router.post("/login", loginAdmin);
router.post("/logout", logoutAdmin);
router.get("/me", protectAdmin, getAdminProfile);

// Dashboard
router.get("/dashboard-stats", protectAdmin, getDashboardStats);

// Design management (protected)
// Accepts: mainImage (1), additionalImages (up to 4), videos (up to 1)
const designMediaFields = uploadDesignImages.fields([
  { name: "mainImage", maxCount: 1 },
  { name: "additionalImages", maxCount: 4 },
  { name: "videos", maxCount: 1 },
]);
router.post("/designs", protectAdmin, designMediaFields, createDesign);
router.patch("/designs/:id", protectAdmin, designMediaFields, updateDesign);
router.delete("/designs/:id", protectAdmin, deleteDesign);

// Category management (protected)
router.post("/categories", protectAdmin, createCategory);
router.patch("/categories/:id", protectAdmin, updateCategory);
router.delete("/categories/:id", protectAdmin, deleteCategory);

// Request management (protected)
router.get("/requests", protectAdmin, getRequests);
router.get("/requests/:id", protectAdmin, getRequestById);
router.patch("/requests/:id", protectAdmin, updateRequestStatus);
router.delete("/requests/:id", protectAdmin, deleteRequest);

export default router;

