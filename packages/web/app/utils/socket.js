import io from "socket.io-client";

//specify a URL to connect to the Websocket
export const socket = io("http://localhost:3001");
