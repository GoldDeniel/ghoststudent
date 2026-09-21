import * as vscode from "vscode";

export class GhostRenderer {
  // Define the styling
  private decorationType = vscode.window.createTextEditorDecorationType({
    after: { color: "#888888", fontStyle: "italic" },
  });

  public render(teacherLineNum: number, teacherText: string) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    let studentText = "";

    // Grab the student's text safely
    if (teacherLineNum < editor.document.lineCount) {
      studentText = editor.document.lineAt(teacherLineNum).text;
    }

    let ghostText = "";

    // Core logic: Hide what the student already typed
    if (teacherText.startsWith(studentText)) {
      ghostText = teacherText.substring(studentText.length);
    } else {
      ghostText = "    // Teacher: " + teacherText;
    }

    // If it's a perfect match, clear the ghost text and stop!
    if (ghostText === "") {
      editor.setDecorations(this.decorationType, []);
      return;
    }

    // Calculate where to put the ghost text safely
    const safeLineNum = Math.min(
      teacherLineNum,
      Math.max(0, editor.document.lineCount - 1),
    );
    const safeCharNum =
      safeLineNum === teacherLineNum
        ? studentText.length
        : editor.document.lineAt(safeLineNum).text.length;

    if (teacherLineNum >= editor.document.lineCount) {
      ghostText = `  // (Line ${teacherLineNum + 1}): ` + ghostText;
    }

    const range = new vscode.Range(
      safeLineNum,
      safeCharNum,
      safeLineNum,
      safeCharNum,
    );

    editor.setDecorations(this.decorationType, [
      {
        range: range,
        renderOptions: { after: { contentText: ghostText } },
      },
    ]);
  }
}
