import io from "socket.io-client";
import * as http from "http";
import { ChatService } from "./chatService";

describe("Chat Service", function () {
  let chatService;
  let newMessageEventName = "test__new_message";
  let httpServer;
  const port = 8989;
  const chatServiceEndpoint = `ws://localhost:${port}`;
  const connectOptions = {
    forceNew: true,
  };

  beforeEach(function (done) {
    httpServer = http.createServer();
    chatService = new ChatService({
      port,
      server: httpServer,
      newMessageEventName: newMessageEventName,
      acceptableOrigins: ["*"],
    });
    done();
  });

  afterEach((done) => {
    chatService.close(() => {
      httpServer.close(() => {
        done();
      });
    });
  });

  it.only("can receive and send a message back to the original chat room", (done) => {
    let client1;
    const chatRoom = { label: "Water Tribe", name: "/waterTribe" };
    const message = {
      message: "Hello World",
      chatRoom,
    };
    let receivedMessages = 0;

    const checkMessage = (client: SocketIOClient.Socket) => {
      client.on(chatRoom.name, function (data) {
        expect(data.message).toEqual(message.message);
        receivedMessages++;
        client.disconnect();
      });
    };

    const sendMessageToServer = (
      client: SocketIOClient.Socket,
      message: any
    ) => {
      client.emit(newMessageEventName, message);
    };

    client1 = io.connect(chatServiceEndpoint, connectOptions);
    client1.on("connect_error", function (err) {
      console.log(err);
    });
    client1.on("error", function (err) {
      console.log(err);
    });
    client1.on("connect", function () {
      console.log("Client 1 connected");
    });
    sendMessageToServer(client1, message);
    checkMessage(client1);
    client1.on("disconnect", function () {
      if (receivedMessages === 1) {
        done();
      }
    });
  });

  // should send back error if chat room does not exist

  it("can receive and send a message for multiple users", (done) => {
    let client1, client2, client3;
    const chatRoom = { label: "Water Tribe", name: "/waterTribe" };
    const message = {
      message: "Hello World",
      chatRoom,
    };
    let receivedMessages = 0;

    const checkMessage = (client: SocketIOClient.Socket) => {
      console.log("checking message!");
      client.on(chatRoom.name, function (msg) {
        expect(msg).toEqual(message);
        client.disconnect();
        console.log(receivedMessages);
        receivedMessages++;
        if (receivedMessages === 3) {
          done();
        }
      });
    };

    const sendMessageToServer = (
      client: SocketIOClient.Socket,
      message: any
    ) => {
      console.log("Sending message to chatService!");
      client.emit(newMessageEventName, message);
    };

    client1 = io.connect(chatServiceEndpoint, connectOptions);

    client1.on("connect", function (data) {
      sendMessageToServer(client1, message);
      checkMessage(client1);
      client2 = io.connect(chatServiceEndpoint, connectOptions);

      client2.on("connect", function (data) {
        sendMessageToServer(client2, message);
        checkMessage(client2);

        client3 = io.connect(chatServiceEndpoint, connectOptions);
        sendMessageToServer(client3, message);
        checkMessage(client3);

        client3.on("connect", function (data) {
          // client2.send(message);
        });
      });
    });
  }, 10000);

  // it("multiple clients can connect and send messages to that room, which is all visible to everyone", () => {});

  // it("notifies all users when a new user connects", () => {});
  // it("can handle bad received messages", () => {});

  // it("can handle sending back a copy of messages before the user joined for a given chat room", () => {});

  // it("can notify client when a user is typing", () => {});

  // it("can show which room other users are in", () => {});

  // describe("First (hopefully useful) test", function () {
  //   it("Doing some things with indexOf()", function (done) {
  //     expect([1, 2, 3].indexOf(5)).toEqual(-1);
  //     expect([1, 2, 3].indexOf(0)).toEqual(-1);
  //     done();
  //   });
  // });
});
