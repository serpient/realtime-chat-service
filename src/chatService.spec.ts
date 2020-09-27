import * as http from "http";
import { ChatService } from "./chatService";
import { TestClient } from "./testClient";
import { ChatRoom, IncomingMessage } from "./data/types";

describe("Chat Service", () => {
  let chatService;
  let newMessageEventName = "test__new_message";
  let httpServer;
  const port = 8989;
  const chatServiceEndpoint = `ws://localhost:${port}`;
  const connectOptions = {
    forceNew: true,
  };
  const chatRoom: ChatRoom = { label: "Water Tribe", name: "/waterTribe" };
  const message: IncomingMessage = {
    message: "Hello World",
    chatRoom,
  };
  const errorListener = "server_error";
  const errorListenerRoom = { name: errorListener, label: "" };

  beforeEach(() => {
    httpServer = http.createServer();
    chatService = new ChatService({
      port,
      server: httpServer,
      newMessageEventName: newMessageEventName,
      acceptableOrigins: ["*"],
    });
  });

  afterEach(async (done) => {
    await chatService.close();
    done();
  });

  it("can receive and send a message back to the original chat room", async (done) => {
    const client1 = new TestClient({
      chatServiceEndpoint,
      newMessageEventName,
      connectOptions,
      clientName: "Client_1",
    });

    client1.sendMessageToServer(message);
    await client1.waitForMessageInChatRoom(chatRoom, 1);
    expect(client1.receivedMessages[chatRoom.name][0].data.message).toEqual(
      message.message
    );
    expect(client1.receivedMessageCount).toEqual(1);

    client1.disconnect();
    Promise.all([client1.waitForDisconnect]).then(() => {
      done();
    });
  });

  it("can send a message, and other users in the same chatRoom will receive it", async (done) => {
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
    const client3 = new TestClient({
      chatServiceEndpoint,
      newMessageEventName,
      connectOptions,
      clientName: "Client_3",
    });

    client1.sendMessageToServer(message);
    await client2.waitForMessageInChatRoom(chatRoom, 1);

    client3.sendMessageToServer(message);
    await client3.waitForMessageInChatRoom(chatRoom, 2);

    expect(client3.receivedMessageCount).toEqual(2);
    expect(client2.receivedMessageCount).toEqual(2);
    expect(client1.receivedMessageCount).toEqual(2);

    client3.disconnect();
    client2.disconnect();
    client1.disconnect();

    Promise.all([
      client1.waitForDisconnect,
      client2.waitForDisconnect,
      client3.waitForDisconnect,
    ]).then(() => {
      done();
    });
  });

  it("will send back error to only the client if chat room does not exist", async (done) => {
    const chatRoom: ChatRoom = {
      label: "Secret Chat Room",
      name: "/doesNotExist",
    };
    const message: IncomingMessage = {
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
    await client1.waitForMessageInChatRoom(errorListenerRoom, 1);
    expect(client1.receivedMessages[errorListener][0]).toEqual({
      error: {
        message: "Chat room does not exist",
        status: 404,
      },
      data: null,
    });
    expect(client2.receivedMessageCount).toEqual(0);

    client1.disconnect();
    client2.disconnect();
    Promise.all([client1.waitForDisconnect, client2.waitForDisconnect]).then(
      () => {
        done();
      }
    );
  });

  it("will send back error is message is missing required fields", async (done) => {
    const badMessage = {
      message: "Hello World",
    };
    const client1 = new TestClient({
      chatServiceEndpoint,
      newMessageEventName,
      connectOptions,
      clientName: "Client_1",
    });

    client1.sendMessageToServer(badMessage);
    await client1.waitForMessageInChatRoom(errorListenerRoom, 1);
    expect(client1.receivedMessages[errorListener][0]).toEqual({
      error: {
        message: "The message is missing required fields",
        status: 404,
      },
      data: null,
    });

    client1.disconnect();
    Promise.all([client1.waitForDisconnect]).then(() => {
      done();
    });
  });

  // it("notifies all users when a new user connects", () => {});

  // it("can handle bad received messages", () => {});

  // it("can handle sending back a copy of messages before the user joined for a given chat room", () => {});

  // it("can notify client when a user is typing", () => {});

  // it("can show which room other users are in", () => {});
});
