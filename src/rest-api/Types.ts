// These types are exposed by the Patchwork REST APIs

export interface User {
  id: number;
  url: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface Person {
  id: number;
  url: string;
  name: string;
  email: string;
}

export interface Project {
  id: number;
  url: string;
  name: string;
  link_name: string;
  list_id: string;
  list_email: string;
  web_url: string;
  scm_url: string;
  webscm_url: string;
  list_archive_url: string;
  list_archive_url_format: string;
  commit_url_format: string;
}

export interface SeriesSummary {
  id: number;
  url: string;
  web_url: string;
  date: string;
  name: string;
  version: number;
  mbox: string;
}

export interface Series extends SeriesSummary {
  project: Project;
  submitter: Person;
  total: number;
  received_total: number;
  received_all: boolean;
  cover_letter: PatchSummary;
  patches: PatchSummary[];
}

export interface PatchSummary {
  id: number;
  url: string;
  web_url: string;
  msgid: string;
  list_archive_url: string;
  date: string;
  name: string;
  mbox: string;
}

export interface Patch extends PatchSummary {
  project: Project;
  commit_ref: string;
  pull_url: string;
  state: string;
  archived: boolean;
  hash: string;
  submitter: Person;
  delegate: User;
  series: SeriesSummary[];
  comments: string;
  check: string;
  checks: string;
  tags: string[];
  related: PatchSummary[];
  headers: Record<string, string>;
  content: string;
  diff: string;
  prefixes: string[];
}
