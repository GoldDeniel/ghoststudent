import * as vscode from "vscode";
import WebSocket from "ws";
import { GhostRenderer } from "./GhostRenderer";

export class Student {
  private ws?: WebSocket;
  private renderer = new GhostRenderer();

  public async connect() {
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
      // Strip http/https if they added it out of habit
      targetUrl = targetUrl.replace(/^http:\/\//i, "");
      targetUrl = targetUrl.replace(/^https:\/\//i, "");

      const isIP = /^[0-9.]+$/.test(targetUrl);
      const isLocalHost = targetUrl.toLowerCase() === "localhost";
      const isWindowsPCName = !targetUrl.includes("."); // No dots = local PC name
      const isLocalDomain = targetUrl.endsWith(".local");

      if (isIP || isLocalHost || isWindowsPCName || isLocalDomain) {
        // LOCAL NETWORK: Use raw WebSockets and add our port
        targetUrl = `ws://${targetUrl}:8765`;
      } else {
        // PUBLIC INTERNET: Use secure WebSockets (Nginx handles the port)
        targetUrl = `wss://${targetUrl}`;
      }
    }

    vscode.window.showInformationMessage(`Connecting to ${targetUrl}...`);

    this.ws = new WebSocket(targetUrl);

    this.ws.on("open", () => {
      vscode.window.showInformationMessage(`Connected to Teacher!`);
    });

    this.ws.on("message", async (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.lines) {
          await this.handleIncomingLines(parsed.lines);
        }
      } catch (e) {
        console.error("Failed to parse Ghost Data", e);
      }
    });

    this.ws.on("error", (err) => {
      vscode.window.showErrorMessage(`Connection failed: ${err.message}`);
    });

    vscode.workspace.onDidChangeTextDocument(() => this.renderer.reRender());
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
    if (this.ws) this.ws.close();
  }
}
