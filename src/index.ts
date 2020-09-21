require("dotenv").config();
const app = require("express")();
const cors = require("cors");
const acceptableOrigins = [
  "https://clever-aryabhata-d8e12c.netlify.app",
  "http://localhost:3000",
];
app.use(cors({ origins: acceptableOrigins }));
const server = require("http").createServer(app);
const chatServer = require("socket.io")(server);

server.listen(process.env.PORT);

app.get("/", (req, res) => {
  res.send(200);
});

app.get("/port", (req, res) => {
  res.send({ data: { port: process.env.PORT } });
});

app.get("/chat/rooms", (req, res) => {
  const chatRooms = [
    {
      label: "Water Tribe",
      name: "/waterTribe",
    },
    {
      label: "Earth Kingdom",
      name: "/earthKingdom",
    },
    {
      label: "Fire Nation",
      name: "/fireNation",
    },
    {
      label: "Air Nation",
      name: "/airNation",
    },
  ];
  res.send({ data: { chatRooms } });
});

chatServer.origins(acceptableOrigins);

console.log(`Server is up and listening at ${process.env.PORT}`);

chatServer.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("new_message", (data) => {
    console.log(data);
    const { message, username, clientTimestamp } = data;
    chatServer.sockets.emit("chat_room", {
      message,
      username,
      clientTimestamp,
      serverTimestamp: new Date().toISOString(),
    });
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});
