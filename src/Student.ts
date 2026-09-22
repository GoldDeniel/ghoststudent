import * as vscode from "vscode";
import WebSocket from "ws";
import { GhostRenderer } from "./GhostRenderer";

export class Student {
  private ws?: WebSocket;
  private renderer = new GhostRenderer();
  public isListening = true;
  public isConnected = false;

  // THE CACHE: Remembers the teacher's code even when paused
  private lastReceivedLines: string[] = [];

  public async connect() {
    if (this.isConnected) {
      vscode.window.showInformationMessage("Already connected to a teacher!");
      return;
    }

    const address = await vscode.window.showInputBox({
      prompt: "Enter Teacher's URL, IP, or PC Name",
      placeHolder:
        "e.g., ghoststudent.deniels-server.net, 192.168.1.50, or DESKTOP-ABC",
    });

    if (address === undefined) return;

    let targetUrl = address.trim();
    if (targetUrl === "") {
      targetUrl = "ws://127.0.0.1:8765";
    } else if (
      !targetUrl.startsWith("ws://") &&
      !targetUrl.startsWith("wss://")
    ) {
      targetUrl = targetUrl.replace(/^http:\/\//i, "");
      targetUrl = targetUrl.replace(/^https:\/\//i, "");
      const isIP = /^[0-9.]+$/.test(targetUrl);
      const isLocalHost = targetUrl.toLowerCase() === "localhost";
      const isWindowsPCName = !targetUrl.includes(".");
      const isLocalDomain = targetUrl.endsWith(".local");

      if (isIP || isLocalHost || isWindowsPCName || isLocalDomain) {
        targetUrl = `ws://${targetUrl}:8765`;
      } else {
        targetUrl = `wss://${targetUrl}`;
      }
    }

    vscode.window.showInformationMessage(`Connecting to ${targetUrl}...`);
    this.ws = new WebSocket(targetUrl);

    this.ws.on("open", () => {
      this.isConnected = true;
      this.lastReceivedLines = []; // Reset cache on new connection
      vscode.window.showInformationMessage(`Connected to Teacher!`);
    });

    this.ws.on("message", async (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.lines) {
          // ALWAYS save the teacher's latest code to memory
          this.lastReceivedLines = parsed.lines;

          // Only draw it if the student wants to see it
          if (this.isListening) {
            await this.handleIncomingLines(this.lastReceivedLines);
          }
        }
      } catch (e) {
        console.error("Failed to parse Ghost Data", e);
      }
    });

    this.ws.on("close", () => {
      this.isConnected = false;
      vscode.window.showInformationMessage("Disconnected from Teacher.");
    });

    this.ws.on("error", (err) => {
      this.isConnected = false;
      vscode.window.showErrorMessage(`Connection failed: ${err.message}`);
    });

    vscode.workspace.onDidChangeTextDocument(() => {
      if (this.isListening) this.renderer.reRender();
    });
  }

  public toggle() {
    this.isListening = !this.isListening;

    if (!this.isListening) {
      vscode.window.showInformationMessage("Ghost Text: HIDDEN");
      // Safely wipe the screen using our new function
      this.renderer.clear();
    } else {
      vscode.window.showInformationMessage("Ghost Text: SHOWN");
      // Instantly redraw the screen using the background cache!
      if (this.lastReceivedLines.length > 0) {
        this.handleIncomingLines(this.lastReceivedLines);
      }
    }
  }

  private async handleIncomingLines(teacherLines: string[]) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const config = vscode.workspace.getConfiguration("ghoststudent");
    const autoCreate = config.get<boolean>("autoCreateLines");

    if (autoCreate && teacherLines.length > editor.document.lineCount) {
      const linesToAdd = teacherLines.length - editor.document.lineCount;
      const edit = new vscode.WorkspaceEdit();
      const lastLine = editor.document.lineAt(editor.document.lineCount - 1);

      edit.insert(
        editor.document.uri,
        lastLine.range.end,
        "\n".repeat(linesToAdd),
      );
      await vscode.workspace.applyEdit(edit);
    }

    this.renderer.renderAll(teacherLines);
  }

  public stop() {
    if (this.ws) {
      this.ws.close();
      this.isConnected = false;
    }
    this.renderer.clear();
  }
}
