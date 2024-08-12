import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import { corsConfig } from "./config/cors";
import { connectDB } from "./config/db";
import gameRoutes from "./routes/GameRoutes";
import authRoutes from "./routes/authRoutes";

dotenv.config();

connectDB();

const app = express();

// Habilitar CORS
app.use(cors(corsConfig));

// Logger
app.use(morgan("dev"));

// Leer datos de formularios
app.use(express.json());

// Routes
app.use("/api/games", gameRoutes);
app.use("/api/auth", authRoutes);

export default app;
