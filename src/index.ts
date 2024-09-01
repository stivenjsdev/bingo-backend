import colors from "colors";
import { Server } from "socket.io";
import { corsConfig } from "./config/cors";
import app from "./server";
import { gameSocket } from "./sockets/gameSocket";

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
  console.log("a user connected", socket.id);

  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);
  });

  // socket.on("message", msg => {
  //   console.log("message: " + msg);
  //   io.emit("received", "I received your message");
  // });
});

gameSocket(io);
