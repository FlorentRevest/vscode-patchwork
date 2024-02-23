import { forest, ForestInstance } from "4rest";
import { Event, EventEmitter, TreeDataProvider, TreeItem, TreeItemCollapsibleState } from "vscode";
import { PatchesService, CoverLetterService, SeriesService, Filter } from "../rest-api/Endpoints";
import { Patch, Series } from "../rest-api/Types";
import { gravatarUri } from "../utilities/gravatarUri";
import { makeURL } from "../utilities/config";
import * as vscode from "vscode";
import { userAgent } from "../utilities/userAgent";

type PossibleNode = SeriesNode | PatchNode | FetchMoreNode;
type TreeDataOnChangeEvent = PossibleNode | undefined | null | void;

export class SeriesDataProvider implements TreeDataProvider<PossibleNode> {
  private _onDidChangeTreeData = new EventEmitter<TreeDataOnChangeEvent>();
  readonly onDidChangeTreeData: Event<TreeDataOnChangeEvent> = this._onDidChangeTreeData.event;

  children: PossibleNode[];
  forestInstance: ForestInstance;
  seriesService: SeriesService;
  currentFilter: Filter;
  currentPage: number;
  runningQuery?: AbortController;

  constructor(currentFilter: Filter, context: vscode.ExtensionContext) {
    this.forestInstance = forest.create({
      axiosSettings: {
        baseURL: makeURL("/api/"),
        headers: { 'User-Agent': userAgent(context) },
      },
    });
    this.children = [];
    this.seriesService = new SeriesService(this.forestInstance);
    this.currentFilter = currentFilter;
    this.currentPage = 1;
  }

  async nodeForSeries(s: Series): Promise<PossibleNode> {
    const patchesService = new PatchesService(this.forestInstance);
    if (!s.cover_letter && s.patches.length === 1) {
      const patchReply = await patchesService.getById(s.patches[0].id);
      const patch = patchReply.data;
      return new PatchNode(patch);
    } else {
      return new SeriesNode(s, this.forestInstance);
    }
  }

  async patchForMessageId(messageId: string): Promise<Patch | Series | undefined> {
    const patchesService = new PatchesService(this.forestInstance);
    const coverLetterService = new CoverLetterService(this.forestInstance);
    let [patchReply, coverLetterReply] = await Promise.all(
      [patchesService.getByMessageId(messageId), coverLetterService.getByMessageId(messageId)]);

    // If a patch is found, enrich it
    const patches = patchReply.data;
    if (patches.length) {
      patchReply = await patchesService.getById(patches[0].id);
      return patchReply.data;
    }

    // If a cover letter is found, get to its Series
    const coverLetters = coverLetterReply.data;
    if (coverLetters.length) {
      let seriesReply = await this.seriesService.getById(coverLetters[0].series[0].id);
      return seriesReply.data;
    }

    // And if nothing is found, bail out
    return undefined;
  }

  async refresh(f: Filter): Promise<void> {
    if (this.runningQuery) {
      this.runningQuery.abort();
      this.runningQuery = undefined;
    }

    this.currentFilter = f;
    this.currentPage = 1;
    this.children = [new SearchingNode()];
    this._onDidChangeTreeData.fire();

    this.runningQuery = new AbortController();
    const series = await this.seriesService.getByPage(1, this.currentFilter, this.runningQuery.signal);
    const seriesData = series.data;

    if (seriesData.length) {
      this.children = await Promise.all(seriesData.map((s: Series) => { return this.nodeForSeries(s); }));

      const linkHeader = series.headers["link"];
      if (linkHeader && linkHeader.indexOf('rel="next"')) {
        this.children.push(new FetchMoreNode());
      }
    } else {
      this.children = [new EmptyNode()];
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
    if (this.runningQuery) {
      this.runningQuery.abort();
      this.runningQuery = undefined;
    }

    this.children.pop();
    this.children.push(new SearchingNode());
    this._onDidChangeTreeData.fire();

    this.currentPage++;
    this.runningQuery = new AbortController();
    const series = await this.seriesService.getByPage(this.currentPage, this.currentFilter, this.runningQuery.signal);
    const seriesData = series.data;

    const newChildren = await Promise.all(seriesData.map((s: Series) => { return this.nodeForSeries(s); }));
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
  private forestInstance: ForestInstance;

  constructor(series: Series, forestInstance: ForestInstance) {
    super(series.name);
    this.id = series.id.toString();
    this.iconPath = gravatarUri(series.submitter.email);
    this.patchesIds = series.patches.map((p) => p.id);
    this.collapsibleState = TreeItemCollapsibleState.Collapsed;
    this.forestInstance = forestInstance;
    this.command = {
      title: "Show series",
      command: "patchwork.showPanel",
      arguments: [series],
    };
  }

  async getChildren(): Promise<PatchNode[]> {
    const patchesService = new PatchesService(this.forestInstance);
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

class SearchingNode extends TreeItem {
  constructor() {
    super("Searching...");
  }
  async getChildren(): Promise<PatchNode[]> {
    return [];
  }
}

class EmptyNode extends TreeItem {
  constructor() {
    super("No results found");
  }
  async getChildren(): Promise<PatchNode[]> {
    return [];
  }
}
