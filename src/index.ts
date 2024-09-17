import colors from "colors";
import { Server } from "socket.io";
import { corsConfig } from "./config/cors";
import app from "./server";
import { gameHandler } from "./socketHandlers/gameHandler";

const port = process.env.PORT || 4000;

const server = app.listen(port, () => {
  console.log(colors.cyan.bold(`Server is running on port ${port}`));
});

const io = new Server(server, {
  cors: corsConfig,
  // connectionStateRecovery: {},
});

// Socket.io
io.on("connection", (socket) => {
  console.log("User connected socketId:", socket.id);

  gameHandler(io, socket);
  // socket.on("message", msg => {
  //   console.log("message: " + msg);
  //   io.emit("received", "I received your message");
  // });
});

