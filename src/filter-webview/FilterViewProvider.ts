import { Filter } from "../rest-api/Endpoints";
import { getUri } from "../utilities/getUri";
import { generateNonce } from "../utilities/getNonce";
import * as vscode from "vscode";

export class FilterViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly initialFilter: Filter,
    private readonly projectsMap: Record<string, string>,
    private readonly personsMap: Record<string, string>
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
          if (this._view) {
            this._view.webview.postMessage({ type: "setProjects", projects: this.projectsMap });
            this._view.webview.postMessage({ type: "setPersons", persons: this.personsMap });

            this.setFilter(this.initialFilter);
          }
          break;
        }
        case "changeFilter": {
          vscode.commands.executeCommand("patchwork.changeFilter", data.value);
          break;
        }
      }
    });
  }

  public setFilter(f?: Filter) {
    if (this._view) {
      this._view.webview.postMessage({ type: "setFilter", filter: f });
    }
  }

  public clearFilter() {
    this.setFilter();
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
        <vscode-text-field class="filter-input" id="query-input" placeholder="Search">
          <span slot="start" class="codicon codicon-search"></span>
        </vscode-text-field>

        <div class="filter-input">
          <div>Project</div>
          <vscode-dropdown id="project-input">
            <vscode-option value>All projects</vscode-option>
          </vscode-dropdown>
        </div>

        <div class="filter-input">
          <div>Submitter</div>
          <vscode-dropdown id="submitter-input">
            <vscode-option value>All submitters</vscode-option>
          </vscode-dropdown>
        </div>

        <vscode-text-field class="filter-input" id="before-input" placeholder="Before">
          <span slot="start" class="codicon codicon-chevron-left"></span>
        </vscode-text-field>

        <vscode-text-field class="filter-input" id="since-input" placeholder="Since">
          <span slot="start" class="codicon codicon-chevron-right"></span>
        </vscode-text-field>
      </body>
      </html>`;
  }
}
