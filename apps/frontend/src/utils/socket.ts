import { io } from "socket.io-client";

// change to your backend host if needed
const SOCKET_URL = import.meta.env.VITE_BACKEND_WS_URL || "http://localhost:3000";

export const socket = io(SOCKET_URL, {
    transports: ["websocket"], // prefer WS over polling
    autoConnect: true,
});