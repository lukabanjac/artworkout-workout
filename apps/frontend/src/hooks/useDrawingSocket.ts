import { useEffect } from "react";
import { socket } from "../lib/socket";

export function useDrawingSocket(onReceivePoints: (data: any) => void) {
    useEffect(() => {
        socket.on("connect", () => {
            console.log("✅ Connected to WebSocket server:", socket.id);
        });

        socket.on("drawing-update", (data) => {
            console.log("🎨 Received drawing update:", data);
            onReceivePoints(data);
        });

        socket.on("disconnect", () => {
            console.log("❌ Disconnected from WebSocket server");
        });

        return () => {
            socket.off("drawing-update");
            socket.off("connect");
            socket.off("disconnect");
        };
    }, [onReceivePoints]);

    const sendPoints = (points: number[]) => {
        socket.emit("send-points", { points });
    };

    return { sendPoints };
}