import asyncHandler from "express-async-handler";
import Design from "../models/Design.js";
import cloudinary, { uploadBufferToCloudinary, uploadVideoToCloudinary } from "../config/cloudinary.js";
import { slugify } from "../utils/slugify.js";

// @route GET /api/designs (public)
export const getDesigns = asyncHandler(async (req, res) => {
  const { category, search, featured, available } = req.query;
  const filter = {};

  if (category) {
    const Category = (await import("../models/Category.js")).default;
    const cat = await Category.findOne({ slug: category });
    if (cat) filter.category = cat._id;
    else return res.json({ success: true, count: 0, designs: [] });
  }

  if (featured === "true") filter.featured = true;
  if (available === "true") filter.available = true;

  if (search) {
    filter.$text = { $search: search };
  }

  const designs = await Design.find(filter)
    .populate("category", "name slug")
    .sort({ createdAt: -1 });

  res.json({ success: true, count: designs.length, designs });
});

// @route GET /api/designs/:idOrSlug (public)
export const getDesignByIdOrSlug = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);

  const design = await Design.findOne(
    isObjectId ? { _id: idOrSlug } : { slug: idOrSlug }
  ).populate("category", "name slug");

  if (!design) {
    res.status(404);
    throw new Error("Design not found");
  }

  res.json({ success: true, design });
});

// @route POST /api/admin/designs
// Expects multipart/form-data:
//   mainImage   (1 image file, required)
//   additionalImages (up to 4 image files — total with main = max 5)
//   videos      (up to 1 video file, optional)
export const createDesign = asyncHandler(async (req, res) => {
  const { name, description, category, price, colors, sizes, fabric, available, featured } =
    req.body;

  if (!name || !description || !category || !price) {
    res.status(400);
    throw new Error("Name, description, category and price are required");
  }

  const mainFile = req.files?.mainImage?.[0];
  if (!mainFile) {
    res.status(400);
    throw new Error("A main image is required");
  }

  const additionalFiles = req.files?.additionalImages || [];
  const videoFiles = req.files?.videos || [];

  // Enforce max 5 total images (1 main + up to 4 additional)
  if (additionalFiles.length > 4) {
    res.status(400);
    throw new Error("You can upload a maximum of 5 images total (1 main + 4 additional)");
  }

  const mainImage = await uploadBufferToCloudinary(mainFile.buffer, "designs");
  const additionalImages = await Promise.all(
    additionalFiles.map((f) => uploadBufferToCloudinary(f.buffer, "designs"))
  );
  const videos = await Promise.all(
    videoFiles.map((f) => uploadVideoToCloudinary(f.buffer, "designs"))
  );

  const design = await Design.create({
    name,
    slug: `${slugify(name)}-${Date.now().toString().slice(-5)}`,
    description,
    category,
    price,
    colors: colors ? JSON.parse(colors) : [],
    sizes: sizes ? JSON.parse(sizes) : [],
    fabric: fabric || "",
    mainImage,
    additionalImages,
    videos,
    available: available === undefined ? true : available === "true" || available === true,
    featured: featured === "true" || featured === true,
  });

  res.status(201).json({ success: true, design });
});

// @route PATCH /api/admin/designs/:id
export const updateDesign = asyncHandler(async (req, res) => {
  const design = await Design.findById(req.params.id);
  if (!design) {
    res.status(404);
    throw new Error("Design not found");
  }

  const { name, description, category, price, colors, sizes, fabric, available, featured } =
    req.body;

  if (name) {
    design.name = name;
    design.slug = `${slugify(name)}-${design._id.toString().slice(-5)}`;
  }
  if (description) design.description = description;
  if (category) design.category = category;
  if (price !== undefined) design.price = price;
  if (colors) design.colors = JSON.parse(colors);
  if (sizes) design.sizes = JSON.parse(sizes);
  if (fabric !== undefined) design.fabric = fabric;
  if (available !== undefined) design.available = available === "true" || available === true;
  if (featured !== undefined) design.featured = featured === "true" || featured === true;

  // Replace main image if a new one was uploaded
  if (req.files?.mainImage?.[0]) {
    await cloudinary.uploader.destroy(design.mainImage.publicId).catch(() => {});
    design.mainImage = await uploadBufferToCloudinary(req.files.mainImage[0].buffer, "designs");
  }

  // Append newly uploaded additional images (enforce 4 additional max)
  if (req.files?.additionalImages?.length) {
    const remaining = 4 - design.additionalImages.length;
    const toUpload = req.files.additionalImages.slice(0, Math.max(remaining, 0));
    const uploaded = await Promise.all(
      toUpload.map((f) => uploadBufferToCloudinary(f.buffer, "designs"))
    );
    design.additionalImages.push(...uploaded);
  }

  // Append newly uploaded videos (max 1)
  if (req.files?.videos?.length) {
    // Replace existing video if one exists
    if (design.videos?.length) {
      await Promise.all(
        design.videos.map((v) => cloudinary.uploader.destroy(v.publicId, { resource_type: "video" }).catch(() => {}))
      );
      design.videos = [];
    }
    const uploadedVideos = await Promise.all(
      req.files.videos.slice(0, 1).map((f) => uploadVideoToCloudinary(f.buffer, "designs"))
    );
    design.videos = uploadedVideos;
  }

  // Remove specific additional images by publicId
  if (req.body.removeImagePublicIds) {
    const idsToRemove = JSON.parse(req.body.removeImagePublicIds);
    for (const publicId of idsToRemove) {
      await cloudinary.uploader.destroy(publicId).catch(() => {});
    }
    design.additionalImages = design.additionalImages.filter(
      (img) => !idsToRemove.includes(img.publicId)
    );
  }

  // Remove specific videos by publicId
  if (req.body.removeVideoPublicIds) {
    const idsToRemove = JSON.parse(req.body.removeVideoPublicIds);
    for (const publicId of idsToRemove) {
      await cloudinary.uploader.destroy(publicId, { resource_type: "video" }).catch(() => {});
    }
    design.videos = (design.videos || []).filter(
      (v) => !idsToRemove.includes(v.publicId)
    );
  }

  await design.save();
  res.json({ success: true, design });
});

// @route DELETE /api/admin/designs/:id
export const deleteDesign = asyncHandler(async (req, res) => {
  const design = await Design.findById(req.params.id);
  if (!design) {
    res.status(404);
    throw new Error("Design not found");
  }

  const imagePublicIds = [design.mainImage.publicId, ...design.additionalImages.map((i) => i.publicId)];
  const videoPublicIds = (design.videos || []).map((v) => v.publicId);

  await Promise.all([
    ...imagePublicIds.map((id) => cloudinary.uploader.destroy(id).catch(() => {})),
    ...videoPublicIds.map((id) => cloudinary.uploader.destroy(id, { resource_type: "video" }).catch(() => {})),
  ]);

  await design.deleteOne();
  res.json({ success: true, message: "Design deleted" });
});
