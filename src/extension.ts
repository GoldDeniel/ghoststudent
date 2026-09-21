import * as vscode from "vscode";
import { Host } from "./Host";
import { Student } from "./Student";

export function activate(context: vscode.ExtensionContext) {
  const host = new Host();
  const student = new Student();

  let hostCmd = vscode.commands.registerCommand("ghoststudent.host", () =>
    host.start(),
  );
  let toggleCmd = vscode.commands.registerCommand("ghoststudent.toggle", () =>
    host.toggle(),
  );
  let connectCmd = vscode.commands.registerCommand("ghoststudent.connect", () =>
    student.connect(),
  );

  context.subscriptions.push(hostCmd, toggleCmd, connectCmd);
}

export function deactivate() {
  // Cleanup will happen automatically based on architecture,
  // but you could call host.stop() and student.stop() here if needed.
}
