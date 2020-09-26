import { ChatService } from "./chatService";
import { chatRooms } from "./data/chatRooms";
require("dotenv").config();
const app = require("express")();
const cors = require("cors");
const acceptableOrigins = [
  "https://clever-aryabhata-d8e12c.netlify.app",
  "http://localhost:3000",
];
app.use(cors({ origins: acceptableOrigins }));
const server = require("http").createServer(app);
new ChatService({
  port: parseInt(process.env.PORT),
  server,
  acceptableOrigins,
});

app.get("/", (req, res) => {
  res.send(200);
});

app.get("/rooms", (req, res) => {
  res.send({ data: { chatRooms } });
});
