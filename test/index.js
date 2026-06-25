import express from "express";
import { WebSocketServer } from "ws";

const app = express();
const port = 8080;

const server = app.listen(port, () => {
  console.log("server is running....");
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("Client connected");
  ws.on("message", (data) => {
    ws.send("Hello from the server!");
  });
});
