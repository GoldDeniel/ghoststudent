import * as vscode from "vscode";
import * as net from "net";

export class Host {
  private server?: net.Server;
  private clients: net.Socket[] = [];
  public isBroadcasting = true; // The ON/OFF Switch

  public start() {
    if (this.server) {
      vscode.window.showInformationMessage("Already hosting!");
      return;
    }

    this.server = net.createServer((socket) => {
      this.clients.push(socket);
      vscode.window.showInformationMessage("A student connected!");
      socket.on(
        "end",
        () => (this.clients = this.clients.filter((c) => c !== socket)),
      );
      socket.on(
        "error",
        () => (this.clients = this.clients.filter((c) => c !== socket)),
      );
    });

    this.server.listen(8765, () => {
      vscode.window.showInformationMessage("Ghost Host started on Port 8765");
    });

    // Listen for typing and cursor movement
    vscode.workspace.onDidChangeTextDocument(() => this.broadcast());
    vscode.window.onDidChangeTextEditorSelection(() => this.broadcast());
  }

  public toggle() {
    this.isBroadcasting = !this.isBroadcasting;
    vscode.window.showInformationMessage(
      `Ghost Broadcasting is now ${this.isBroadcasting ? "ON" : "OFF"}`,
    );
  }

  private broadcast() {
    // If turned off, or no students, do nothing
    if (!this.isBroadcasting || this.clients.length === 0) return;

    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const line = editor.selection.active.line;
    const text = editor.document.lineAt(line).text;

    const payload = JSON.stringify({ line, text }) + "\n";
    this.clients.forEach((socket) => {
      try {
        socket.write(payload);
      } catch (e) {}
    });
  }

  public stop() {
    if (this.server) this.server.close();
  }
}
