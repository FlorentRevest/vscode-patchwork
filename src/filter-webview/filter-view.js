const vscode = acquireVsCodeApi();

window.addEventListener("load", main);

function addOption(dropdown, text, value) {
  var option = document.createElement("vscode-option");
  option.setAttribute("value", value);
  const content = document.createTextNode(text);
  option.appendChild(content);
  dropdown.appendChild(option);
}

function main() {
  const queryInput = document.getElementById("query-input");
  const projectInput = document.getElementById("project-input");
  const submitterInput = document.getElementById("submitter-input");
  const beforeInput = document.getElementById("before-input");
  const sinceInput = document.getElementById("since-input");

  const changeFilter = () => {
    vscode.postMessage({
      type: "changeFilter",
      value: {
        query: queryInput.value,
        project: projectInput.value,
        submitter: submitterInput.value,
        before: beforeInput.value,
        since: sinceInput.value,
      },
    });
  };
  queryInput.addEventListener("change", () => {
    changeFilter();
  });
  projectInput.addEventListener("change", () => {
    changeFilter();
  });
  submitterInput.addEventListener("change", () => {
    changeFilter();
  });
  beforeInput.addEventListener("change", () => {
    changeFilter();
  });
  sinceInput.addEventListener("change", () => {
    changeFilter();
  });

  window.addEventListener("message", (event) => {
    const message = event.data;
    switch (message.type) {
      case "setFilter":
        if (message.filter) {
          queryInput.value = message.filter.query;
          projectInput.value = message.filter.project;
          submitterInput.value = message.filter.submitter;
          beforeInput.value = message.filter.before;
          sinceInput.value = message.filter.since;
        } else {
          queryInput.value = "";
          projectInput.value = "";
          submitterInput.value = "";
          beforeInput.value = "";
          sinceInput.value = "";
        }
        break;
      case "setPersons":
        if (submitterInput.children.length !== 1) {
          submitterInput.innerHTML = '';
          addOption(submitterInput, "All submitters", "");
        }
        for (var key in message.persons) {
          addOption(submitterInput, message.persons[key], key);
        }
        break;
      case "setProjects":
        if (projectInput.children.length !== 1) {
          projectInput.innerHTML = '';
          addOption(projectInput, "All projects", "");
        }
        for (var key in message.projects) {
          addOption(projectInput, message.projects[key], key);
        }
        break;
    }
  });

  vscode.postMessage({ type: "getContent" });
}
