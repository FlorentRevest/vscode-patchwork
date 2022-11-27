import React from "react";
import { HunkView } from "./HunkView";
import parser, { Hunk, File } from "gitdiff-parser";
import { VSCodeDivider, VSCodeLink } from "@vscode/webview-ui-toolkit/react";

export const FileDiffView = ({ file }: { file: File }) => {
  // Actions for file titles, trigger a vscode.open command out of the webview
  let openFile = (path: string) => {
    vscode.postMessage({ command: "openFile", path: path });
  };
  let openNewFile = () => {
    openFile(file.newPath);
  };
  let openOldFile = () => {
    openFile(file.oldPath);
  };

  // Lay out all modified hunks
  return (
    <div>
      <VSCodeDivider/>
      <h2>
        {file.oldPath !== file.newPath ? (
          <>
            <VSCodeLink onClick={openOldFile}>{file.oldPath}</VSCodeLink>
            {" → "}
          </>
        ) : (
          <></>
        )}
        <VSCodeLink onClick={openNewFile}>{file.newPath}</VSCodeLink>
      </h2>

      {file.hunks.map((hunk: Hunk) => (
        <HunkView key={hunk.content} hunk={hunk} file={file} />
      ))}
    </div>
  );
};

export const DiffView = ({ diffText }: { diffText: string }) => {
  // If gitdiff-parser manages to parse the diff,
  try {
    const files = parser.parse(diffText);
    // Lay out all modified files
    return (
      <div>
        {files.map((f: File, i: number) => (
          <FileDiffView key={i} file={f} />
        ))}
      </div>
    );
  } catch (e) {
    // Or fallback to showing the plain diff
    return <p>{diffText}</p>;
  }
};
