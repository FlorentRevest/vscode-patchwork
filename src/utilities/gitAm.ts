import * as child_process from "child_process";
import * as stream from "stream";
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

    // Calculate the cwd (current working directory) for git am
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || !workspaceFolders.length) {
      vscode.window.showErrorMessage("No root workspace");
      return;
    }

    // Start git am
    let child = child_process.execFile(
      "/usr/bin/git",
      ["am"],
      { cwd: workspaceFolders[0].uri.path },
      (error, _stdout, stderr) => {
        // Notify the user of completion
        if (error) {
          vscode.window.showErrorMessage(`Failed to apply! ${stderr}`);
        } else {
          vscode.window.showInformationMessage("Applied successfully!");
        }
      }
    );

    // Pipe the mbox into git's stdin
    if (child.stdin) {
      var stdinStream = new stream.Readable();
      stdinStream.push(response.data);
      stdinStream.push(null);
      stdinStream.pipe(child.stdin);
    }
  });
}
