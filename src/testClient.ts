import io from "socket.io-client";
import { OutgoingMessage } from "./data/types";
import { events } from "./data/eventNames";

export class TestClient {
  public client: SocketIOClient.Socket;
  public newMessageEventName: string;
  public receivedMessageCount: number;
  public receivedMessages: { [key: string]: OutgoingMessage[] };
  public clientName: string;

  constructor({
    chatServiceEndpoint,
    newMessageEventName = events.NEW_MESSAGE,
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
  };

  public disconnectAndWait = (): Promise<void> => {
    return new Promise((resolve) => {
      this.client.once("disconnect", (reason) => {
        console.log(`${this.clientName} disconnected`);
        resolve();
      });
      this.client.disconnect();
    });
  };

  public sendMessageToServer = (message: any, eventName?: string) => {
    console.log(`Sending message for ${this.clientName}`);
    this.client.emit(eventName || this.newMessageEventName, message);
  };

  public waitForMessage = (
    eventName: string,
    messageNumber: number
  ): Promise<void> => {
    return new Promise((resolve) => {
      this.client.once(eventName, (data) => {
        console.log(
          `Received message from ${eventName} for ${
            this.clientName
          }: [${JSON.stringify(data)}]`
        );
        this.receivedMessageCount++;
        this.handleSavingMessages(data, eventName);
        if (this.receivedMessageCount >= messageNumber) {
          resolve();
        }
      });
    });
  };

  private handleSavingMessages = (
    data: OutgoingMessage,
    eventName: string
  ): void => {
    let messageForChatRoom = this.receivedMessages[eventName];
    if (messageForChatRoom) {
      this.receivedMessages[eventName] = [...messageForChatRoom, data];
    } else {
      this.receivedMessages[eventName] = [data];
    }
  };
}
