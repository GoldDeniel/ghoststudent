# Ghost Student 👻👨‍💻

**Ghost Student** is a real-time, collaborative teaching extension for VS Code. It allows a teacher to broadcast their code directly into their students' editors as "Ghost Text" (similar to GitHub Copilot's auto-complete).

Instead of constantly looking back and forth between a projector/screen-share and their own screen, students can follow the teacher's code right inside their own editor!

## ✨ Features

- **Real-Time Ghost Text:** Students see what the teacher types instantly as grey, italicized text.
- **Smart Matching:** Intelligently handles VS Code's auto-closing tags. If a student types `<meta charset="` and VS Code auto-closes the `">`, the ghost text will flawlessly inject the missing code _between_ the quotes!
- **Typo Detection:** If a student makes a typo, the incorrect characters are highlighted in **red**, and the expected code is shown to help them correct it.
- **Whitespace Forgiveness:** Automatically snaps ghost text to the student's cursor, allowing students to use different tab/space sizes than the teacher without breaking the ghost text.
- **Auto-Line Creation:** Automatically drops the student down to new lines as the teacher creates them.

---

## 👨‍🏫 How to Use: Teacher (Host)

1. Open the file you want to teach from.
2. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).
3. Type and select **`Ghost Student: Host`**.
4. You will see a notification that you are hosting on port `8765`.
5. Tell your students your computer's IP address (or `localhost` if testing on the same machine).
6. _Optional:_ Use **`Ghost Student: Toggle Broadcasting`** to pause/resume sending code to students at any time.

## 🎓 How to Use: Student (Client)

1. Open a blank file (make sure it's the same language/file extension as the teacher's).
2. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).
3. Type and select **`Ghost Student: Connect`**.
4. Enter the Teacher's IP address (leave blank for `localhost`).
5. Start typing! Follow the grey ghost text. If you make a mistake, it will turn red.

---

## ⚙️ Extension Settings

You can customize how Ghost Student behaves by going to VS Code **Settings** (`Ctrl+,` or `Cmd+,`) and searching for **Ghost Student**.

| Setting                | Description                                                                                                                             | Default               |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| **Auto Create Lines**  | Automatically inserts empty lines in the student's file if the teacher creates new lines.                                               | `true`                |
| **Smart Matching**     | Intelligently handles auto-closed tags and brackets (e.g., injects ghost text perfectly inside `<title></title>`).                      | `true`                |
| **Error Display Mode** | Choose between _"Continue Ghost Text"_ (seamless flow) or _"Show Expected Comment"_ (adds `// Expected:` next to typos).                | `Continue Ghost Text` |
| **Strict Whitespace**  | If ON, tabs and spaces must match the teacher exactly. If OFF, ghost text snaps to the user's code and ignores indentation differences. | `false`               |

---

## ⌨️ Commands

- `ghoststudent.host` - Start the Teacher broadcast server.
- `ghoststudent.connect` - Connect a Student to a Teacher.
- `ghoststudent.toggle` - Turn Teacher broadcasting ON or OFF.

---

## 🔌 Network Requirements

- This extension uses raw TCP WebSockets on **Port 8765**.
- If students are on the same local network (e.g., a classroom WiFi), they can connect using the Teacher's Local IP (e.g., `192.168.x.x`).
- Ensure your computer's firewall allows incoming connections on Port 8765.

---

**Happy Teaching!** 🎉

(Disclaimer: The entire thing is vibe coded)
