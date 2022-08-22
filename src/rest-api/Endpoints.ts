import { forest, ForestInstance, ForestService } from "4rest";
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

// Wrappers around Patchwork REST APIs, using 4rest
const forestInstance: ForestInstance = forest.create({
  axiosSettings: {
    baseURL: "https://patchwork.kernel.org/api/",
  },
});

export class SeriesService extends ForestService<Series> {
  constructor() {
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
  constructor() {
    super("patches", forestInstance);
  }
}

export class ProjectsService extends ForestService<Project> {
  constructor() {
    super("projects", forestInstance);
  }
}
