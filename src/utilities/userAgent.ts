import * as vscode from "vscode";

export function userAgent(context: vscode.ExtensionContext): string {
  return "vscode-patchwork " + context.extension.packageJSON.version;
}
