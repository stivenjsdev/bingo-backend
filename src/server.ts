import dotenv from "dotenv";
import express from "express";
import { connectDB } from "./config/db";
import gameRoutes from "./routes/GameRoutes";

dotenv.config();

connectDB();

const app = express();

app.use(express.json());

// Routes
app.use("/api/games", gameRoutes);

export default app;
