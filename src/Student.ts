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
    const targetPort = targetIp.split(":")[1] || "8765";
    this.client = net.createConnection(
      { port: parseInt(targetPort), host: targetIp.split(":")[0] },
      () => {
        vscode.window.showInformationMessage("Connected to Teacher!");
      },
    );

    let buffer = "";
    this.client.on("data", async (data) => {
      buffer += data.toString();
      let parts = buffer.split("\n");
      buffer = parts.pop() || "";

      for (let part of parts) {
        if (part) {
          try {
            const parsed = JSON.parse(part);
            if (parsed.lines) {
              await this.handleIncomingLines(parsed.lines);
            }
          } catch (e) {}
        }
      }
    });

    vscode.workspace.onDidChangeTextDocument(() => this.renderer.reRender());
  }

  private async handleIncomingLines(teacherLines: string[]) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const config = vscode.workspace.getConfiguration("ghoststudent");
    const autoCreate = config.get<boolean>("autoCreateLines");

    // If enabled, automatically create the missing empty lines in the student's file
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
    if (this.client) this.client.destroy();
  }
}
