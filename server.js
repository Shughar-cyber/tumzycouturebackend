import "dotenv/config.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { connectDB } from "./config/db.js";
import publicRoutes from "./routes/publicRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Ensure the DB connection resolves before each request is handled —
// important for serverless environments like Vercel where the process
// may be cold-started per invocation.
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "TCS Tumzy Couture and Styles API is running" });
});

app.use("/api", publicRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

// Only bind to a port when running locally / on a traditional Node host.
// On Vercel, the app is imported as a serverless function handler instead,
// so app.listen() must never run there.
if (process.env.VERCEL !== "1") {
  const PORT = process.env.PORT || 5000;
  connectDB()
    .then(() => {
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => {
      console.error("Failed to connect to MongoDB:", err.message);
      process.exit(1);
    });
}

export default app;
