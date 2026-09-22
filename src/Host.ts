import * as vscode from "vscode";
import { WebSocketServer, WebSocket } from "ws";
import * as http from "http";

export class Host {
  private server?: http.Server;
  private wss?: WebSocketServer;
  private clients: Set<WebSocket> = new Set();
  public isBroadcasting = true;
  public isServerRunning = false; // Add this!

  public start() {
    if (this.server) {
      vscode.window.showInformationMessage("Already hosting!");
      return;
    }

    this.server = http.createServer();
    this.wss = new WebSocketServer({ server: this.server });

    this.wss.on("connection", (ws) => {
      this.clients.add(ws);
      vscode.window.showInformationMessage("A student connected!");
      this.broadcast();

      ws.on("close", () => this.clients.delete(ws));
      ws.on("error", () => this.clients.delete(ws));
    });

    this.server.listen(8765, () => {
      this.isServerRunning = true; // Mark as running
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

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  public stop() {
    if (this.wss) this.wss.close();
    if (this.server) this.server.close();
    this.server = undefined;
    this.wss = undefined;
    this.isServerRunning = false; // Mark as stopped
    vscode.window.showInformationMessage("Ghost Hosting Stopped.");
  }
}
