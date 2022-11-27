import { createHash } from "crypto";
import * as vscode from "vscode";

export function gravatarUri(email: string, size: number = 16): vscode.Uri | undefined {
  // Documented at https://en.gravatar.com/site/implement/images/
  const emailHash = createHash("md5").update(email?.trim()?.toLowerCase()).digest("hex");
  const gravatarUrl = `https://www.gravatar.com/avatar/${emailHash}?s=${size}&d=retro`;
  const uri = vscode.Uri.parse(`${gravatarUrl}&s=${64}`);

  // Fix encoding
  const originalUriToString = uri.toString;
  uri.toString = function (_skipEncoding?: boolean | undefined) {
    return originalUriToString.call(uri, true);
  };

  return uri;
}
