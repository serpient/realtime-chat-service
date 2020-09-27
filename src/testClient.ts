import io from "socket.io-client";
import { OutgoingMessage, ChatRoom } from "./data/types";
import { chatRooms } from "./data/chatRooms";
import { chatRoomIsValid } from "./validation";

export class TestClient {
  public client: SocketIOClient.Socket;
  public newMessageEventName: string;
  public receivedMessageCount: number;
  public receivedMessages: { [key: string]: OutgoingMessage[] };
  public clientName: string;

  constructor({
    chatServiceEndpoint,
    newMessageEventName = "new_message",
    connectOptions = {},
    clientName,
  }: {
    chatServiceEndpoint: string;
    newMessageEventName?: string;
    connectOptions?: object;
    clientName: string;
  }) {
    this.newMessageEventName = newMessageEventName;
    this.clientName = clientName;
    this.receivedMessageCount = 0;
    this.receivedMessages = {};
    this.client = io.connect(chatServiceEndpoint, connectOptions);
    this.setupListeners();
  }

  private setupListeners = () => {
    this.client
      .on("connect_error", (err) => {
        console.log(err);
      })
      .on("error", (err) => {
        console.log(err);
      })
      .on("reconnect", (attemptNumber) => {
        console.log(attemptNumber);
      })
      .on("reconnect_error", (err) => {
        console.log(err);
      })
      .on("reconnect_error", (err) => {
        console.log(err);
      })
      .on("connect_timeout", (timeout) => {
        console.log(timeout);
      })
      .on("connect", () => {
        console.log(`${this.clientName} connected`);
      });

    chatRooms.forEach((room) => {
      this.client.on(room.name, (data: any) => {
        this.receivedMessageCount++;
        this.handleSavingMessages(data, room);
      });
    });
  };

  private handleSavingMessages = (
    data: OutgoingMessage,
    chatRoom: ChatRoom
  ): void => {
    let messageForChatRoom = this.receivedMessages[chatRoom.name];
    if (messageForChatRoom) {
      this.receivedMessages[chatRoom.name] = [...messageForChatRoom, data];
    } else {
      this.receivedMessages[chatRoom.name] = [data];
    }
  };

  public sendMessageToServer = (message: any) => {
    console.log(`Sending message for ${this.clientName}`);
    this.client.emit(this.newMessageEventName, message);
  };

  public waitForMessageInChatRoom = (
    chatRoom: ChatRoom,
    messageNumber: number
  ): Promise<void> => {
    return new Promise((resolve) => {
      this.client.on(chatRoom.name, (data) => {
        console.log(
          `Received message from ${chatRoom.name} for ${
            this.clientName
          }: [${JSON.stringify(data)}]`
        );
        if (!chatRoomIsValid(chatRoom)) {
          this.receivedMessageCount++;
          this.handleSavingMessages(data, chatRoom);
        }
        if (this.receivedMessageCount === messageNumber) {
          resolve();
        }
      });
    });
  };

  public disconnect = () => {
    this.client.disconnect();
  };

  public waitForDisconnect = (): Promise<void> => {
    return new Promise((resolve) => {
      this.client.on("disconnect", (reason) => {
        console.log(`${this.clientName} disconnected`);
        resolve();
      });
    });
  };
}
