import * as http from "http";
import { ChatService } from "./chatService";
import { TestClient } from "./testClient";
import { ChatRoom, IncomingMessage, IncomingUserInfo } from "./data/types";
import { events } from "./data/eventNames";

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
    uuid: "1234",
    username: "bear_bear",
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
    await client1.waitForMessage(chatRoom.name, 1);
    expect(client1.receivedMessages[chatRoom.name][0].data.message).toEqual(
      message.message
    );
    expect(client1.receivedMessageCount).toEqual(1);

    Promise.all([client1.disconnectAndWait]).then(() => {
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
    await client1.waitForMessage(chatRoom.name, 1);
    await client2.waitForMessage(chatRoom.name, 1);
    await client3.waitForMessage(chatRoom.name, 1);

    client3.sendMessageToServer(message);
    await client1.waitForMessage(chatRoom.name, 2);
    await client2.waitForMessage(chatRoom.name, 2);
    await client3.waitForMessage(chatRoom.name, 2);

    expect(client3.receivedMessageCount).toEqual(2);
    expect(client2.receivedMessageCount).toEqual(2);
    expect(client1.receivedMessageCount).toEqual(2);

    Promise.all([
      client1.disconnectAndWait,
      client2.disconnectAndWait,
      client3.disconnectAndWait,
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
      uuid: "1234",
      username: "bear_bear",
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
    await client1.waitForMessage(events.ERROR, 1);
    expect(client1.receivedMessages[events.ERROR][0]).toEqual({
      error: {
        message: "Chat room does not exist",
        status: 404,
        errors: [],
      },
      data: null,
    });
    expect(client2.receivedMessageCount).toEqual(0);

    Promise.all([client1.disconnectAndWait, client2.disconnectAndWait]).then(
      () => {
        done();
      }
    );
  });

  it("will send back error is message is missing required fields", async (done) => {
    const badMessage = {
      message: "Hello World",
      username: "bear_bear",
      uuid: "1234",
    };
    const client1 = new TestClient({
      chatServiceEndpoint,
      newMessageEventName,
      connectOptions,
      clientName: "Client_1",
    });

    client1.sendMessageToServer(badMessage);
    await client1.waitForMessage(events.ERROR, 1);
    expect(client1.receivedMessages[events.ERROR][0]).toEqual({
      error: {
        message: "Incoming message is not valid",
        status: 404,
        errors: ["should have required property 'chatRoom'"],
      },
      data: null,
    });

    Promise.all([client1.disconnectAndWait]).then(() => {
      done();
    });
  });

  it("can show which room other users are in", async (done) => {
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

    const client1Presence: IncomingUserInfo = {
      username: "client1",
      avatar: "image link",
      currentRoom: {
        label: "Water Tribe",
        name: "/waterTribe",
      },
    };
    client1.sendMessageToServer(
      client1Presence,
      events.NEW_PRESENCE_INFORMATION
    );
    await client1.waitForMessage(events.PRESENCE_INFORMATION, 1);
    await client2.waitForMessage(events.PRESENCE_INFORMATION, 1);
    await client3.waitForMessage(events.PRESENCE_INFORMATION, 1);
    expect(
      client1.receivedMessages[events.PRESENCE_INFORMATION][0].data
    ).toEqual(
      expect.objectContaining({
        usersPerRoom: {
          "/waterTribe": [{ username: "client1", avatar: "image link" }],
          "/earthKingdom": [],
          "/fireNation": [],
          "/airNation": [],
        },
      })
    );

    const client2Presence: IncomingUserInfo = {
      username: "client2",
      avatar: "image link",
      currentRoom: {
        label: "Earth Kingdom",
        name: "/earthKingdom",
      },
    };
    client2.sendMessageToServer(
      client2Presence,
      events.NEW_PRESENCE_INFORMATION
    );
    await client1.waitForMessage(events.PRESENCE_INFORMATION, 2);
    await client2.waitForMessage(events.PRESENCE_INFORMATION, 2);
    await client3.waitForMessage(events.PRESENCE_INFORMATION, 2);
    expect(
      client2.receivedMessages[events.PRESENCE_INFORMATION][1].data
    ).toEqual(
      expect.objectContaining({
        usersPerRoom: {
          "/waterTribe": [{ username: "client1", avatar: "image link" }],
          "/earthKingdom": [{ username: "client2", avatar: "image link" }],
          "/fireNation": [],
          "/airNation": [],
        },
      })
    );

    const client3Presence: IncomingUserInfo = {
      username: "client3",
      avatar: "image link",
      currentRoom: {
        label: "Earth Kingdom",
        name: "/earthKingdom",
      },
    };
    client3.sendMessageToServer(
      client3Presence,
      events.NEW_PRESENCE_INFORMATION
    );
    await client1.waitForMessage(events.PRESENCE_INFORMATION, 3);
    await client2.waitForMessage(events.PRESENCE_INFORMATION, 3);
    await client3.waitForMessage(events.PRESENCE_INFORMATION, 3);
    expect(
      client3.receivedMessages[events.PRESENCE_INFORMATION][2].data
    ).toEqual(
      expect.objectContaining({
        usersPerRoom: {
          "/waterTribe": [{ username: "client1", avatar: "image link" }],
          "/earthKingdom": [
            { username: "client2", avatar: "image link" },
            { username: "client3", avatar: "image link" },
          ],
          "/fireNation": [],
          "/airNation": [],
        },
      })
    );

    expect(client1.receivedMessageCount).toEqual(3);
    expect(client2.receivedMessageCount).toEqual(3);
    expect(client3.receivedMessageCount).toEqual(3);

    await client3.disconnectAndWait();

    await client1.waitForMessage(events.PRESENCE_INFORMATION, 4);
    await client2.waitForMessage(events.PRESENCE_INFORMATION, 4);
    expect(
      client2.receivedMessages[events.PRESENCE_INFORMATION][3].data
    ).toEqual(
      expect.objectContaining({
        usersPerRoom: {
          "/waterTribe": [{ username: "client1", avatar: "image link" }],
          "/earthKingdom": [{ username: "client2", avatar: "image link" }],
          "/fireNation": [],
          "/airNation": [],
        },
      })
    );

    Promise.all([client1.disconnectAndWait, client2.disconnectAndWait]).then(
      () => {
        done();
      }
    );
  }, 10000);

  // it("can notify client when a user is typing", () => {});

  // it("can handle sending back a copy of messages before the user joined for a given chat room", () => {});

  // sends back error when server is down
});
