import { WebSocketServer } from "ws";
import { orchestrateAgents } from "./orchestrator.js";

export function createWSServer(server) {
  const wss = new WebSocketServer({ server });

  console.log("🔧 WebSocket server initialized");

  wss.on("connection", (ws) => {
    console.log("🔌 WebSocket client connected");

    ws.send(JSON.stringify({ 
      type: "connection",
      message: "WebSocket connected"
    }));

    ws.on("message", async (msg) => {
      try {
        const data = JSON.parse(msg);

        if (data.type === "run_agents") {
          orchestrateAgents(ws, data.prompt);
        }

        if (data.type === "cancel") {
          ws.send(JSON.stringify({ type: "cancel_ack" }));
          ws.close();
        }

      } catch (err) {
        console.error("❌ WS error:", err);
        ws.send(JSON.stringify({ 
          type: "error",
          message: err.message 
        }));
      }
    });

    ws.on("close", () => {
      console.log("❌ WebSocket client disconnected");
    });
  });

  return wss;
}