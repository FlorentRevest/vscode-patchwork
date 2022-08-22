import { Event, EventEmitter, TreeDataProvider, TreeItem, TreeItemCollapsibleState } from "vscode";
import { PatchesService, SeriesService, Filter } from "../rest-api/Endpoints";
import { Patch, Series } from "../rest-api/Types";
import { gravatarUri } from "../utilities/gravatarUri";

type PossibleNode = SeriesNode | PatchNode | FetchMoreNode;
type TreeDataOnChangeEvent = PossibleNode | undefined | null | void;

export class SeriesDataProvider implements TreeDataProvider<PossibleNode> {
  private _onDidChangeTreeData = new EventEmitter<TreeDataOnChangeEvent>();
  readonly onDidChangeTreeData: Event<TreeDataOnChangeEvent> = this._onDidChangeTreeData.event;

  children: PossibleNode[];
  seriesService: SeriesService;
  currentFilter: Filter;
  currentPage: number;

  constructor(currentFilter: Filter) {
    this.children = [];
    this.seriesService = new SeriesService();
    this.currentFilter = currentFilter;
    this.currentPage = 1;
  }

  async nodeForSeries(s: Series): Promise<PossibleNode> {
    const patchesService = new PatchesService();
    if (!s.cover_letter && s.patches.length === 1) {
      const patchReply = await patchesService.getById(s.patches[0].id);
      const patch = patchReply.data;
      return new PatchNode(patch);
    } else {
      return new SeriesNode(s);
    }
  }

  async refresh(f: Filter): Promise<void> {
    this.currentFilter = f;
    this.currentPage = 1;
    this.children = [];
    this._onDidChangeTreeData.fire();

    const series = await this.seriesService.getByPage(1, this.currentFilter);
    const seriesData = series.data;

    this.children = await Promise.all(seriesData.map(this.nodeForSeries));

    const linkHeader = series.headers["link"];
    if (linkHeader && linkHeader.indexOf('rel="next"')) {
      this.children.push(new FetchMoreNode());
    }

    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: PossibleNode): TreeItem | Thenable<TreeItem> {
    return element;
  }

  async getChildren(element?: PossibleNode): Promise<PossibleNode[]> {
    if (element === undefined) {
      return this.children;
    }
    return await element.getChildren();
  }

  async loadMore() {
    this.currentPage++;

    const series = await this.seriesService.getByPage(this.currentPage, this.currentFilter);
    const seriesData = series.data;

    const newChildren: PossibleNode[] = await Promise.all(seriesData.map(this.nodeForSeries));
    this.children.pop();
    this.children.push(...newChildren);

    const linkHeader = series.headers["link"];
    if (linkHeader && linkHeader.indexOf('rel="next"')) {
      this.children.push(new FetchMoreNode());
    }

    this._onDidChangeTreeData.fire();
  }
}

class SeriesNode extends TreeItem {
  private patchesIds: number[];

  constructor(series: Series) {
    super(series.name);
    this.id = series.id.toString();
    this.iconPath = gravatarUri(series.submitter.email);
    this.patchesIds = series.patches.map((p) => p.id);
    this.collapsibleState = TreeItemCollapsibleState.Collapsed;
    this.command = {
      title: "Show series",
      command: "patchwork.showPanel",
      arguments: [series],
    };
  }

  async getChildren(): Promise<PatchNode[]> {
    const patchesService = new PatchesService();
    return Promise.all(
      this.patchesIds.map(async (id) => {
        const patchReply = await patchesService.getById(id);
        const patch = patchReply.data;
        return new PatchNode(patch);
      })
    );
  }
}

class PatchNode extends TreeItem {
  constructor(patch: Patch) {
    super(patch.name);
    this.id = patch.id.toString();
    this.iconPath = gravatarUri(patch.submitter.email);
    this.command = {
      title: "Show patch",
      command: "patchwork.showPanel",
      arguments: [patch],
    };
  }

  async getChildren(): Promise<PatchNode[]> {
    return [];
  }
}

class FetchMoreNode extends TreeItem {
  constructor() {
    super("Load more...");
    this.command = {
      title: "Load more",
      command: "patchwork.loadMoreSeries",
      arguments: [],
    };
  }

  async getChildren(): Promise<PatchNode[]> {
    return [];
  }
}
