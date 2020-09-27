import io from "socket.io";
import * as http from "http";
import { chatRooms } from "./data/chatRooms";
import { IncomingMessage } from "./data/types";
import { validateIncomingMessage, chatRoomIsValid } from "./validation";

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

  public close = (callback: Function): Promise<void> => {
    return new Promise((resolve) => {
      this.chatServer.close(() => {
        this.server.close(() => {
          console.log("ChatServer & HTTP Server closed");
          resolve();
        });
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
    socket.on(this.newMessageEventName, (data: IncomingMessage) => {
      console.log(data);
      const { isValid, errors } = validateIncomingMessage(data);
      if (isValid) {
        const { chatRoom } = data;
        if (chatRoomIsValid(chatRoom)) {
          this.chatServer.in(chatRoom.name).emit(chatRoom.name, {
            data: {
              ...data,
              serverTimestamp: new Date().toISOString(),
            },
            error: null,
          });
        } else {
          this.sendBackError({
            message: "Chat room does not exist",
          });
        }
      } else {
        this.sendBackError({
          message: "Incoming message is not valid",
          errors,
        });
      }
    });
  };

  private sendBackError = ({
    status = 404,
    message,
    errors = [],
  }: {
    status?: number;
    message: string;
    errors?: string[];
  }): void => {
    this.chatServer.emit("server_error", {
      data: null,
      error: {
        status,
        message,
        errors,
      },
    });
  };
}
