This application acts as the http server & websocket server for the [Realtime-Chat client](https://clever-aryabhata-d8e12c.netlify.app/).

## Quick Start

```bash
git clone https://github.com/serpient/realtime-chat-service.git
cd realtime-chat-service
yarn install

# To start locally at localhost:34000
yarn start

# To run tests
yarn test
```

#### Development Endpoints

```bash
websocketEndpoint='ws://localhost:34000'
serverEndpoint='http://localhost:34000'
```

#### Production Endpoints

```bash
websocketEndpoint=`wss://realtime-chat-service.herokuapp.com`
serverEndpoint=`https://realtime-chat-service.herokuapp.com`
```

## Deployment

Application is deployed and can be played with here: [https://realtime-chat-service.herokuapp.com/](https://realtime-chat-service.herokuapp.com/).

The project uses github actions to handle running tests with each commit. Heroku handles the automatic deployment.

## Technical Stack

The project utilizes:

- TypeScript
- Socket.io
- Express
- Jest
- ajv & ts-json-schema-generator. This flow of `typescript types -> json-schema -> validators` was used to automate the creation of type validators for validating incoming data from the client

- ChatService class handles all server-socket handling.
- There is a TestClient which was created for the ChatService e2e tests. It is almost identical to the ChatClient on the frontend, other than a few test helper functions.

#### Current Features

- Receives messages and sends it back to the specified chat room
- Receive presence info from connected clients at specified times
- Emit presence info to all connected clients at specified times
- Validates incoming data

## HTTP Routes

#### GET /

```json
OK
```

#### GET /rooms

Returns ChatRoom data

```json
{
  "data": {
    "chatRooms": [
      {
        "label": "Cooking",
        "name": "/cooking"
      },
      {
        "label": "$$Money$$",
        "name": "/money"
      },
      {
        "label": "Traveling",
        "name": "/travel"
      },
      {
        "label": "Damn Cute Fur Babies",
        "name": "/pets"
      }
    ]
  }
}
```

## Websocket Events

#### new_message: Incoming chat messages

Used to send new chat messages to server. Incoming messages should have the following shape

```json
{
  "message": "Hiya!",
  "username": "bing_xing",
  "chatRoom": { "label": "$$Money$$", "name": "/money" },
  "uuid": "a662cd95-4649-494e-8445-a767d1b3f4a7"
}
```

#### `<chat room label>`: Outgoing message for Chat Rooms

For any of the chat room names, ex: `/cooking`, `/money`, `/travel`, `/pets`. Server will send out messages like so:

```json
{
  "data": {
    "message": "Hiya!",
    "username": "bing_xing",
    "chatRoom": { "label": "$$Money$$", "name": "/money" },
    "uuid": "e8444329-83eb-4096-9457-4a615c689cb2",
    "serverTimestamp": "2020-09-28T05:01:11.299Z"
  },
  "error": null
}
```

#### server_error: Outgoing error data

If the server hits any processable errors (like invalid chat room name, invalid data type, etc), then the server will send out a message like this:

```json
{
  "data": null,
  "error": {
    "message": "Incoming message is not valid",
    "status": 404,
    "errors": ["should have required property 'chatRoom'"]
  }
}
```

#### new_presence_information: Incoming presence information

This is the presence info for a given connected client. It should be received whenever a user joins a new chat room and when they disconnect.

```json
{
  "username": "client1",
  "avatar": "image link",
  "currentRoom": {
    "label": "Cooking",
    "name": "/cooking"
  }
}
```

#### presence_information: Outgoing presence information for all clients

This is the presence information per-room, for all connected clients. It is emitted to all connected clients whenever a user changes-room or disconnects.

```json
{
  "data": {
    "usersPerRoom": {
      "/cooking": [{ "username": "client1", "avatar": "image link" }],
      "/money": [],
      "/travel": [],
      "/pets": []
    }
  },
  "error": null
}
```

## Future refactor

- There are a lot of duplication of types and the client-socket class between the frontend and backend. I would use a library like `nx` that allow me to organize the 2 projects in one repo, and extract the common types and socket clients into a separate module that can be easily used by both.
