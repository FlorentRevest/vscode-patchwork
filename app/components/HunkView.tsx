import React, { useState } from "react";
import { Change, File, Hunk } from "gitdiff-parser";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { DiffEditor } from "@monaco-editor/react";

// Middle-man the line number display to introduce a fixed offset
function lineNumberShift(shift: number) {
  return (i: number) => {
    return (i + shift - 1).toString();
  };
}

// Infer a file format supported by Monaco from a path's file extension
function languageForFile(filePath: string) {
  if (filePath.endsWith(".c") || filePath.endsWith(".h")) {
    return "c";
  } else if (filePath.endsWith(".cpp") || filePath.endsWith(".cc")) {
    return "cpp";
  } else if (filePath.endsWith(".rst")) {
    return "restructuredtext";
  } else if (filePath.endsWith(".sh")) {
    return "shell";
  }
  return undefined;
}

export const HunkView = ({ hunk, file }: { hunk: Hunk; file: File }) => {
  const [height, setHeight] = useState(100);

  // Once the sub editors have been drawn, fix their line numbers and calculate the height of the hunk
  const handleEditorDidMount = (editor: monaco.editor.IDiffEditor) => {
    const originalEditor = editor.getOriginalEditor();
    const modifiedEditor = editor.getModifiedEditor();

    originalEditor.updateOptions({
      lineNumbers: lineNumberShift(hunk.oldStart),
      scrollbar: { vertical: "hidden" },
    });
    modifiedEditor.updateOptions({
      lineNumbers: lineNumberShift(hunk.newStart),
      scrollbar: { vertical: "hidden" },
    });

    let newHeight = Math.max(originalEditor.getContentHeight(), modifiedEditor.getContentHeight());
    newHeight += originalEditor.getLayoutInfo().horizontalScrollbarHeight;
    setHeight(newHeight);
    editor.layout();
  };

  // Reconstruct the left and right sides of the diff from gitdiff-parser Hunks
  let originalText = "";
  let modifiedText = "";
  hunk.changes.forEach((change: Change) => {
    switch (change.type) {
      case "insert":
        modifiedText = modifiedText.concat(change.content, "\n");
        break;
      case "delete":
        originalText = originalText.concat(change.content, "\n");
        break;
      case "normal":
        originalText = originalText.concat(change.content, "\n");
        modifiedText = modifiedText.concat(change.content, "\n");
        break;
    }
  });

  // Enable Monaco's dark-mode if this VSCode extension uses a dark theme
  let theme = undefined;
  const body = document.querySelector("body");
  if (body && body.classList.contains("vscode-dark")) {
    theme = "vs-dark";
  }

  // Tweak the Monaco Diff UI to our needs
  const options: monaco.editor.IDiffEditorConstructionOptions = {
    scrollBeyondLastLine: false,
    readOnly: true,
    domReadOnly: true,
    overviewRulerLanes: 0,
    renderOverviewRuler: false,
    enableSplitViewResizing: false,
    scrollbar: { horizontal: "visible", verticalScrollbarSize: 0, alwaysConsumeMouseWheel: false },
  };

  return (
    <>
      <h5>{hunk.content}</h5>
      <div style={{ height }}>
        <DiffEditor
          original={originalText}
          modified={modifiedText}
          language={languageForFile(file.newPath)}
          theme={theme}
          onMount={handleEditorDidMount}
          options={options}
        />
      </div>
    </>
  );
};
