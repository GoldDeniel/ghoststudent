import * as vscode from "vscode";
import * as net from "net";
import { GhostRenderer } from "./GhostRenderer";

export class Student {
  private client?: net.Socket;
  private renderer = new GhostRenderer();

  public async connect() {
    const ip = await vscode.window.showInputBox({
      prompt: "Enter Teacher's IP (blank for localhost)",
    });

    if (ip === undefined) return;
    const targetIp = ip === "" ? "127.0.0.1" : ip;

    this.client = net.createConnection({ port: 8765, host: targetIp }, () => {
      vscode.window.showInformationMessage("Connected to Teacher!");
    });

    let buffer = "";
    this.client.on("data", (data) => {
      buffer += data.toString();
      let parts = buffer.split("\n");
      buffer = parts.pop() || "";

      for (let part of parts) {
        if (part) {
          try {
            const parsed = JSON.parse(part);
            this.renderer.render(parsed.line, parsed.text);
          } catch (e) {}
        }
      }
    });
  }

  public stop() {
    if (this.client) this.client.destroy();
  }
}
