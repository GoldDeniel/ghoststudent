import * as vscode from "vscode";
import { Host } from "./Host";
import { Student } from "./Student";

export function activate(context: vscode.ExtensionContext) {
  const host = new Host();
  const student = new Student();

  // 1. Register Core Commands
  let hostCmd = vscode.commands.registerCommand("ghoststudent.host", () =>
    host.start(),
  );
  let toggleCmd = vscode.commands.registerCommand("ghoststudent.toggle", () =>
    host.toggle(),
  );
  let connectCmd = vscode.commands.registerCommand("ghoststudent.connect", () =>
    student.connect(),
  );

  // 2. Create the Status Bar Button (Bottom Right)
  let statusBarBtn = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );
  // $(radio-tower) uses a built-in VS Code icon!
  statusBarBtn.text = "$(radio-tower) Ghost Student";
  statusBarBtn.tooltip = "Click to open Ghost Student Menu";
  statusBarBtn.command = "ghoststudent.menu";
  statusBarBtn.show();

  // 3. Create the Menu Command (When the button is clicked)
  let menuCmd = vscode.commands.registerCommand(
    "ghoststudent.menu",
    async () => {
      // Create the options for the dropdown
      const options = [
        { label: "$(play) Start Hosting", description: "Teacher" },
        { label: "$(plug) Connect to Teacher", description: "Student" },
        {
          label: host.isBroadcasting
            ? "$(mute) Pause Broadcasting"
            : "$(unmute) Resume Broadcasting",
          description: "Teacher Toggle",
        },
      ];

      // Show the menu to the user
      const choice = await vscode.window.showQuickPick(options, {
        placeHolder: "Ghost Student: What would you like to do?",
      });

      // Execute based on what they clicked
      if (choice) {
        if (choice.label.includes("Start Hosting")) {
          host.start();
          statusBarBtn.text = "$(broadcast) Hosting Ghost"; // Change icon when hosting
        } else if (choice.label.includes("Connect")) {
          student.connect();
          statusBarBtn.text = "$(check) Ghost Connected"; // Change icon when connected
        } else if (choice.label.includes("Broadcasting")) {
          host.toggle();
          if (!host.isBroadcasting) {
            statusBarBtn.text = "$(mute) Ghost Paused";
          } else {
            statusBarBtn.text = "$(broadcast) Hosting Ghost";
          }
        }
      }
    },
  );

  // Register everything so it cleans up when VS Code closes
  context.subscriptions.push(
    hostCmd,
    toggleCmd,
    connectCmd,
    menuCmd,
    statusBarBtn,
  );
}

export function deactivate() {
  // Cleanup if needed
}
