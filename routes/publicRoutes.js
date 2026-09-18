import express from "express";
import { getDesigns, getDesignByIdOrSlug } from "../controllers/designController.js";
import { getCategories } from "../controllers/categoryController.js";
import { createRequest } from "../controllers/requestController.js";
import { uploadReferenceImage } from "../config/cloudinary.js";

const router = express.Router();

// Designs (public, read-only)
router.get("/designs", getDesigns);
router.get("/designs/:idOrSlug", getDesignByIdOrSlug);

// Categories (public, read-only)
router.get("/categories", getCategories);

// Requests (public — customers never log in)
router.post("/requests", uploadReferenceImage.single("referenceImage"), createRequest);

export default router;
