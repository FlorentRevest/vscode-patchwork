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

export async function activate(context: ExtensionContext) {
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
      filterProvider.setFilter(f);
    }
  };

  // Series tree view
  const seriesDataProvider = new SeriesDataProvider(currentFilter);
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

  // Fetch once the list of projects and persons
  const databaseDom = await fetchAPIHTMLPage();
  const projectsMap = getProjects(databaseDom);
  const personsMap = getPersons(databaseDom);

  // Filter view
  const filterProvider = new FilterViewProvider(context.extensionUri, currentFilter, projectsMap, personsMap);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("patchwork.filter", filterProvider)
  );

  // Panel for Series of Patches detailed information
  let panel: WebviewPanel | undefined = undefined;

  // Commands
  context.subscriptions.push(
    commands.registerCommand("patchwork.showPanel", async (payload: Series | Patch) => {
      if (!panel) {
        panel = getNewPanel(context.extensionUri, payload);
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
    commands.registerCommand("patchwork.clearFilter", () => {
      changeFilter(emptyFilter);
    })
  );
}
