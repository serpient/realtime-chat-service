import io from "socket.io";
import * as http from "http";
import { chatRooms } from "./data/chatRooms";

export class ChatService {
  public chatServer: SocketIO.Server;
  public newMessageEventName: string;
  private server: http.Server;
  private socket: SocketIO.Socket;

  constructor({
    port,
    server,
    acceptableOrigins = [
      "https://clever-aryabhata-d8e12c.netlify.app",
      "http://localhost:3000",
    ],
    newMessageEventName = "new_message",
  }: {
    port: number;
    server: http.Server;
    acceptableOrigins?: string[];
    newMessageEventName?: string;
  }) {
    this.newMessageEventName = newMessageEventName;
    this.server = server;
    this.setupChatService(port, acceptableOrigins);
    this.setupConnection();
  }

  public close = (callback: Function): void => {
    this.chatServer.close(() => {
      this.server.close(() => {
        console.log("ChatServer & HTTP Server closed");
        callback();
      });
    });
  };

  private setupChatService = (port, acceptableOrigins): void => {
    this.chatServer = io(this.server);
    this.server.listen(port);
    this.chatServer.origins((origin, callback) => {
      if (!acceptableOrigins.includes(origin)) {
        return callback("origin not allowed", false);
      }
      callback(null, true);
    });
    this.chatServer.on("error", (err) => {
      console.log(err);
    });
    console.log(`Server is up and listening at ${port}`);
  };

  private setupConnection = (): void => {
    this.chatServer.on("connection", (socket) => {
      console.log("Client has connected");
      this.socket = socket;

      this.setupChatRooms(socket);

      this.handleIncomingMessages(socket);

      socket.on("disconnect", () => {
        console.log("client disconnected");
      });
    });
  };

  private setupChatRooms = (socket: SocketIO.Socket): void => {
    chatRooms.forEach((room) => {
      socket.join(room.name);
    });
  };

  private handleIncomingMessages = (socket: SocketIO.Socket): void => {
    // TODO handling of message that dont match schema
    socket.on(this.newMessageEventName, (data) => {
      console.log(data);
      const { chatRoom } = data;
      this.chatServer.in(chatRoom.name).emit(chatRoom.name, {
        ...data,
        serverTimestamp: new Date().toISOString(),
      });
    });
  };
}
