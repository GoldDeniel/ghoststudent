import * as vscode from "vscode";
import { getLanguageRule } from "./LanguageRules";

export class GhostRenderer {
  private ghostStyle = vscode.window.createTextEditorDecorationType({
    after: {
      color: "#888888",
      fontStyle: "italic",
      textDecoration: "none; white-space: pre;",
    },
  });

  private errorStyle = vscode.window.createTextEditorDecorationType({
    backgroundColor: "rgba(255, 0, 0, 0.3)",
    color: "#ffaaaa",
  });

  private latestTeacherLines: string[] = [];

  public renderAll(teacherLines: string[]) {
    this.latestTeacherLines = teacherLines;
    this.applyDecorations();
  }

  public reRender() {
    if (this.latestTeacherLines.length > 0) this.applyDecorations();
  }

  private applyDecorations() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    // 1. Get User Settings
    const config = vscode.workspace.getConfiguration("ghoststudent");
    const userWantsSmartMatching = config.get<boolean>("smartMatching");
    const errorMode = config.get<string>("errorDisplayMode");
    const strictWhitespace = config.get<boolean>("strictWhitespace");

    // 2. Load Modular Rules based on the current file's language!
    const langId = editor.document.languageId;
    const langRule = getLanguageRule(langId);

    // Smart matching is ON if both the user setting is true AND the language supports it
    const smartMatching = userWantsSmartMatching && langRule.useSmartMatching;

    const tabSize = Number(editor.options.tabSize) || 4;
    const formatText = (text: string) =>
      text.replace(/\t/g, " ".repeat(tabSize));

    const studentDoc = editor.document;
    const ghostDecorations: vscode.DecorationOptions[] = [];
    const errorDecorations: vscode.DecorationOptions[] = [];

    let futureLines: string[] = [];

    for (let i = 0; i < this.latestTeacherLines.length; i++) {
      const tText = this.latestTeacherLines[i];

      if (i >= studentDoc.lineCount) {
        futureLines.push(formatText(tText));
        continue;
      }

      const sText = studentDoc.lineAt(i).text;
      let s = 0;
      let t = 0;

      // ==========================================
      // PREFIX SCAN
      // ==========================================
      while (s < sText.length && t < tText.length) {
        if (!strictWhitespace) {
          const sIsWs = sText[s] === " " || sText[s] === "\t";
          const tIsWs = tText[t] === " " || tText[t] === "\t";
          if (sIsWs && tIsWs) {
            while (s < sText.length && (sText[s] === " " || sText[s] === "\t"))
              s++;
            while (t < tText.length && (tText[t] === " " || tText[t] === "\t"))
              t++;
            continue;
          }
        }
        if (sText[s] === tText[t]) {
          s++;
          t++;
        } else {
          break;
        }
      }

      // ==========================================
      // SUBSEQUENCE SCAN (Smart Matching)
      // ==========================================
      let isSubsequenceMatch = false;
      let chunks: { index: number; text: string }[] = [];

      if (smartMatching && s < sText.length) {
        let currS = s;
        let currT = t;
        let currentChunk = "";

        while (currS < sText.length && currT < tText.length) {
          if (!strictWhitespace) {
            while (
              currS < sText.length &&
              (sText[currS] === " " || sText[currS] === "\t")
            )
              currS++;
          }
          if (currS >= sText.length) break;

          if (sText[currS] === tText[currT]) {
            if (currentChunk !== "") {
              chunks.push({ index: currS, text: currentChunk });
              currentChunk = "";
            }
            currS++;
            currT++;
          } else {
            currentChunk += tText[currT];
            currT++;
          }
        }

        if (currS === sText.length) {
          isSubsequenceMatch = true;
          if (currT < tText.length) currentChunk += tText.substring(currT);
          if (currentChunk !== "")
            chunks.push({ index: currS, text: currentChunk });
        }
      }

      // ==========================================
      // RENDER LOGIC
      // ==========================================
      if (s === sText.length || isSubsequenceMatch) {
        // MATCH
        if (s === sText.length) {
          const remaining = tText.substring(t);
          if (remaining.length > 0) {
            ghostDecorations.push({
              range: new vscode.Range(i, sText.length, i, sText.length),
              renderOptions: { after: { contentText: formatText(remaining) } },
            });
          }
        } else {
          for (const chunk of chunks) {
            ghostDecorations.push({
              range: new vscode.Range(i, chunk.index, i, chunk.index),
              renderOptions: { after: { contentText: formatText(chunk.text) } },
            });
          }
        }
      } else {
        // TYPO
        errorDecorations.push({
          range: new vscode.Range(i, s, i, sText.length),
        });

        if (errorMode === "Show Expected Comment") {
          const correctRemaining = tText.substring(t);
          // Use the modular language rule to format the comment!
          const formattedComment = langRule.formatExpected(correctRemaining);

          ghostDecorations.push({
            range: new vscode.Range(i, sText.length, i, sText.length),
            renderOptions: {
              after: { contentText: formatText(formattedComment) },
            },
          });
        } else {
          const remaining = tText.substring(t);
          ghostDecorations.push({
            range: new vscode.Range(i, sText.length, i, sText.length),
            renderOptions: { after: { contentText: formatText(remaining) } },
          });
        }
      }
    }

    // ==========================================
    // MULTI-LINE FUTURE BLOCK
    // ==========================================
    if (futureLines.length > 0) {
      const lastIdx = studentDoc.lineCount - 1;
      const lastLen = studentDoc.lineAt(lastIdx).text.length;

      let content = futureLines.join("\n");
      if (lastLen > 0) content = "\n" + content;

      // Use the modular language rule to format the comment block!
      const finalContent = langRule.formatFutureLines(content);

      ghostDecorations.push({
        range: new vscode.Range(lastIdx, lastLen, lastIdx, lastLen),
        renderOptions: { after: { contentText: finalContent } },
      });
    }

    editor.setDecorations(this.ghostStyle, ghostDecorations);
    editor.setDecorations(this.errorStyle, errorDecorations);
  }
}
