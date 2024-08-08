import colors from "colors";
import mongoose from "mongoose";
import { exit } from "node:process";

export const connectDB = async () => {
  try {
    const { connection } = await mongoose.connect(process.env.DATABASE_URL);

    const url = `${connection.host}:${connection.port}`;
    console.log(colors.magenta.bold("MongoDB connected: " + url));
  } catch (error) {
    console.log(colors.bgRed.bold("Error connecting to MongoDB"));
    console.log(error.message);
    exit(1);
  }
};
