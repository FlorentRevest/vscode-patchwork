const vscode = acquireVsCodeApi();

window.addEventListener("load", main);

function main() {
  const queryInput = document.getElementById("query-input");
  const projectInputWrapper = document.getElementById("project-input-wrapper");
  const projectInput = document.getElementById("project-input");
  const submitterInputWrapper = document.getElementById("submitter-input-wrapper");
  const submitterInput = document.getElementById("submitter-input");

  queryInput.addEventListener("change", () => {
    vscode.postMessage({type: "changeSearch", value: queryInput.value});
  });
  projectInputWrapper.addEventListener("click", () => {
    vscode.postMessage({type: "changeProject"});
  });
  submitterInputWrapper.addEventListener("click", () => {
    vscode.postMessage({type: "changeSubmitter"});
  });

  window.addEventListener("message", (event) => {
    const message = event.data;
    switch (message.type) {
      case "setFilter":
        queryInput.value = message.query;
        projectInput.value = message.project;
        submitterInput.value = message.submitter;
        break;
    }
  });

  vscode.postMessage({ type: "getContent" });
}
