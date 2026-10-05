import express from "express";
import { configDotenv } from "dotenv";
import cors from "cors";

import videoRouter from "./routes/videoRoute";

configDotenv();

const app = express();

const PORT = process.env.PORT || 3000;

// ==========================================
// Middleware
// ==========================================

app.use(
  cors({
    origin: process.env.FRONTEND_URI,
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));

// ==========================================
// Routes
// ==========================================

app.use("/api/video", videoRouter);

// ==========================================
// Health Check
// ==========================================

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Video backend is running",
  });
});

// ==========================================
// Server
// ==========================================

app.listen(Number(PORT), () => {
  console.log(`App is listening on port ${PORT}`);
});