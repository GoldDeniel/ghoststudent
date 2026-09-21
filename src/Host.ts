import * as vscode from "vscode";
import { WebSocketServer, WebSocket } from "ws";
import * as http from "http";

export class Host {
  private server?: http.Server;
  private wss?: WebSocketServer;
  private clients: Set<WebSocket> = new Set();
  public isBroadcasting = true;

  public start() {
    if (this.server) {
      vscode.window.showInformationMessage("Already hosting!");
      return;
    }

    // Create an HTTP server and attach the WebSocket server to it
    this.server = http.createServer();
    this.wss = new WebSocketServer({ server: this.server });

    this.wss.on("connection", (ws) => {
      this.clients.add(ws);
      vscode.window.showInformationMessage("A student connected!");

      // Instantly send the full document to the new student
      this.broadcast();

      ws.on("close", () => this.clients.delete(ws));
      ws.on("error", () => this.clients.delete(ws));
    });

    this.server.listen(8765, () => {
      vscode.window.showInformationMessage(
        "Ghost Host started on Port 8765 (WebSocket)",
      );
    });

    vscode.workspace.onDidChangeTextDocument(() => this.broadcast());
  }

  public toggle() {
    this.isBroadcasting = !this.isBroadcasting;
    vscode.window.showInformationMessage(
      `Ghost Broadcasting is now ${this.isBroadcasting ? "ON" : "OFF"}`,
    );
    this.broadcast();
  }

  private broadcast() {
    if (!this.isBroadcasting || this.clients.size === 0) return;

    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const lines = editor.document.getText().split("\n");
    const payload = JSON.stringify({ lines });

    // WebSockets automatically frame messages, so we don't need the '\n' at the end!
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  public stop() {
    if (this.wss) this.wss.close();
    if (this.server) this.server.close();
  }
}
