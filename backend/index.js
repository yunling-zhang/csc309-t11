// backend/index.js
import express from "express";
import routes from "./routes.js";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables from .env (if present)
dotenv.config();

// FRONTEND_URL from env, fallback for local dev
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const app = express();

// Enable CORS for ONLY the configured frontend origin
app.use(
  cors({
    origin: FRONTEND_URL,
  })
);

// Parse JSON bodies
app.use(express.json());

// Mount routes
app.use("", routes);

export default app;
