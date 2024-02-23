import { commands, ExtensionContext, WebviewPanel, window, ViewColumn } from "vscode";
import { SeriesDataProvider } from "./tree-views/SeriesDataProvider";
import { getNewPanel } from "./panel/getNewPanel";
import { FilterViewProvider } from "./filter-webview/FilterViewProvider";
import { Filter } from "./rest-api/Endpoints";
import { Patch, Series } from "./rest-api/Types";
import { gitAm } from "./utilities/gitAm";
import * as vscode from "vscode";
import { fetchAPIHTMLPage, getPersons, getProjects } from "./utilities/fetchAPIHTMLPage";
import { SavedFiltersDataProvider } from "./tree-views/SavedFiltersDataProvider";
import { onConfigurationUpdate } from "./utilities/config";

export async function activate(context: ExtensionContext) {
  // Retrieve the list of projects and persons from cache if available
  let projectsMap: Record<string, string> = context.workspaceState.get("patchwork:projects", {});
  let personsMap: Record<string, string> = context.workspaceState.get("patchwork:persons", {});
  // Asynchronously fetch an updated version
  fetchAPIHTMLPage(context).then((databaseDom: any) => {
    projectsMap = getProjects(databaseDom);
    context.workspaceState.update("patchwork:projects", projectsMap);
    personsMap = getPersons(databaseDom);
    context.workspaceState.update("patchwork:persons", personsMap);
  });

  // Remember the filter from one session to the next
  const emptyFilter = {
    query: "",
    project: "",
    submitter: "",
    before: "",
    since: "",
  };
  let currentFilter: Filter = context.workspaceState.get("patchwork:currentFilter", emptyFilter);
  let changeFilter = (f: Filter) => {
    if (
      currentFilter.query !== f.query ||
      currentFilter.project !== f.project ||
      currentFilter.submitter !== f.submitter ||
      currentFilter.before !== f.before ||
      currentFilter.since !== f.since
    ) {
      currentFilter = f;
      context.workspaceState.update("patchwork:currentFilter", currentFilter);
      seriesDataProvider.refresh(f);
      vscode.commands.executeCommand("patchwork.refreshFilterContent");
    }
  };

  // Series tree view
  const seriesDataProvider = new SeriesDataProvider(currentFilter, context);
  seriesDataProvider.refresh(currentFilter);
  window.createTreeView("patchwork.series", {
    treeDataProvider: seriesDataProvider,
    showCollapseAll: true,
    canSelectMany: false,
  });

  // Saved filters tree view
  const savedFiltersDataProvider = new SavedFiltersDataProvider(context);
  window.createTreeView("patchwork.savedFilters", {
    treeDataProvider: savedFiltersDataProvider,
    showCollapseAll: false,
    canSelectMany: false,
  });

  // Filter view
  const filterProvider = new FilterViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("patchwork.filter", filterProvider)
  );

  // Panel for Series of Patches detailed information
  let panel: WebviewPanel | undefined = undefined;

  // Commands
  context.subscriptions.push(
    commands.registerCommand("patchwork.showPanel", async (payload: Series | Patch) => {
      if (!panel) {
        panel = getNewPanel(context.extensionUri, payload, context);
        panel.onDidDispose(
          () => {
            panel = undefined;
          },
          null,
          context.subscriptions
        );
      } else {
        panel.webview.postMessage({
          command: "setContent",
          content: payload,
        });
      }
      panel.title = payload.name;
    })
  );

  context.subscriptions.push(
    commands.registerCommand("patchwork.apply", (mboxUrl: string) => {
      gitAm(mboxUrl);
    })
  );

  context.subscriptions.push(
    commands.registerCommand("patchwork.refreshSeries", () => {
      seriesDataProvider.refresh(currentFilter);
    })
  );

  context.subscriptions.push(
    commands.registerCommand("patchwork.loadMoreSeries", () => {
      seriesDataProvider.loadMore();
    })
  );

  context.subscriptions.push(
    commands.registerCommand("patchwork.saveFilter", async () => {
      await savedFiltersDataProvider.saveFilter(currentFilter);
    })
  );

  context.subscriptions.push(
    commands.registerCommand("patchwork.deleteFilter", (item: vscode.TreeItem) => {
      if (item.id) {
        savedFiltersDataProvider.deleteFilter(item.id);
      }
    })
  );

  context.subscriptions.push(
    commands.registerCommand("patchwork.changeFilter", (f: Filter) => {
      changeFilter(f);
    })
  );

  context.subscriptions.push(
    commands.registerCommand("patchwork.changeSearch", (q: string) => {
      let newFilter = { ...currentFilter };
      newFilter.query = q;
      changeFilter(newFilter);
    })
  );

  context.subscriptions.push(
    commands.registerCommand("patchwork.changeProject", () => {
      const projects = [{ label: "All projects", id: "" }];
      for (const id in projectsMap) {
        projects.push({ label: projectsMap[id], id: id });
      }

      vscode.window
        .showQuickPick(projects, {
          placeHolder: "Type a project name. E.g: BPF",
        })
        .then((project: { label: string; id: string } | undefined) => {
          if (project) {
            let newFilter = { ...currentFilter };
            newFilter.project = project.id;
            changeFilter(newFilter);
          }
        });
    })
  );

  context.subscriptions.push(
    commands.registerCommand("patchwork.changeSubmitter", () => {
      const submitters = [{ label: "All submitters", id: "" }];
      for (const id in personsMap) {
        submitters.push({ label: personsMap[id], id: id });
      }

      vscode.window
        .showQuickPick(submitters, {
          placeHolder: "Type a submitter name. E.g: Linus",
        })
        .then((submitter: { label: string; id: string } | undefined) => {
          if (submitter) {
            let newFilter = { ...currentFilter };
            newFilter.submitter = submitter.id;
            changeFilter(newFilter);
          }
        });
    })
  );

  context.subscriptions.push(
    commands.registerCommand("patchwork.refreshFilterContent", () => {
      let project = projectsMap[currentFilter.project];
      if (!project) {
        project = "All projects";
      }
      let submitter = personsMap[currentFilter.submitter];
      if (!submitter) {
        submitter = "All submitters";
      }
      filterProvider.setFilter(currentFilter.query, project, submitter);
    })
  );

  context.subscriptions.push(
    commands.registerCommand("patchwork.clearFilter", () => {
      changeFilter(emptyFilter);
    })
  );

  context.subscriptions.push(
    commands.registerCommand("patchwork.open", async (messageId: string, fallback?: vscode.Uri) => {
      const patch = await seriesDataProvider.patchForMessageId(messageId);
      if (patch) {
        commands.executeCommand("patchwork.showPanel", patch);
      } else if (fallback) {
        commands.executeCommand("vscode.open", fallback);
      }
    })
  );

  context.subscriptions.push(onConfigurationUpdate);
}
