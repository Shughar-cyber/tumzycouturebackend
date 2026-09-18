import Request from "../models/Request.js";

// Generates a request number like TCS-REQ-2026-00125 using a per-year counter
export const generateRequestNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `TCS-REQ-${year}-`;

  const lastRequest = await Request.findOne({
    requestNumber: { $regex: `^${prefix}` },
  }).sort({ createdAt: -1 });

  let nextSeq = 1;
  if (lastRequest) {
    const lastSeq = parseInt(lastRequest.requestNumber.split("-").pop(), 10);
    if (!Number.isNaN(lastSeq)) nextSeq = lastSeq + 1;
  }

  return `${prefix}${String(nextSeq).padStart(5, "0")}`;
};
