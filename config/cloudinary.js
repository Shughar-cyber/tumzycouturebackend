import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const IMAGE_MIMES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const VIDEO_MIMES = ["video/mp4", "video/webm", "video/mov", "video/quicktime"];

// Combined multer for images + videos — held in memory only.
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB per file
  fileFilter: (req, file, cb) => {
    const allowed = [...IMAGE_MIMES, ...VIDEO_MIMES];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPG, PNG, WEBP images or MP4/WEBM/MOV videos are allowed"));
  },
});

export const uploadDesignImages = memoryUpload;
export const uploadReferenceImage = memoryUpload;

// Streams an image buffer to Cloudinary and returns { url, publicId }.
export const uploadBufferToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `tcs-tumzy-couture/${folder}`,
        transformation: [{ width: 1600, crop: "limit", quality: "auto" }],
      },
      (err, result) => {
        if (err) return reject(err);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });

// Streams a video buffer to Cloudinary and returns { url, publicId }.
export const uploadVideoToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "video",
        folder: `tcs-tumzy-couture/${folder}`,
        transformation: [{ quality: "auto" }],
      },
      (err, result) => {
        if (err) return reject(err);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });

export default cloudinary;
