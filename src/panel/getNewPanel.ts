import { commands, Uri, ViewColumn, WebviewPanel, Webview, window } from "vscode";
import { Patch, Series } from "../rest-api/Types";
import { getUri } from "../utilities/getUri";
import { userAgent } from "../utilities/userAgent";
import { generateReplyTo } from "../utilities/emailReply";
import axios from "axios";
import * as vscode from "vscode";

export function getNewPanel(extensionUri: Uri, payload: Patch | Series, context: vscode.ExtensionContext): WebviewPanel {
  let panel = window.createWebviewPanel("patchworkDetailView", "", ViewColumn.One, {
    enableScripts: true,
  });

  panel.webview.onDidReceiveMessage(async (message) => {
    switch (message.command) {
      case "apply":
        commands.executeCommand("patchwork.apply", message.mboxUrl);
        break;
      case "getContent":
        panel.webview.postMessage({
          command: "setContent",
          content: payload,
        });
        break;
      case "getCoverLetter":
        const cover_letter = await axios.get<Patch>(message.url, {
          headers: { Accept: "application/json", 'User-Agent': userAgent(context) },
        });
        panel.webview.postMessage({
          command: "setCoverLetter",
          cover_letter: cover_letter.data,
        });
        break;
      case "getComments":
        const comments = await axios.get<Patch[]>(message.url, {
          headers: { Accept: "application/json", 'User-Agent': userAgent(context) },
        });
        panel.webview.postMessage({
          command: "setComments",
          comments: comments.data,
        });
        break;
      case "openFile":
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || !workspaceFolders.length) {
          vscode.window.showErrorMessage("No root workspace");
          return;
        }
        commands.executeCommand(
          "vscode.open",
          Uri.parse(workspaceFolders[0].uri.toString() + "/" + message.path)
        );
        break;
      case "reply":
        commands.executeCommand("vscode.open", generateReplyTo(message.email));
        break;
    }
  });

  const scriptPath = getUri(panel.webview, extensionUri, ["out", "app", "bundle.js"]);
  const codiconsUri = getUri(panel.webview, extensionUri, [
    "node_modules",
    "@vscode/codicons",
    "dist",
    "codicon.css",
  ]);
  panel.webview.html = /*html*/ `
    <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${codiconsUri}" rel="stylesheet" />
        <title></title>
      </head>
      <body>
        <div id="root"></div>
        <script>
          const vscode = acquireVsCodeApi();
        </script>
        <script src="${scriptPath}"></script>
      </body>
    </html>
  `;

  return panel;
}
