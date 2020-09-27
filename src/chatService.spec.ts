import io from "socket.io-client";
import * as http from "http";
import { ChatService } from "./chatService";
import { TestClient } from "./testClient";
import { ChatRoom, OutgoingMessage } from "./data/types";

describe("Chat Service", () => {
  let chatService;
  let newMessageEventName = "test__new_message";
  let httpServer;
  const port = 8989;
  const chatServiceEndpoint = `ws://localhost:${port}`;
  const connectOptions = {
    forceNew: true,
  };

  beforeEach(() => {
    httpServer = http.createServer();
    chatService = new ChatService({
      port,
      server: httpServer,
      newMessageEventName: newMessageEventName,
      acceptableOrigins: ["*"],
    });
  });

  afterEach((done) => {
    chatService.close(() => {
      done();
    });
  });

  it("can receive and send a message back to the original chat room", (done) => {
    const chatRoom: ChatRoom = { label: "Water Tribe", name: "/waterTribe" };
    const message: OutgoingMessage = {
      message: "Hello World",
      chatRoom,
    };

    const client1 = new TestClient({
      chatServiceEndpoint,
      newMessageEventName,
      connectOptions,
      clientName: "Client_1",
    });

    client1.sendMessageToServer(message);
    client1.checkMessageInChatRoom(chatRoom, (data) => {
      expect(data.message).toEqual(message.message);
      // only a single message was received for chatRoom
      expect(client1.receivedMessages[chatRoom.name][0].message).toEqual(
        message.message
      );
      // messages weren't sent to any other room
      expect(Object.keys(client1.receivedMessages)).toEqual([chatRoom.name]);
      expect(client1.receivedMessageCount).toEqual(1);
      client1.disconnect();
    });
    client1.onDisconnect(() => {
      done();
    });
  });

  it("can send a message, and other users in chatRoom will receive it", (done) => {
    const chatRoom: ChatRoom = { label: "Water Tribe", name: "/waterTribe" };
    const message: OutgoingMessage = {
      message: "Hello World",
      chatRoom,
    };
    const client1 = new TestClient({
      chatServiceEndpoint,
      newMessageEventName,
      connectOptions,
      clientName: "Client_1",
    });
    const client2 = new TestClient({
      chatServiceEndpoint,
      newMessageEventName,
      connectOptions,
      clientName: "Client_2",
    });

    client1.sendMessageToServer(message);

    client2.checkMessageInChatRoom(chatRoom, (data) => {
      expect(data.message).toEqual(message.message);
      expect(client2.receivedMessages[chatRoom.name][0].message).toEqual(
        message.message
      );
      expect(Object.keys(client2.receivedMessages)).toEqual([chatRoom.name]);
      expect(client2.receivedMessageCount).toEqual(1);
      expect(client1.receivedMessageCount).toEqual(1);

      client2.disconnect();
      client1.disconnect();
    });

    client2.onDisconnect(() => {
      client1.onDisconnect(() => {
        done();
      });
    });
  });

  // should send back error if chat room does not exist

  // it("notifies all users when a new user connects", () => {});

  // it("can handle bad received messages", () => {});

  // it("can handle sending back a copy of messages before the user joined for a given chat room", () => {});

  // it("can notify client when a user is typing", () => {});

  // it("can show which room other users are in", () => {});
});
