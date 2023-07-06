import { Patch } from "../rest-api/Types";
import * as vscode from "vscode";
import * as fs from "fs";

export function generateReplyTo(email: Patch): vscode.Uri {
  const path = "/tmp/reply-" + Math.random().toString(36).slice(-5) + ".mbox";

  let ccEmails = new Set<string>();
  for (const key in email.headers) {
    if (key === "Cc" || key === "To") {
      email.headers[key].split(',').forEach(email => ccEmails.add(email.trim()));
    }
  }
  const ccs = Array.from(ccEmails).map(email => "Cc: " + email + "\n").join("");
  const subject = (email.name.startsWith("Re: ") ? "" : "Re: ") + email.name;
  const lines = email.content.split("\n").concat(email.diff.split("\n"));
  const quotedLines = lines.map(line => "> " + line);

  const content = "README: When ready, send this with:\n" +
                  "  tail -n +5 " + path + " > /tmp/reply               # Trim this README\n" +
                  "  git send-email --to '' /tmp/reply                           # Send the email\n" +
                  "\n" +
                  "Subject: " + subject + "\n" +
                  "In-Reply-To: " + email.msgid + "\n" +
                  "To: " + email.submitter.email + "\n" +
                  ccs +
                  "\n" +
                  quotedLines.join("\n");

  fs.writeFile(path, content,
    (err) => { if (err) { vscode.window.showErrorMessage("Failed to write reply"); } });

  return vscode.Uri.parse(path);
}