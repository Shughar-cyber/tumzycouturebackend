import asyncHandler from "express-async-handler";
import Category from "../models/Category.js";
import Design from "../models/Design.js";
import { slugify } from "../utils/slugify.js";

// @route GET /api/categories (public)
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.json({ success: true, categories });
});

// @route POST /api/admin/categories
export const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name) {
    res.status(400);
    throw new Error("Category name is required");
  }
  const category = await Category.create({
    name,
    slug: slugify(name),
    description: description || "",
  });
  res.status(201).json({ success: true, category });
});

// @route PATCH /api/admin/categories/:id
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }
  const { name, description } = req.body;
  if (name) {
    category.name = name;
    category.slug = slugify(name);
  }
  if (description !== undefined) category.description = description;
  await category.save();
  res.json({ success: true, category });
});

// @route DELETE /api/admin/categories/:id
export const deleteCategory = asyncHandler(async (req, res) => {
  const inUse = await Design.exists({ category: req.params.id });
  if (inUse) {
    res.status(400);
    throw new Error("Cannot delete a category that still has designs assigned to it");
  }
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }
  res.json({ success: true, message: "Category deleted" });
});
