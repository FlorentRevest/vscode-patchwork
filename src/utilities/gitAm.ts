import * as fs from "fs";
import axios from "axios";
import * as vscode from "vscode";

export function gitAm(mboxUri: string) {
  // Download the mbox
  axios({
    url: mboxUri,
    method: "GET",
    responseType: "blob",
  }).then((response) => {
    // Handle errors
    if (!response.status) {
      vscode.window.showErrorMessage(`Failed to download ${response.statusText}`);
      return;
    }

    // Write to disk
    let out = "/tmp/vscode-patchwork-mbox-" + Math.random().toString(36).slice(-5);
    fs.writeFileSync(out, response.data, {encoding: null});

    // Spawn git am
    let terminal = vscode.window.createTerminal("git am");
    terminal.show();
    terminal.sendText("git am -3 " + out, true);
  });
}
