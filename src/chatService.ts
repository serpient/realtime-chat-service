import io from "socket.io";
import * as http from "http";
import { chatRooms } from "./data/chatRooms";
import { IncomingMessage, IncomingUserInfo, UsersPerRoom } from "./data/types";
import {
  validateIncomingMessage,
  chatRoomIsValid,
  validateIncomingUserInfo,
} from "./validation";
import { events } from "./data/eventNames";

export class ChatService {
  public chatServer: SocketIO.Server;
  public newMessageEventName: string;
  private server: http.Server;
  private presenceInfo: { [socketId: string]: IncomingUserInfo };

  constructor({
    port,
    server,
    acceptableOrigins = [
      "https://clever-aryabhata-d8e12c.netlify.app",
      "http://localhost:3000",
    ],
    newMessageEventName = events.NEW_MESSAGE,
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
    this.presenceInfo = {};
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
    this.chatServer.on("connection", (client) => {
      console.log(`${client.id} has connected`);

      this.setupChatRooms(client);

      this.handleIncomingPresenceInfo(client);

      this.handleIncomingMessages(client);

      client
        .on("error", (err) => {
          console.log(err);
        })
        .on("disconnect", () => {
          console.log(`Client ${client.id} disconnected`);
          this.removeUserFromPresenceInfo(client.id);
        })
        .on("disconnecting", (reason) => {
          console.log(`Client ${client.id} disconnecting because of ${reason}`);
        });
    });
  };

  private setupChatRooms = (client: SocketIO.Socket): void => {
    chatRooms.forEach((room) => {
      client.join(room.name);
    });
  };

  private removeUserFromPresenceInfo = (clientId: string): void => {
    delete this.presenceInfo[clientId];
    this.emitPresenceInfo();
  };

  private handleIncomingPresenceInfo = (socket: SocketIO.Socket): void => {
    socket.on(events.NEW_PRESENCE_INFORMATION, (data) => {
      const { isValid, errors } = validateIncomingUserInfo(data);
      if (isValid) {
        const currentStoredInfo = this.presenceInfo[socket.id];
        if (
          !currentStoredInfo ||
          currentStoredInfo.currentRoom.name !== data.currentRoom.name
        ) {
          this.presenceInfo[socket.id] = data;
          this.emitPresenceInfo();
        } else {
          this.presenceInfo[socket.id] = data;
        }
      } else {
        console.log("not valid");
        this.sendBackError({
          message: "Incoming user info is not valid",
          errors,
        });
      }
    });
  };

  private emitPresenceInfo = (): void => {
    this.chatServer.emit(events.PRESENCE_INFORMATION, {
      data: {
        usersPerRoom: this.createPresenceInfoPerRoom(),
        serverTimestamp: new Date().toISOString(),
      },
      error: null,
    });
  };

  private createPresenceInfoPerRoom = (): UsersPerRoom => {
    const presenceInfoPerRoom = {};
    chatRooms.forEach((room) => {
      presenceInfoPerRoom[room.name] = [];
    });
    Object.values(this.presenceInfo).forEach((info) => {
      const { username, avatar } = info;
      if (presenceInfoPerRoom[info.currentRoom.name]) {
        presenceInfoPerRoom[info.currentRoom.name].push({ username, avatar });
      }
    });
    return presenceInfoPerRoom;
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
    this.chatServer.emit(events.ERROR, {
      data: null,
      error: {
        status,
        message,
        errors,
      },
    });
  };
}
