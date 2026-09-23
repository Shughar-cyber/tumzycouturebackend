import asyncHandler from "express-async-handler";
import Request from "../models/Request.js";
import Design from "../models/Design.js";
import { generateRequestNumber } from "../utils/generateRequestNumber.js";
import { uploadBufferToCloudinary } from "../config/cloudinary.js";

// @route POST /api/requests (public — no account required)
export const createRequest = asyncHandler(async (req, res) => {
  const {
    customerName,
    email,
    phone,
    whatsapp,
    designId,
    quantity,
    preferredSize,
    preferredColor,
    preferredDate,
    measurements,
    notes,
  } = req.body;

  if (!customerName || !email || !phone || !designId || !preferredSize) {
    res.status(400);
    throw new Error(
      "Full name, email, phone, selected design and preferred size are required"
    );
  }

  const design = await Design.findById(designId);
  if (!design) {
    res.status(404);
    throw new Error("Selected design could not be found");
  }
  if (!design.available) {
    res.status(400);
    throw new Error("This design is currently unavailable for requests");
  }

  const requestNumber = await generateRequestNumber();

  const requestData = {
    requestNumber,
    customerName,
    email,
    phone,
    whatsapp: whatsapp || "",
    design: design._id,
    designName: design.name,
    designPrice: design.price,
    quantity: quantity || 1,
    preferredSize,
    preferredColor: preferredColor || "",
    notes: notes || "",
  };

  if (preferredDate) requestData.preferredDate = preferredDate;
  if (measurements) {
    requestData.measurements =
      typeof measurements === "string" ? JSON.parse(measurements) : measurements;
  }
  if (req.file) {
    requestData.referenceImage = await uploadBufferToCloudinary(
      req.file.buffer,
      "reference-images"
    );
  }

  const request = await Request.create(requestData);

  res.status(201).json({
    success: true,
    request: {
      requestNumber: request.requestNumber,
      customerName: request.customerName,
      email: request.email,
      phone: request.phone,
      designName: request.designName,
      designPrice: request.designPrice,
      createdAt: request.createdAt,
    },
  });
});

// @route GET /api/admin/requests
// Supports ?status= &search= &design=
export const getRequests = asyncHandler(async (req, res) => {
  const { status, search, design, from, to } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (design) filter.design = design;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }
  if (search) {
    filter.$or = [
      { customerName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { requestNumber: { $regex: search, $options: "i" } },
      { designName: { $regex: search, $options: "i" } },
    ];
  }

  const requests = await Request.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, count: requests.length, requests });
});

// @route GET /api/admin/requests/:id
export const getRequestById = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id).populate(
    "design",
    "name mainImage category price"
  );
  if (!request) {
    res.status(404);
    throw new Error("Request not found");
  }
  res.json({ success: true, request });
});

// @route PATCH /api/admin/requests/:id
export const updateRequestStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ["New", "Contacted", "Confirmed", "In Progress", "Completed", "Cancelled"];

  if (!status || !validStatuses.includes(status)) {
    res.status(400);
    throw new Error(`Status must be one of: ${validStatuses.join(", ")}`);
  }

  const request = await Request.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  if (!request) {
    res.status(404);
    throw new Error("Request not found");
  }

  res.json({ success: true, request });
});

// @route GET /api/admin/dashboard-stats
export const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalDesigns, availableDesigns, totalRequests, newRequests, inProgress, completed] =
    await Promise.all([
      Design.countDocuments(),
      Design.countDocuments({ available: true }),
      Request.countDocuments(),
      Request.countDocuments({ status: "New" }),
      Request.countDocuments({ status: "In Progress" }),
      Request.countDocuments({ status: "Completed" }),
    ]);

  const recentRequests = await Request.find().sort({ createdAt: -1 }).limit(8);

  res.json({
    success: true,
    stats: { totalDesigns, availableDesigns, totalRequests, newRequests, inProgress, completed },
    recentRequests,
  });
});

// @route DELETE /api/admin/requests/:id
export const deleteRequest = asyncHandler(async (req, res) => {
  const request = await Request.findByIdAndDelete(req.params.id);
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }
  res.json({ success: true, message: 'Request deleted' });
});

