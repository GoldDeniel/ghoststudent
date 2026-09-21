import * as vscode from "vscode";
import * as net from "net";

export class Host {
  private server?: net.Server;
  private clients: net.Socket[] = [];
  public isBroadcasting = true;

  public start() {
    if (this.server) {
      vscode.window.showInformationMessage("Already hosting!");
      return;
    }

    this.server = net.createServer((socket) => {
      this.clients.push(socket);
      vscode.window.showInformationMessage("A student connected!");

      // Instantly send the full document to the new student
      this.broadcast();

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

    // Listen for ANY typing in the whole document
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
    if (!this.isBroadcasting || this.clients.length === 0) return;

    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    // Grab ALL lines in the document
    const lines = editor.document.getText().split("\n");

    // Send the array of lines to the students
    const payload = JSON.stringify({ lines }) + "\n";
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
