import { ForestInstance, ForestService } from "4rest";
import { Patch, Project, Series } from "./Types";

export interface Filter {
  query: string;
  project: string;
  submitter: string;
  before: string;
  since: string;
}

function stringValueOrUndefined(str: string) {
  return str === "" ? undefined : str;
}

export class SeriesService extends ForestService<Series> {
  constructor(forestInstance: ForestInstance) {
    super("series", forestInstance);
  }
  public getByPage = (page: number, f: Filter) =>
    this.methodsCreator.get<Series>({
      config: {
        params: {
          page: page,
          order: "-id",
          q: stringValueOrUndefined(f.query),
          project: stringValueOrUndefined(f.project),
          submitter: stringValueOrUndefined(f.submitter),
          before: stringValueOrUndefined(f.before),
          since: stringValueOrUndefined(f.since),
        },
      },
    })();
}

export class PatchesService extends ForestService<Patch> {
  constructor(forestInstance: ForestInstance) {
    super("patches", forestInstance);
  }
}

export class ProjectsService extends ForestService<Project> {
  constructor(forestInstance: ForestInstance) {
    super("projects", forestInstance);
  }
}
