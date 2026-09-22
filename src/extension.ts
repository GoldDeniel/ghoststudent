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

  let statusBarBtn = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );
  statusBarBtn.text = "$(radio-tower) Ghost Student";
  statusBarBtn.tooltip = "Click to open Ghost Student Menu";
  statusBarBtn.command = "ghoststudent.menu";
  statusBarBtn.show();

  // Helper function to update the button icon based on state
  const updateStatusBar = () => {
    if (host.isServerRunning) {
      statusBarBtn.text = host.isBroadcasting
        ? "$(broadcast) Hosting Ghost"
        : "$(mute) Ghost Paused";
    } else if (student.isConnected) {
      statusBarBtn.text = student.isListening
        ? "$(check) Ghost Connected"
        : "$(eye-closed) Ghost Hidden";
    } else {
      statusBarBtn.text = "$(radio-tower) Ghost Student";
    }
  };

  let menuCmd = vscode.commands.registerCommand(
    "ghoststudent.menu",
    async () => {
      // DYNAMIC MENU GENERATION
      const options: vscode.QuickPickItem[] = [];

      if (!host.isServerRunning && !student.isConnected) {
        // Idle State (Can choose to host OR connect)
        options.push({
          label: "$(play) Start Hosting",
          description: "Become the Teacher",
        });
        options.push({
          label: "$(plug) Connect to Teacher",
          description: "Become a Student",
        });
      } else if (host.isServerRunning) {
        // Teacher State (Can toggle broadcast or stop server)
        options.push({
          label: host.isBroadcasting
            ? "$(mute) Pause Broadcasting"
            : "$(unmute) Resume Broadcasting",
          description: "Teacher Toggle",
        });
        options.push({
          label: "$(stop) Stop Hosting",
          description: "Close the server and disconnect students",
        });
      } else if (student.isConnected) {
        // Student State (Can hide ghost text or disconnect)
        options.push({
          label: student.isListening
            ? "$(eye-closed) Hide Ghost Text"
            : "$(eye) Show Ghost Text",
          description: "Student Toggle",
        });
        options.push({
          label: "$(debug-disconnect) Disconnect",
          description: "Leave the session",
        });
      }

      const choice = await vscode.window.showQuickPick(options, {
        placeHolder: "Ghost Student: What would you like to do?",
      });

      if (choice) {
        // Handle actions based on the label text
        if (choice.label.includes("Start Hosting")) host.start();
        else if (choice.label.includes("Stop Hosting")) host.stop();
        else if (choice.label.includes("Connect")) student.connect();
        else if (choice.label.includes("Disconnect")) student.stop();
        else if (choice.label.includes("Broadcasting")) host.toggle();
        else if (choice.label.includes("Ghost Text")) student.toggle();

        // Refresh the icon on the bottom bar immediately
        updateStatusBar();
      }
    },
  );

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
