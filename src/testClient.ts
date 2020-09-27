import io from "socket.io-client";
import { OutgoingMessage, ChatRoom } from "./data/types";
import { chatRooms } from "./data/chatRooms";

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

  public sendMessageToServer = (message: OutgoingMessage) => {
    this.client.emit(this.newMessageEventName, message);
  };

  public checkMessageInChatRoom = (chatRoom: ChatRoom, callback: Function) => {
    this.client.on(chatRoom.name, (data) => {
      callback(data);
    });
  };

  public disconnect = () => {
    this.client.disconnect();
  };

  public onDisconnect = (callback: Function) => {
    this.client.on("disconnect", (reason) => {
      console.log(`${this.clientName} disconnected`);
      callback(reason);
    });
  };
}
