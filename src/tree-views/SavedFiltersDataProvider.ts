import { Event, EventEmitter, ProviderResult, TreeDataProvider, TreeItem } from "vscode";
import { v4 as uuidv4 } from "uuid";
import { Filter } from "../rest-api/Endpoints";
import * as vscode from "vscode";

type TreeDataOnChangeEvent = SavedFilterNode | undefined | null | void;

interface SavedFilter {
  id: string;
  name: string;
  filter: Filter;
}

export class SavedFiltersDataProvider implements TreeDataProvider<SavedFilterNode> {
  private _onDidChangeTreeData = new EventEmitter<TreeDataOnChangeEvent>();
  readonly onDidChangeTreeData: Event<TreeDataOnChangeEvent> = this._onDidChangeTreeData.event;

  savedFilters: SavedFilter[];

  constructor(private readonly context: vscode.ExtensionContext) {
    this.savedFilters = context.workspaceState.get("patchwork:savedFilters", []);
  }

  async saveFilter(filter: Filter): Promise<void> {
    const name = await vscode.window.showInputBox({
      placeHolder: 'Enter a filter name, eg: "BPF project"',
      validateInput: (text) => {
        return text === "" ? "Can't be empty!" : null;
      },
    });

    if (name) {
      this.savedFilters.push({ id: uuidv4(), name: name, filter: filter });
      this.savedFilters.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1));
      this.context.workspaceState.update("patchwork:savedFilters", this.savedFilters);
      this._onDidChangeTreeData.fire();
    }
  }

  deleteFilter(id: string) {
    const selectedFilterIndex = this.savedFilters.findIndex((filter) => filter.id === id);
    this.savedFilters.splice(selectedFilterIndex, 1);
    this.context.workspaceState.update("patchwork:savedFilters", this.savedFilters);
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: SavedFilterNode): TreeItem | Thenable<TreeItem> {
    return element;
  }

  getChildren(element?: SavedFilterNode | undefined): ProviderResult<SavedFilterNode[]> {
    if (element === undefined) {
      return this.savedFilters.map((f) => new SavedFilterNode(f));
    }
    return [];
  }
}

class SavedFilterNode extends TreeItem {
  constructor(savedFilter: SavedFilter) {
    super(savedFilter.name);
    this.id = savedFilter.id;
    this.command = {
      title: "Use filter",
      command: "patchwork.changeFilter",
      arguments: [savedFilter.filter],
    };
  }
}
