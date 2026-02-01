/*
 * REMEMBER TO RESTART SERVER (or find a auto-start provider like nodemon)
 */

import { WebSocketServer } from "ws";
import http from "http";
import url from "url";
import { v4 as uuidv4 } from "uuid";

const server = http.createServer();
const wsServer = new WebSocketServer({ server });
const port = 5634;

const connections = {};
const users = {};

const broadcast = () => {
  Object.keys(connections).forEach(uuid => {
    const connection = connections[uuid];
    const message = JSON.stringify(users);
    connection.send(String("this is a broadcast from ws server"));
  });
}

wsServer.on("connection", (connection, request) => {
  let { screenid } = url.parse(request.url, true).query;
  const uuid = uuidv4();
  connections[uuid] = connection;

  console.log("client connected : #", uuid);
  connection.send(`client ${uuid.substring(0,5)} connected!`);

  const handleMessage = (message, uuid) => {
    let mensaje = "no messages yet";

    // TODO: needs to be revised and made actually useful
    try {
      mensaje = String(message);
    } catch (err) {
      console.error("something happened, when handling your message: ", err);
      mensaje = message.toString();
    }

    const user = users[uuid];
    //user.state = mensaje;
    broadcast();

    console.log("message received: ", message.toString(), "\n");
    connection.send(message);
  };

  const handleClose = (uuid) => {
    console.log("connection closed -- ", uuid);
    return;
  }

  connection.on("message", (message) => handleMessage(message, uuid));
  connection.on("close", () => handleClose(uuid));
});

server.listen(port, () => {
  console.log(`WebSocket server is running on port ${port}`);
});
