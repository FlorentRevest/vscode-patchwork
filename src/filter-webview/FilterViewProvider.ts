import { getUri } from "../utilities/getUri";
import { generateNonce } from "../utilities/getNonce";
import * as vscode from "vscode";

export class FilterViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "getContent": {
          vscode.commands.executeCommand("patchwork.refreshFilterContent");
          break;
        }
        case "changeSearch": {
          vscode.commands.executeCommand("patchwork.changeSearch", data.value);
          break;
        }
        case "changeProject": {
          vscode.commands.executeCommand("patchwork.changeProject");
          break;
        }
        case "changeSubmitter": {
          vscode.commands.executeCommand("patchwork.changeSubmitter");
          break;
        }
      }
    });
  }

  public setFilter(query: string, project: string, submitter: string) {
    if (this._view) {
      this._view.webview.postMessage({ type: "setFilter", query: query, project: project, submitter: submitter });
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const toolkitUri = getUri(webview, this._extensionUri, [
      "node_modules",
      "@vscode",
      "webview-ui-toolkit",
      "dist",
      "toolkit.js",
    ]);
    const codiconsUri = getUri(webview, this._extensionUri, [
      "node_modules",
      "@vscode/codicons",
      "dist",
      "codicon.css",
    ]);
    const styleUri = getUri(webview, this._extensionUri, [
      "src",
      "filter-webview",
      "filter-view.css",
    ]);
    const scriptUri = getUri(webview, this._extensionUri, [
      "src",
      "filter-webview",
      "filter-view.js",
    ]);
    const nonce = generateNonce();

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        <script type="module" nonce="${nonce}" src="${toolkitUri}"></script>
        <link rel="stylesheet" href="${codiconsUri}">
        <link rel="stylesheet" href="${styleUri}">
        <title>Filter</title>
      </head>
      <body id="webview-body">
        <vscode-text-field class="filter-input" id="query-input">
          Title contains:
          <span slot="start" class="codicon codicon-search"></span>
        </vscode-text-field>

        <div id="project-input-wrapper" class="clickable">
          <vscode-text-field class="filter-input not-clickable" id="project-input">
            In project:
            <span slot="start" class="codicon codicon-organization"></span>
          </vscode-text-field>
        </div>

        <div id="submitter-input-wrapper" class="clickable">
          <vscode-text-field class="filter-input not-clickable" id="submitter-input">
            Sent by:
            <span slot="start" class="codicon codicon-person"></span>
          </vscode-text-field>
        </div>
      </body>
      </html>`;
  }
}
