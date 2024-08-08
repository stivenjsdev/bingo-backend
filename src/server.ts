import dotenv from "dotenv";
import express from "express";
import { connectDB } from "./config/db";

dotenv.config();

connectDB();

const app = express();

export default app;
